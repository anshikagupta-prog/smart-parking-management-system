require("dotenv").config();

const bcrypt = require("bcrypt");
const pool = require("../config/db");

const DEMO = {
    admin: {
        name: "Demo Administrator",
        email: "admin@smartparking.local",
        password: "Admin@123"
    },
    user: {
        name: "Demo User",
        email: "user@smartparking.local",
        password: "User@123"
    }
};

async function getOrCreateReservation(client, values, matchSql, matchParams) {
    const existing = await client.query(
        `SELECT id FROM reservations WHERE ${matchSql} ORDER BY id LIMIT 1`,
        matchParams
    );
    if (existing.rows.length) return existing.rows[0].id;

    const inserted = await client.query(
        `INSERT INTO reservations
            (user_id, vehicle_id, space_id, starts_at, ends_at, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        values
    );
    return inserted.rows[0].id;
}

async function seed() {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const adminHash = await bcrypt.hash(DEMO.admin.password, 10);
        const userHash = await bcrypt.hash(DEMO.user.password, 10);

        const adminResult = await client.query(
            `INSERT INTO users (name, email, password_hash, role)
             VALUES ($1, $2, $3, 'ADMIN')
             ON CONFLICT (email) DO UPDATE
             SET name = EXCLUDED.name,
                 password_hash = EXCLUDED.password_hash,
                 role = 'ADMIN'
             RETURNING id`,
            [DEMO.admin.name, DEMO.admin.email, adminHash]
        );
        const adminId = adminResult.rows[0].id;

        const userResult = await client.query(
            `INSERT INTO users (name, email, password_hash, role)
             VALUES ($1, $2, $3, 'USER')
             ON CONFLICT (email) DO UPDATE
             SET name = EXCLUDED.name,
                 password_hash = EXCLUDED.password_hash,
                 role = 'USER'
             RETURNING id`,
            [DEMO.user.name, DEMO.user.email, userHash]
        );
        const userId = userResult.rows[0].id;

        const vehicleResult = await client.query(
            `INSERT INTO vehicles (user_id, registration_number, vehicle_type)
             VALUES ($1, 'DL01AB1234', 'CAR')
             ON CONFLICT (registration_number) DO UPDATE
             SET user_id = EXCLUDED.user_id,
                 vehicle_type = EXCLUDED.vehicle_type
             RETURNING id`,
            [userId]
        );
        const vehicleId = vehicleResult.rows[0].id;

        let lotResult = await client.query(
            `SELECT id FROM parking_lots
             WHERE name = 'SAU Demo Parking Lot'
               AND city = 'New Delhi'
             ORDER BY id LIMIT 1`
        );

        let lotId;
        if (lotResult.rows.length) {
            lotId = lotResult.rows[0].id;
            await client.query(
                `UPDATE parking_lots
                 SET address = 'South Asian University Demo Road',
                     total_spaces = 6,
                     created_by = $1
                 WHERE id = $2`,
                [adminId, lotId]
            );
        } else {
            const createdLot = await client.query(
                `INSERT INTO parking_lots
                    (name, address, city, total_spaces, created_by)
                 VALUES
                    ('SAU Demo Parking Lot',
                     'South Asian University Demo Road',
                     'New Delhi', 6, $1)
                 RETURNING id`,
                [adminId]
            );
            lotId = createdLot.rows[0].id;
        }

        const spaceIds = {};
        for (let i = 1; i <= 6; i++) {
            const number = `A${i}`;
            const type = i === 3 ? "EV" : "REGULAR";
            const result = await client.query(
                `INSERT INTO parking_spaces
                    (lot_id, space_number, space_type, status, floor_number)
                 VALUES ($1, $2, $3, 'AVAILABLE', 0)
                 ON CONFLICT (lot_id, space_number) DO UPDATE
                 SET space_type = EXCLUDED.space_type
                 RETURNING id`,
                [lotId, number, type]
            );
            spaceIds[number] = result.rows[0].id;
        }

        // A completed historical reservation with a sample overstay charge.
        const completedId = await getOrCreateReservation(
            client,
            [
                userId, vehicleId, spaceIds.A2,
                "2026-01-10T10:00:00+05:30",
                "2026-01-10T12:00:00+05:30",
                "COMPLETED"
            ],
            `user_id = $1 AND vehicle_id = $2 AND space_id = $3
             AND starts_at = $4::timestamptz AND status = 'COMPLETED'`,
            [userId, vehicleId, spaceIds.A2, "2026-01-10T10:00:00+05:30"]
        );

        await client.query(
            `INSERT INTO parking_sessions
                (reservation_id, space_id, check_in, check_out, additional_charge)
             SELECT $1, $2, $3, $4, 250.00
             WHERE NOT EXISTS (
                 SELECT 1 FROM parking_sessions WHERE reservation_id = $1
             )`,
            [
                completedId, spaceIds.A2,
                "2026-01-10T10:05:00+05:30",
                "2026-01-10T12:45:00+05:30"
            ]
        );

        // One upcoming confirmed reservation, created relative to seed time.
        const upcoming = await client.query(
            `SELECT id FROM reservations
             WHERE user_id = $1 AND vehicle_id = $2 AND space_id = $3
               AND status = 'CONFIRMED' AND starts_at > NOW()
             ORDER BY starts_at LIMIT 1`,
            [userId, vehicleId, spaceIds.A1]
        );
        if (!upcoming.rows.length) {
            await client.query(
                `INSERT INTO reservations
                    (user_id, vehicle_id, space_id, starts_at, ends_at, status)
                 VALUES ($1, $2, $3, NOW() + INTERVAL '2 days',
                         NOW() + INTERVAL '2 days 2 hours', 'CONFIRMED')`,
                [userId, vehicleId, spaceIds.A1]
            );
        }

        // One active checked-in session, on a different space.
        let active = await client.query(
            `SELECT id FROM reservations
             WHERE user_id = $1 AND vehicle_id = $2 AND space_id = $3
               AND status = 'CHECKED_IN'
             ORDER BY id LIMIT 1`,
            [userId, vehicleId, spaceIds.A3]
        );
        let activeReservationId;
        if (active.rows.length) {
            activeReservationId = active.rows[0].id;
        } else {
            const createdActive = await client.query(
                `INSERT INTO reservations
                    (user_id, vehicle_id, space_id, starts_at, ends_at, status)
                 VALUES ($1, $2, $3, NOW() - INTERVAL '10 minutes',
                         NOW() + INTERVAL '90 minutes', 'CHECKED_IN')
                 RETURNING id`,
                [userId, vehicleId, spaceIds.A3]
            );
            activeReservationId = createdActive.rows[0].id;
        }

        await client.query(
            `INSERT INTO parking_sessions
                (reservation_id, space_id, check_in, check_out, additional_charge)
             SELECT $1, $2, NOW() - INTERVAL '5 minutes', NULL, 0
             WHERE NOT EXISTS (
                 SELECT 1 FROM parking_sessions WHERE reservation_id = $1
             )`,
            [activeReservationId, spaceIds.A3]
        );

        await client.query("COMMIT");

        console.log("Demo database data is ready.");
        console.log("Admin: admin@smartparking.local / Admin@123");
        console.log("User:  user@smartparking.local / User@123");
        console.log("Demo vehicle: DL01AB1234");
        console.log("Demo lot: SAU Demo Parking Lot (spaces A1-A6)");
        console.log("A completed session with ₹250 additional charge was included.");
        console.log("An active checked-in session and an upcoming reservation were included.");
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Demo seed failed:", error);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
}

seed();


const pool = require("../config/db");

// Create a parking reservation
const createReservation = async (req, res) => {
    const client = await pool.connect();

    try {
        const {
            vehicle_id,
            space_id,
            starts_at,
            ends_at
        } = req.body;

        // Validate required fields
        if (!vehicle_id || !space_id || !starts_at || !ends_at) {
            return res.status(400).json({
                message: "Vehicle, parking space, start time and end time are required"
            });
        }

        const startTime = new Date(starts_at);
        const endTime = new Date(ends_at);

        if (
            Number.isNaN(startTime.getTime()) ||
            Number.isNaN(endTime.getTime()) ||
            endTime <= startTime
        ) {
            return res.status(400).json({
                message: "Invalid reservation time interval"
            });
        }

        await client.query("BEGIN");

        // Check that the vehicle belongs to the logged-in user
        const vehicle = await client.query(
            `SELECT id
             FROM vehicles
             WHERE id = $1 AND user_id = $2`,
            [vehicle_id, req.user.id]
        );

        if (vehicle.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Vehicle not found"
            });
        }

        // Check that the parking space exists and is usable
        const space = await client.query(
            `SELECT id
             FROM parking_spaces
             WHERE id = $1 AND status = 'AVAILABLE'`,
            [space_id]
        );

        if (space.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Available parking space not found"
            });
        }

        // Insert reservation
        const result = await client.query(
            `INSERT INTO reservations
             (user_id, vehicle_id, space_id, starts_at, ends_at)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                req.user.id,
                vehicle_id,
                space_id,
                startTime.toISOString(),
                endTime.toISOString()
            ]
        );

        await client.query("COMMIT");

        res.status(201).json({
            message: "Reservation created successfully",
            reservation: result.rows[0]
        });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error(error);

        // PostgreSQL exclusion constraint violation
        if (error.code === "23P01") {
            return res.status(409).json({
                code: "SLOT_ALREADY_BOOKED",
                message: "This parking space is already reserved for the selected time"
            });
        }

        res.status(500).json({
            message: "Server error"
        });

    } finally {
        client.release();
    }
};


 // Get all reservations of the logged-in user
const getMyReservations = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                r.id AS reservation_id,
                r.starts_at,
                r.ends_at,
                r.status,
                r.created_at,

                v.registration_number,
                v.vehicle_type,

                ps.space_number,
                ps.space_type,
                ps.floor_number,

                pl.name AS parking_lot,
                pl.address,
                pl.city

             FROM reservations r

             JOIN vehicles v
                ON r.vehicle_id = v.id

             JOIN parking_spaces ps
                ON r.space_id = ps.id

             JOIN parking_lots pl
                ON ps.lot_id = pl.id

             WHERE r.user_id = $1

             ORDER BY r.starts_at DESC`,
            [req.user.id]
        );

        res.status(200).json({
            message: "Reservations fetched successfully",
            reservations: result.rows
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

 // Cancel a reservation
const cancelReservation = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `UPDATE reservations
             SET status = 'CANCELLED'
             WHERE id = $1
               AND user_id = $2
               AND status = 'CONFIRMED'
               AND starts_at > NOW()
             RETURNING *`,
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Reservation not found or cannot be cancelled"
            });
        }

        res.status(200).json({
            message: "Reservation cancelled successfully",
            reservation: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

 // Check in to a parking reservation
const checkIn = async (req, res) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;

        await client.query("BEGIN");

        // Find and lock the user's reservation
        const reservation = await client.query(
            `SELECT *
             FROM reservations
             WHERE id = $1 AND user_id = $2
             FOR UPDATE`,
            [id, req.user.id]
        );

        if (reservation.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Reservation not found"
            });
        }

        const booking = reservation.rows[0];

        // Check reservation status
        if (booking.status !== "CONFIRMED") {
            await client.query("ROLLBACK");

            return res.status(409).json({
                message: "This reservation cannot be checked in"
            });
        }

        const now = Date.now();
        const startTime = new Date(booking.starts_at).getTime();
        const graceDeadline = startTime + 15 * 60 * 1000;

        // Check whether the check-in window is valid
        if (now < startTime || now >= graceDeadline) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                message: "Check-in is allowed only from the reservation start time until the end of the 15-minute grace period"
            });
        }

        // Update reservation status
        await client.query(
            `UPDATE reservations
             SET status = 'CHECKED_IN'
             WHERE id = $1`,
            [id]
        );

        // Create actual parking session
        const session = await client.query(
            `INSERT INTO parking_sessions
             (reservation_id, space_id)
             VALUES ($1, $2)
             RETURNING *`,
            [id, booking.space_id]
        );

        await client.query("COMMIT");

        res.status(201).json({
            message: "Check-in successful",
            parkingSession: session.rows[0]
        });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });

    } finally {
        client.release();
    }
};

 // Check out and calculate overstay charges
const checkOut = async (req, res) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;

        // Overstay rate in rupees per started hour
        const overstayRate = Number(
            process.env.OVERSTAY_RATE_PER_HOUR || 20
        );

        if (!Number.isFinite(overstayRate) || overstayRate < 0) {
            return res.status(500).json({
                message: "Invalid overstay rate configuration"
            });
        }

        await client.query("BEGIN");

        // Find and lock the user's active parking session
        const result = await client.query(
            `SELECT
                ps.id AS session_id,
                ps.check_in,
                ps.check_out,
                r.id AS reservation_id,
                r.ends_at
             FROM parking_sessions ps
             JOIN reservations r
                ON ps.reservation_id = r.id
             WHERE r.id = $1
               AND r.user_id = $2
             FOR UPDATE OF ps, r`,
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Parking session not found"
            });
        }

        const session = result.rows[0];

        if (session.check_out !== null) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                message: "This parking session has already ended"
            });
        }

        // Calculate time parked beyond the reservation end time
        const checkoutTime = new Date();
        const reservedEndTime = new Date(session.ends_at);

        const overstayMilliseconds = Math.max(
            0,
            checkoutTime.getTime() - reservedEndTime.getTime()
        );

        // Charge for every started hour of overstay
        const overstayHours = Math.ceil(
            overstayMilliseconds / (60 * 60 * 1000)
        );

        const additionalCharge = overstayHours * overstayRate;

        // Close the parking session
        const updatedSession = await client.query(
            `UPDATE parking_sessions
             SET check_out = $1,
                 additional_charge = $2
             WHERE id = $3
             RETURNING *`,
            [
                checkoutTime.toISOString(),
                additionalCharge,
                session.session_id
            ]
        );

        // Mark reservation as completed
        await client.query(
            `UPDATE reservations
             SET status = 'COMPLETED'
             WHERE id = $1`,
            [id]
        );

        await client.query("COMMIT");

        res.status(200).json({
            message: "Check-out successful",
            parkingSession: updatedSession.rows[0],
            overstayHours,
            additionalCharge
        });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });

    } finally {
        client.release();
    }
};


module.exports = {
    createReservation, getMyReservations, cancelReservation, checkIn, checkOut
};


const pool = require("../config/db");

// Search for available parking spaces
const getAvailableSpaces = async (req, res) => {
    try {
        const {
            lot_id,
            starts_at,
            ends_at,
            space_type
        } = req.query;

        // Validate required fields
        if (!lot_id || !starts_at || !ends_at) {
            return res.status(400).json({
                message: "Lot ID, start time and end time are required"
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
                message: "Invalid time interval"
            });
        }

        const allowedTypes = [
            "REGULAR",
            "EV",
            "HANDICAPPED"
        ];

        if (space_type && !allowedTypes.includes(space_type)) {
            return res.status(400).json({
                message: "Invalid parking space type"
            });
        }

        const result = await pool.query(
            `SELECT
                ps.id AS space_id,
                ps.space_number,
                ps.space_type,
                ps.floor_number,
                pl.id AS lot_id,
                pl.name AS parking_lot,
                pl.address,
                pl.city

             FROM parking_spaces ps

             JOIN parking_lots pl
                ON ps.lot_id = pl.id

             WHERE ps.lot_id = $1
               AND ps.status = 'AVAILABLE'

               AND (
                    $4::VARCHAR IS NULL
                    OR ps.space_type = $4
               )

               -- Exclude overlapping reservations
               AND NOT EXISTS (
                    SELECT 1
                    FROM reservations r
                    WHERE r.space_id = ps.id
                      AND r.status IN ('CONFIRMED', 'CHECKED_IN')
                      AND r.during &&
                          tstzrange($2::timestamptz, $3::timestamptz, '[)')
               )

               -- Exclude spaces with an active parking session
               AND NOT EXISTS (
                    SELECT 1
                    FROM parking_sessions session
                    WHERE session.space_id = ps.id
                      AND session.check_out IS NULL
               )

             ORDER BY ps.floor_number, ps.space_number`,

            [
                lot_id,
                startTime.toISOString(),
                endTime.toISOString(),
                space_type || null
            ]
        );

        res.status(200).json({
            message: "Available parking spaces fetched successfully",
            count: result.rows.length,
            parkingSpaces: result.rows
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    getAvailableSpaces
};

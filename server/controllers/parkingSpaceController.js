const pool = require("../config/db");

// Create a parking space
const createSpace = async (req, res) => {
    const client = await pool.connect();

    try {
        const {
            lot_id,
            space_number,
            space_type,
            floor_number
        } = req.body;

        if (!lot_id || !space_number) {
            return res.status(400).json({
                message: "Lot ID and space number are required"
            });
        }

        const allowedTypes = ["REGULAR", "EV", "HANDICAPPED"];
        const type = space_type || "REGULAR";

        if (!allowedTypes.includes(type)) {
            return res.status(400).json({
                message: "Invalid parking space type"
            });
        }

        await client.query("BEGIN");

        const result = await client.query(
            `INSERT INTO parking_spaces
             (lot_id, space_number, space_type, floor_number)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [lot_id, space_number.trim(), type, floor_number ?? 0]
        );

        await client.query(
            `UPDATE parking_lots
             SET total_spaces = total_spaces + 1
             WHERE id = $1`,
            [lot_id]
        );

        await client.query("COMMIT");

        res.status(201).json({
            message: "Parking space created successfully",
            parkingSpace: result.rows[0]
        });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error(error);

        if (error.code === "23503") {
            return res.status(404).json({
                message: "Parking lot not found"
            });
        }

        if (error.code === "23505") {
            return res.status(409).json({
                message: "This space number already exists in the parking lot"
            });
        }

        res.status(500).json({ message: "Server error" });

    } finally {
        client.release();
    }
};


// Update a parking space
const updateSpace = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            space_number,
            space_type,
            floor_number,
            status
        } = req.body;

        const allowedTypes = ["REGULAR", "EV", "HANDICAPPED"];
        const allowedStatuses = ["AVAILABLE", "MAINTENANCE"];

        if (!space_number || !space_type || floor_number === undefined || !status) {
            return res.status(400).json({
                message: "All parking space fields are required"
            });
        }

        if (!allowedTypes.includes(space_type)) {
            return res.status(400).json({
                message: "Invalid parking space type"
            });
        }

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid parking space status"
            });
        }

        const result = await pool.query(
            `UPDATE parking_spaces
             SET space_number = $1,
                 space_type = $2,
                 floor_number = $3,
                 status = $4
             WHERE id = $5
             RETURNING *`,
            [space_number.trim(), space_type, floor_number, status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Parking space not found"
            });
        }

        res.status(200).json({
            message: "Parking space updated successfully",
            parkingSpace: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        if (error.code === "23505") {
            return res.status(409).json({
                message: "This space number already exists in the parking lot"
            });
        }

        res.status(500).json({ message: "Server error" });
    }
};

// Delete a parking space
const deleteSpace = async (req, res) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;

        await client.query("BEGIN");

        const result = await client.query(
            `DELETE FROM parking_spaces
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Parking space not found"
            });
        }

        // Decrease the total space count for its parking lot
        await client.query(
            `UPDATE parking_lots
             SET total_spaces = total_spaces - 1
             WHERE id = $1`,
            [result.rows[0].lot_id]
        );

        await client.query("COMMIT");

        res.status(200).json({
            message: "Parking space deleted successfully",
            parkingSpace: result.rows[0]
        });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error(error);

        if (error.code === "23503") {
            return res.status(409).json({
                message: "Cannot delete a space that has reservations or parking sessions"
            });
        }

        res.status(500).json({
            message: "Server error"
        });

    } finally {
        client.release();
    }
};
const getSpacesByLot = async (req, res) => {
    try {
        const { lotId } = req.params;

        const lot = await pool.query(
            "SELECT id FROM parking_lots WHERE id = $1",
            [lotId]
        );

        if (lot.rows.length === 0) {
            return res.status(404).json({
                message: "Parking lot not found"
            });
        }

        const result = await pool.query(
            `SELECT *
             FROM parking_spaces
             WHERE lot_id = $1
             ORDER BY floor_number, space_number`,
            [lotId]
        );

        res.status(200).json({
            message: "Parking spaces fetched successfully",
            parkingSpaces: result.rows
        });

    } catch (error) {
        console.error("Get parking spaces error:", error);

        res.status(500).json({
            message: "Failed to fetch parking spaces"
        });
    }
};

module.exports = {
    createSpace,
    updateSpace, getSpacesByLot,
    deleteSpace
};

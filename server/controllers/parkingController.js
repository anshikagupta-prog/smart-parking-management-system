const pool = require("../config/db");

// Create a new parking lot
const createLot = async (req, res) => {
    try {
        const { name, address, city } = req.body;

        // Validate required fields
        if (!name || !address || !city) {
            return res.status(400).json({
                message: "Name, address and city are required"
            });
        }

        // Insert parking lot
        const result = await pool.query(
            `INSERT INTO parking_lots
             (name, address, city, created_by)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [
                name.trim(),
                address.trim(),
                city.trim(),
                req.user.id
            ]
        );

        res.status(201).json({
            message: "Parking lot created successfully",
            parkingLot: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

// Get all parking lots
const getAllLots = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT *
             FROM parking_lots
             ORDER BY id`
        );

        res.status(200).json({
            message: "Parking lots fetched successfully",
            parkingLots: result.rows
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};
// Get a specific parking lot by ID
const getLotById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT *
             FROM parking_lots
             WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Parking lot not found"
            });
        }

        res.status(200).json({
            message: "Parking lot fetched successfully",
            parkingLot: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};
// Update a parking lot
const updateLot = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, address, city } = req.body;

        // Validate input
        if (!name || !address || !city) {
            return res.status(400).json({
                message: "Name, address and city are required"
            });
        }

        const result = await pool.query(
            `UPDATE parking_lots
             SET name = $1,
                 address = $2,
                 city = $3
             WHERE id = $4
             RETURNING *`,
            [
                name.trim(),
                address.trim(),
                city.trim(),
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Parking lot not found"
            });
        }

        res.status(200).json({
            message: "Parking lot updated successfully",
            parkingLot: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};
// Delete a parking lot
const deleteLot = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM parking_lots
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Parking lot not found"
            });
        }

        res.status(200).json({
            message: "Parking lot deleted successfully",
            parkingLot: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        // The lot may contain parking spaces
        if (error.code === "23503") {
            return res.status(409).json({
                message: "Cannot delete parking lot because it contains parking spaces"
            });
        }

        res.status(500).json({
            message: "Server error"
        });
    }
};
module.exports = { createLot, getAllLots, getLotById, updateLot, deleteLot };
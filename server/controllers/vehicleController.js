const pool = require("../config/db");

// Add a vehicle
const addVehicle = async (req, res) => {
    try {
        const { registration_number, vehicle_type } = req.body;

        // Validate input
        if (!registration_number || !vehicle_type) {
            return res.status(400).json({
                message: "Registration number and vehicle type are required"
            });
        }

        const allowedTypes = ["CAR", "BIKE", "SUV", "OTHER"];

        if (!allowedTypes.includes(vehicle_type.toUpperCase())) {
            return res.status(400).json({
                message: "Invalid vehicle type"
            });
        }

        // Insert vehicle for the logged-in user
        const result = await pool.query(
            `INSERT INTO vehicles
             (user_id, registration_number, vehicle_type)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [
                req.user.id,
                registration_number.trim().toUpperCase(),
                vehicle_type.toUpperCase()
            ]
        );

        res.status(201).json({
            message: "Vehicle added successfully",
            vehicle: result.rows[0]
        });

    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                message: "Vehicle registration number already exists"
            });
        }

        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};
// Get all vehicles belonging to the logged-in user
const getVehicles = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT *
             FROM vehicles
             WHERE user_id = $1
             ORDER BY id`,
            [req.user.id]
        );

        res.status(200).json({
            message: "Vehicles fetched successfully",
            vehicles: result.rows
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

// Update a vehicle
const updateVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        const { registration_number, vehicle_type } = req.body;

        if (!registration_number || !vehicle_type) {
            return res.status(400).json({
                message: "Registration number and vehicle type are required"
            });
        }

        const allowedTypes = ["CAR", "BIKE", "SUV", "OTHER"];

        if (!allowedTypes.includes(vehicle_type.toUpperCase())) {
            return res.status(400).json({
                message: "Invalid vehicle type"
            });
        }

        const result = await pool.query(
            `UPDATE vehicles
             SET registration_number = $1,
                 vehicle_type = $2
             WHERE id = $3 AND user_id = $4
             RETURNING *`,
            [
                registration_number.trim().toUpperCase(),
                vehicle_type.toUpperCase(),
                id,
                req.user.id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Vehicle not found"
            });
        }

        res.status(200).json({
            message: "Vehicle updated successfully",
            vehicle: result.rows[0]
        });

    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                message: "Vehicle registration number already exists"
            });
        }

        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

// Delete a vehicle
const deleteVehicle = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM vehicles
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Vehicle not found"
            });
        }

        res.status(200).json({
            message: "Vehicle deleted successfully",
            vehicle: result.rows[0]
        });

    } catch (error) {
        if (error.code === "23503") {
            return res.status(409).json({
                message: "Vehicle cannot be deleted because it is associated with existing reservations"
            });
        }

        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = { addVehicle, getVehicles, updateVehicle, deleteVehicle };
const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");

const {
    addVehicle,
    getVehicles,
    updateVehicle,
    deleteVehicle
} = require("../controllers/vehicleController");

// Add a vehicle
router.post("/", authenticateToken, addVehicle);

// Get all user's vehicles
router.get("/", authenticateToken, getVehicles);

// Update a vehicle
router.put("/:id", authenticateToken, updateVehicle);

// Delete a vehicle
router.delete("/:id", authenticateToken, deleteVehicle);

module.exports = router;
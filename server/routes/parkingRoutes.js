const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");
const authorizeAdmin = require("../middleware/adminMiddleware");

const {
    createLot,
    getAllLots,
    getLotById, updateLot, deleteLot
} = require("../controllers/parkingController");

// Create parking lot (Admin only)
router.post("/", authenticateToken, authorizeAdmin, createLot);

// Get all parking lots
router.get("/", authenticateToken, getAllLots);

// Get a specific parking lot
router.get("/:id", authenticateToken, getLotById);

// Update a parking lot (Admin only)
router.put("/:id", authenticateToken, authorizeAdmin, updateLot);
// Delete a parking lot (Admin only)
router.delete("/:id", authenticateToken, authorizeAdmin, deleteLot);
module.exports = router;
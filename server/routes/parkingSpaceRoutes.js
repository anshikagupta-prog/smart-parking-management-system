
const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");
const authorizeAdmin = require("../middleware/adminMiddleware");

const {
    createSpace,
    getSpacesByLot,
    updateSpace,
    deleteSpace
} = require("../controllers/parkingSpaceController");

// Create a parking space (Admin only)
router.post("/", authenticateToken, authorizeAdmin, createSpace);

// Get all spaces in a specific lot
router.get("/lot/:lotId", authenticateToken, getSpacesByLot);

// Update a parking space (Admin only)
router.put("/:id", authenticateToken, authorizeAdmin, updateSpace);

// Delete a parking space (Admin only)
router.delete("/:id", authenticateToken, authorizeAdmin, deleteSpace);

module.exports = router;

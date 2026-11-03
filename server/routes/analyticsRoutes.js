
const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");
const authorizeAdmin = require("../middleware/adminMiddleware");

const {
    getDashboardStats
} = require("../controllers/analyticsController");

// Get dashboard statistics (Admin only)
router.get("/dashboard", authenticateToken, authorizeAdmin, getDashboardStats);

module.exports = router;

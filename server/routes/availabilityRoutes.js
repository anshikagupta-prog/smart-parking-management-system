const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");

const {
    getAvailableSpaces
} = require("../controllers/availabilityController");

// Search available parking spaces
router.get("/", authenticateToken, getAvailableSpaces);

module.exports = router;


const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");

const {
    createReservation,
    getMyReservations,
    cancelReservation,
    checkIn,
    checkOut
} = require("../controllers/reservationController");

// Create a reservation
router.post("/", authenticateToken, createReservation);

// View my reservations
router.get("/my", authenticateToken, getMyReservations);

// Cancel a reservation
router.patch("/:id/cancel", authenticateToken, cancelReservation);

// Check in
router.post("/:id/check-in", authenticateToken, checkIn);

// Check out
router.post("/:id/check-out", authenticateToken, checkOut);

module.exports = router;

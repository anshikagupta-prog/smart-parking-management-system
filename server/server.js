
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const parkingRoutes = require("./routes/parkingRoutes");
const parkingSpaceRoutes = require("./routes/parkingSpaceRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

const authenticateToken = require("./middleware/authMiddleware");
const expireReservations = require("./services/reservationExpiryService");

const app = express();

// Middleware
app.use(cors({
    origin: "http://localhost:5173"
}));

app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/parking-lots", parkingRoutes);
app.use("/api/parking-spaces", parkingSpaceRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/analytics", analyticsRoutes);

// Health check
app.get("/", (req, res) => {
    res.send("Smart Parking API is running!");
});

// Database test
app.get("/api/test-db", async (req, res) => {
    try {
        const result = await pool.query("SELECT current_database()");

        res.json({
            message: "Database connected successfully",
            database: result.rows[0].current_database
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Database connection failed"
        });
    }
});

// Protected test route
app.get("/api/protected", authenticateToken, (req, res) => {
    res.json({
        message: "You have accessed a protected route!",
        user: req.user
    });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    expireReservations();
    setInterval(expireReservations, 60 * 1000);
});

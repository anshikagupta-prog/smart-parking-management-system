
const pool = require("../config/db");

// Get admin dashboard analytics
const getDashboardStats = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT

                -- Parking lot statistics
                (SELECT COUNT(*)
                 FROM parking_lots) AS total_lots,

                -- Total parking spaces
                (SELECT COUNT(*)
                 FROM parking_spaces) AS total_spaces,

                -- Available spaces
                (SELECT COUNT(*)
                 FROM parking_spaces
                 WHERE status = 'AVAILABLE') AS available_spaces,

                -- Spaces under maintenance
                (SELECT COUNT(*)
                 FROM parking_spaces
                 WHERE status = 'MAINTENANCE') AS maintenance_spaces,

                -- Active parking sessions
                (SELECT COUNT(*)
                 FROM parking_sessions
                 WHERE check_out IS NULL) AS active_sessions,

                -- Total reservations
                (SELECT COUNT(*)
                 FROM reservations) AS total_reservations,

                -- Completed reservations
                (SELECT COUNT(*)
                 FROM reservations
                 WHERE status = 'COMPLETED') AS completed_reservations,

                -- Confirmed upcoming reservations
                (SELECT COUNT(*)
                 FROM reservations
                 WHERE status = 'CONFIRMED') AS confirmed_reservations,

                -- Total overstay revenue
                (SELECT COALESCE(SUM(additional_charge), 0)
                 FROM parking_sessions) AS total_revenue
            `
        );

        const stats = result.rows[0];

        // Calculate occupancy percentage
        const totalSpaces = Number(stats.total_spaces);
        const availableSpaces = Number(stats.available_spaces);

        const occupiedSpaces = totalSpaces - availableSpaces;

        const occupancyPercentage = totalSpaces > 0
            ? Number(((occupiedSpaces / totalSpaces) * 100).toFixed(2))
            : 0;

        res.status(200).json({
            message: "Dashboard statistics fetched successfully",
            analytics: {
                ...stats,
                total_spaces: totalSpaces,
                available_spaces: availableSpaces,
                occupied_spaces: occupiedSpaces,
                occupancy_percentage: occupancyPercentage
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Unable to fetch dashboard statistics"
        });
    }
};

module.exports = {
    getDashboardStats
};

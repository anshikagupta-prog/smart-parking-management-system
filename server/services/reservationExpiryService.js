
const pool = require("../config/db");

// Automatically expire reservations after the 15-minute grace period
const expireReservations = async () => {
    try {
        const result = await pool.query(
            `UPDATE reservations
             SET status = 'EXPIRED'
             WHERE status = 'CONFIRMED'
               AND starts_at + INTERVAL '15 minutes' <= NOW()`
        );

        if (result.rowCount > 0) {
            console.log(
                `${result.rowCount} reservation(s) expired automatically`
            );
        }

    } catch (error) {
        console.error("Reservation expiry error:", error);
    }
};

module.exports = expireReservations;

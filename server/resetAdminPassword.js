
const bcrypt = require("bcrypt");
const pool = require("./config/db");

const resetPassword = async () => {
    // Replace this with a new password of your choice.
    const newPassword = "Password";

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const result = await pool.query(
            `UPDATE users
             SET password_hash = $1
             WHERE id = 2 AND role = 'ADMIN'
             RETURNING id, email, role`,
            [hashedPassword]
        );

        if (result.rowCount === 0) {
            console.log("Admin account not found.");
        } else {
            console.log("Password reset successfully!");
            console.log(result.rows[0]);
        }
    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        await pool.end();
    }
};

resetPassword();

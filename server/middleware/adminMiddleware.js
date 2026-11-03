// Check whether the logged-in user is an admin
const authorizeAdmin = (req, res, next) => {

    if (req.user.role !== "ADMIN") {
        return res.status(403).json({
            message: "Access denied. Admin privileges required."
        });
    }

    next();
};

module.exports = authorizeAdmin;
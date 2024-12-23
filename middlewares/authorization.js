const db = require('../config/db');

const authorize = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            const { id: userId } = req.user;

            // Check if the user has the required permission
            const [rows] = await db.query(`
                SELECT p.permission_name 
                FROM user_permissions up
                JOIN permissions p ON up.permission_id = p.id
                WHERE up.user_id = ? AND p.permission_name = ?
            `, [userId, requiredPermission]);

            if (!rows.length) {
                return res.status(403).json({ message: 'Access denied. You do not have permission to perform this action.' });
            }

            next();
        } catch (error) {
            return res.status(500).json({ message: 'An error occurred during authorization.', error: error.message });
        }
    };
};

module.exports = authorize;

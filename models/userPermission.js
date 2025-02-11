const db = require('../config/db');
const CustomError = require('../utils/CustomError');

const UserPermission = {
    async approveUser(userId) {
        const [result] = await db.query('UPDATE users SET is_approved = TRUE WHERE id = ?', [userId]);

        if (result.affectedRows === 0) {
            throw new CustomError('User not found or already approved.', 404);
        }
    },

    async disapproveUser(userId) {
        const [result] = await db.query('DELETE FROM users WHERE id = ? AND is_approved = 0', [userId]);

        if (result.affectedRows === 0) {
            throw new CustomError('User not found or already approved.', 404);
        }
    },

    async getAllPermissions() {
        const [rows] = await db.query('SELECT * FROM permissions');

        if (rows.length === 0) {
            throw new CustomError('No permissions found.', 404);
        }

        return rows;
    },

    async assignPermissions(userId, permissionIds) {
        if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
            throw new CustomError('Permission IDs must be a non-empty array.', 400);
        }

        const values = permissionIds.map(permissionId => [userId, permissionId]);

        const [result] = await db.query(
            `INSERT IGNORE INTO user_permissions (user_id, permission_id) VALUES ?`,
            [values]
        );

        if (result.affectedRows === 0) {
            throw new CustomError('Permissions were not assigned. They may already exist.', 409);
        }
    },

    async removePermissions(userId, permissionIds) {
        if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
            throw new CustomError('Permission IDs must be a non-empty array.', 400);
        }

        const [result] = await db.query(
            `DELETE FROM user_permissions WHERE user_id = ? AND permission_id IN (?)`,
            [userId, permissionIds]
        );

        if (result.affectedRows === 0) {
            throw new CustomError('Permissions not found for removal.', 404);
        }
    },

    async getUserPermissions(userId) {
        const [rows] = await db.query(
            `SELECT permissions.id, permissions.permission_name 
            FROM user_permissions
            JOIN permissions ON user_permissions.permission_id = permissions.id
            WHERE user_permissions.user_id = ?`, 
            [userId]
        );

        if (rows.length === 0) {
            throw new CustomError('User has no assigned permissions.', 404);
        }

        return rows;
    },
};

module.exports = UserPermission;

const db = require('../config/db');

const UserPermission = {
    async approveUser(userId) {
        await db.query('UPDATE users SET is_approved = TRUE WHERE id = ?', [userId]);
    },

    async disapproveUser(userId) {
        await db.query('DELETE FROM users WHERE id = ? AND is_approved = 0', [userId]);
    },

    async getAllPermissions() {
        const [rows] = await db.query(
            'SELECT * FROM permissions'
        );
        return rows;
    },

    async assignPermissions(userId, permissionIds) {
        const values = permissionIds.map(permissionId => [userId, permissionId]);

        await db.query(
            `INSERT IGNORE INTO user_permissions (user_id, permission_id) VALUES ?`,
            [values]
        );
    },

    async removePermissions(userId, permissionIds) {
        await db.query(
            `DELETE FROM user_permissions WHERE user_id = ? AND permission_id IN (?)`,
            [userId, permissionIds]
        );
    },

    async getUserPermissions(userId) {
        const [rows] = await db.query(
            `SELECT permissions.id, permissions.permission_name 
            FROM user_permissions
            JOIN permissions ON user_permissions.permission_id = permissions.id
            WHERE user_permissions.user_id = ?`, [userId]
        );
        return rows;
    },
}

module.exports = UserPermission;
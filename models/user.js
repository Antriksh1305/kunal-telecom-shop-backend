const db = require('../config/db');
const { update } = require('./product');

const User = {
    async create(userData) {
        const { email, first_name, last_name, password, role_id, is_approved } = userData;
        
        console.log('trying to create user');

        // Check if email already exists
        const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            throw new Error('Email is already registered.');
        }
        
        console.log('email is not registered, ready to create new user');

        // Insert new user
        const [result] = await db.query(
            `INSERT INTO users (email, first_name, last_name, password, role_id, is_approved) VALUES (?, ?, ?, ?, ?, ?)`,
            [email, first_name, last_name, password, role_id, is_approved]
        );

        console.log('user created');

        return result.insertId;
    },

    async update(userId, updatedData) {
        const { first_name, last_name, password, role_id } = updatedData;

        await db.query(
            `UPDATE users SET first_name = ?, last_name = ?, password = ?, role_id = ?, WHERE id = ?`,
            [first_name, last_name, password, role_id, userId]);
    },

    async delete(userId) {
        await db.query(`DELETE FROM users WHERE id = ?`, [userId]);
    },

    async findByEmail(email) {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    },

    async findByUserId(userId) {
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
        return rows[0];
    },

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

    async assignPermission(userId, permissionId) {
        await db.query(
            `INSERT IGNORE INTO user_permissions (user_id, permission_id) VALUES (?, ?)`,
            [userId, permissionId]
        );
    },

    async getUserPermissions(userId) {
        const [rows] = await db.query(
            `SELECT permissions.permission_name 
           FROM user_permissions
           JOIN permissions ON user_permissions.permission_id = permissions.id
           WHERE user_permissions.user_id = ?`,
            [userId]
        );
        return rows.map(row => row.permission_name);
    },
};

module.exports = User;

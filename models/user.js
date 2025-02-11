const db = require('../config/db');
const CustomError = require('../utils/CustomError');

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordRegex = /^.{6,}$/;
const nameRegex = /^[A-Za-z\s]+$/;

const User = {
    async create(userData) {
        const { email, first_name, last_name, password, role_id, is_approved } = userData;

        if (!emailRegex.test(email)) {
            throw new CustomError('Invalid email format', 400);
        }
        if (!passwordRegex.test(password)) {
            throw new CustomError('Password must be at least 6 characters long', 400);
        }
        if (!nameRegex.test(first_name) || !nameRegex.test(last_name)) {
            throw new CustomError('First and last name should contain only alphabets', 400);
        }

        // Check if email already exists
        const [existingUser] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            throw new CustomError('Email is already registered.', 409);
        }

        // Insert user into database
        const [result] = await db.query(
            `INSERT INTO users (email, first_name, last_name, password, role_id, is_approved) VALUES (?, ?, ?, ?, ?, ?)`,
            [email, first_name, last_name, password, role_id, is_approved]
        );

        return result.insertId;
    },

    async update(userId, updatedData) {
        const { first_name, last_name, password } = updatedData;

        if (!passwordRegex.test(password)) {
            throw new CustomError('Password must be at least 6 characters long', 400);
        }
        if (!nameRegex.test(first_name) || !nameRegex.test(last_name)) {
            throw new CustomError('First and last name should contain only alphabets', 400);
        }

        const [result] = await db.query(
            `UPDATE users SET first_name = ?, last_name = ?, password = ? WHERE id = ?`,
            [first_name, last_name, password, userId]
        );

        if (result.affectedRows === 0) {
            throw new CustomError('User not found or no changes made.', 404);
        }
    },

    async delete(userId) {
        const [result] = await db.query(`DELETE FROM users WHERE id = ?`, [userId]);

        if (result.affectedRows === 0) {
            throw new CustomError('User not found.', 404);
        }
    },

    async changeAccountActivity(userId, isActive) {
        const [result] = await db.query(`UPDATE users SET is_active = ? WHERE id = ?`, [isActive ? 0 : 1, userId]);

        if (result.affectedRows === 0) {
            throw new CustomError('User not found or no changes made.', 404);
        }
    },

    async findByEmail(email) {
        if (!emailRegex.test(email)) {
            throw new CustomError('Invalid email format', 400);
        }

        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        if (rows.length === 0) {
            throw new CustomError('User not found.', 404);
        }

        return rows[0];
    },

    async findByUserId(userId) {
        const [rows] = await db.query('SELECT id, email, first_name, last_name, role_id, is_approved, is_active FROM users WHERE id = ?', [userId]);

        if (rows.length === 0) {
            throw new CustomError('User not found.', 404);
        }

        return rows[0];
    },

    async getAll() {
        const [rows] = await db.query('SELECT id, email, first_name, last_name, role_id, is_approved, is_active FROM users');
        return rows;
    },

    async getAllEmployees() {
        const [rows] = await db.query('SELECT id, email, first_name, last_name, role_id, is_approved, is_active FROM users WHERE role_id = 2');
        return rows;
    },

    async getAllAdmins() {
        const [rows] = await db.query('SELECT id, email, first_name, last_name, role_id, is_approved, is_active FROM users WHERE role_id = 1');
        return rows;
    }
};

module.exports = User;

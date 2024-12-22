const db = require('../config/db');

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordRegex = /^.{6,}$/;
const nameRegex = /^[A-Za-z\s]+$/;

const User = {
    async create(userData) {
        const { email, first_name, last_name, password, role_id, is_approved } = userData;

        if (!emailRegex.test(email)) {
            throw new Error('Invalid email format');
        }
        if (!passwordRegex.test(password)) {
            throw new Error('Password must be at least 6 characters long');
        }        
        if (!nameRegex.test(first_name) || !nameRegex.test(last_name)) {
            throw new Error('First and last name should contain only alphabets');
        }

        // Check if email already exists
        const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            throw new Error('Email is already registered.');
        }

        // Insert user into database
        const [result] = await db.query(
            `INSERT INTO users (email, first_name, last_name, password, role_id, is_approved) VALUES (?, ?, ?, ?, ?, ?)`,
            [email, first_name, last_name, password, role_id, is_approved]
        );

        return result.insertId;
    },

    async update(userId, updatedData) {
        const { first_name, last_name, password, role_id } = updatedData;

        if (!passwordRegex.test(password)) {
            throw new Error('Password must be at least 6 characters long');
        }        
        if (!nameRegex.test(first_name) || !nameRegex.test(last_name)) {
            throw new Error('First and last name should contain only alphabets');
        }

        await db.query(
            `UPDATE users SET first_name = ?, last_name = ?, password = ?, role_id = ?, WHERE id = ?`,
            [first_name, last_name, password, role_id, userId]);
    },

    async delete(userId) {
        await db.query(`DELETE FROM users WHERE id = ?`, [userId]);
    },

    async findByEmail(email) {
        if (!emailRegex.test(email)) {
            throw new Error('Invalid email format');
        }

        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    },

    async findByUserId(userId) {
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
        return rows[0];
    },

    async getAllEmployees() {
        const [rows] = await db.query('SELECT * FROM users WHERE role_id = 2');
        return rows;
    },

    async getAllAdmins() {
        const [rows] = await db.query('SELECT * FROM users WHERE role_id = 1');
        return rows;
    }
};

module.exports = User;

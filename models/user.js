const db = require('../config/db');
const bcrypt = require('bcrypt');
const CustomError = require('../utils/CustomError');

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordRegex = /^.{6,}$/;
const nameRegex = /^[A-Za-z\s]+$/;

const User = {
    async create(userData) {
        const { email, first_name, last_name, password, role_id, is_approved } = userData;

        if (!emailRegex.test(email)) throw new CustomError('Invalid email format', 400);
        if (!passwordRegex.test(password)) throw new CustomError('Password must be at least 6 characters long', 400);
        if (!nameRegex.test(first_name) || !nameRegex.test(last_name)) throw new CustomError('First and last name should contain only alphabets', 400);

        const [existingUser] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) throw new CustomError('Email is already registered.', 409);

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            `INSERT INTO users (email, first_name, last_name, password, role_id, is_approved) VALUES (?, ?, ?, ?, ?, ?)`,
            [email, first_name, last_name, hashedPassword, role_id, is_approved]
        );

        return result.insertId;
    },

    async update(userId, updatedData) {
        const fields = [];
        const values = [];

        if (updatedData.password) {
            if (!passwordRegex.test(updatedData.password))throw new CustomError('Password must be at least 6 characters long', 400);
            const hashedPassword = await bcrypt.hash(updatedData.password, 10);
            fields.push("password = ?");
            values.push(hashedPassword);
        }
        if (updatedData.first_name) {
            if (!nameRegex.test(updatedData.first_name)) throw new CustomError("Invalid first name", 400);
            fields.push("first_name = ?");
            values.push(updatedData.first_name);
        }
        if (updatedData.last_name) {
            if (!nameRegex.test(updatedData.last_name)) throw new CustomError("Invalid last name", 400);
            fields.push("last_name = ?");
            values.push(updatedData.last_name);
        }
    
        if (!fields.length) throw new CustomError("No fields provided for update", 400);
    
        values.push(userId);
        const [result] = await db.query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);
    
        if (!result.affectedRows) throw new CustomError("User not found or no changes made", 404);
    },

    async delete(userId) {
        const [result] = await db.query(`DELETE FROM users WHERE id = ?`, [userId]);

        if (result.affectedRows === 0) {
            throw new CustomError('User not found.', 404);
        }
    },

    async changeAccountActivity(userId, isActive) {
        const [result] = await db.query(`UPDATE users SET is_active = ? WHERE id = ?`, [!isActive, userId]);

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
            throw new CustomError('User with this email not found.', 404);
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

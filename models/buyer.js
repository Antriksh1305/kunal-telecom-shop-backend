// models/buyer.js
const db = require('../config/db');
const CustomError = require('../utils/CustomError');

const Buyer = {
    async create({ name, phone, address = null, outstanding_udhar = 0 }) {
        if (!name) throw new CustomError('Buyer name is required', 400);
    
        const [existingBuyer] = await db.query('SELECT id FROM buyers WHERE name = ? AND phone = ?', [name, phone]);
        if (existingBuyer.length > 0) throw new CustomError('Buyer already exists', 409);
    
        const [result] = await db.query(
            'INSERT INTO buyers (name, phone, address, outstanding_udhar) VALUES (?, ?, ?, ?)', 
            [name, phone, address, outstanding_udhar]
        );
    
        return result.insertId;
    },

    async update(buyerId, { name, phone, address }) {
        if (!name && !phone && !address) {
            throw new CustomError('No fields provided for update', 400);
        }
    
        if (phone) {
            const [existingBuyer] = await db.query(
                'SELECT id FROM buyers WHERE phone = ? AND id != ?',
                [phone, buyerId]
            );
            if (existingBuyer.length > 0) {
                throw new CustomError('This phone number belongs to another customer', 409);
            }
        }
    
        const fields = [];
        const values = [];
    
        if (name) { fields.push('name = ?'); values.push(name); }
        if (phone) { fields.push('phone = ?'); values.push(phone); }
        if (address) { fields.push('address = ?'); values.push(address); }
    
        values.push(buyerId);
    
        const [result] = await db.query(
            `UPDATE buyers SET ${fields.join(', ')} WHERE id = ?`, values
        );
    
        if (!result.affectedRows) {
            throw new CustomError('Buyer not found', 404);
        }
    },

    async softDeleteOrRestore(buyerId) {
        const [result] = await db.query('UPDATE buyers SET is_active = NOT is_active WHERE id = ?', [buyerId]);
        if (!result.affectedRows) throw new CustomError('Buyer not found', 404);
    },

    async getAllActiveBuyers() {
        const [rows] = await db.query('SELECT * FROM buyers WHERE is_active = 1');
        return rows;
    },

    async getAllInactiveBuyers() {
        const [rows] = await db.query('SELECT * FROM buyers WHERE is_active = 0');
        return rows;
    },

    async getAll() {
        const [rows] = await db.query('SELECT * FROM buyers');
        return rows;
    }
};

module.exports = Buyer;

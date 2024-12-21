const db = require('../config/db');

const Category = {
    async getAll() {
        const [rows] = await db.query('SELECT * FROM categories');
        return rows;
    },

    async create({ name }) {
        const [result] = await db.query(
            `INSERT INTO categories (name) VALUES (?)`,
            [name]
        );
        return result.insertId;
        
    }
}

module.exports = Category;
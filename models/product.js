const db = require('../config/db');

const Product = {
    async getAll() {
        const [rows] = await db.query('SELECT * FROM products');
        return rows;
    },

    async create({ name, price, image, available, category_id }) {
        const [result] = await db.query(
            `INSERT INTO products (name, price, image, available, category_id) VALUES (?, ?, ?, ?, ?)`,
            [name, price, image, available, category_id]
        );
        return result.insertId;
    },

    async update(id, { name, price, image, availability, category_id }) {
        await db.query(
            `UPDATE products SET name = ?, price = ?, image = ?, availability = ?, category_id = ? WHERE id = ?`,
            [name, price, image, availability, category_id, id]
        );
    },

    async delete(id) {
        await db.query(`DELETE FROM products WHERE id = ?`, [id]);
    },
};

module.exports = Product;

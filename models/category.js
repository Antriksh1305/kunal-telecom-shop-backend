const db = require('../config/db');

const validateCategoryName = (name) => {
    const regex = /^[a-zA-Z0-9\s]+$/;
    if (!name || name.trim().length === 0) {
        throw new Error('Category name cannot be empty.');
    }
    if (!regex.test(name)) {
        throw new Error('Category name can only contain letters, numbers, and spaces.');
    }
};

const Category = {
    // Get all categories
    async getAll() {
        const [rows] = await db.query('SELECT * FROM categories ORDER BY id ASC');
        return rows;
    },

    // Create a new category
    async create({ name }) {
        validateCategoryName(name);

        const [result] = await db.query(
            `INSERT INTO categories (name) VALUES (?)`,
            [name]
        );
        return result.insertId;
    },

    // Update a category by ID
    async update(categoryId, { name }) {
        validateCategoryName(name);

        const [result] = await db.query(
            `UPDATE categories SET name = ? WHERE id = ?`,
            [name, categoryId]
        );
        return result.affectedRows;
    },

    // Delete a category by ID
    async delete(categoryId) {
        const [result] = await db.query(`DELETE FROM categories WHERE id = ?`, [categoryId]);
        return result.affectedRows;
    },

    // Get category by ID
    async getById(categoryId) {
        const [rows] = await db.query(`SELECT * FROM categories WHERE id = ?`, [categoryId]);
        return rows[0];
    },
};

module.exports = Category;

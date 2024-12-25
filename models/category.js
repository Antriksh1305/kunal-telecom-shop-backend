const db = require('../config/db');
const { deleteAllFilesInFolder } = require('../services/imageService');

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
        try {
            validateCategoryName(name);

            const [result] = await db.query(
                `INSERT INTO categories (name) VALUES (?)`,
                [name]
            );

            return result.insertId;
        } catch (error) {
            throw error;
        }
    },

    // Update a category by ID
    async update(categoryId, { name }) {
        try {
            validateCategoryName(name);

            const category = await this.getById(categoryId);
            if (!category) {
                throw new Error('Category not found.');
            }

            const [result] = await db.query(
                `UPDATE categories SET name = ? WHERE id = ?`,
                [name, categoryId]
            );

            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    },

    // Delete a category by ID
    async delete(categoryId) {
        try {
            const [result] = await db.query(`DELETE FROM categories WHERE id = ?`, [categoryId]);

            const folderPath = `category-${categoryId}`;
            await deleteAllFilesInFolder(folderPath);

            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    },

    // Get category by ID
    async getById(categoryId) {
        const [rows] = await db.query(`SELECT * FROM categories WHERE id = ?`, [categoryId]);
        return rows[0];
    },
};

module.exports = Category;

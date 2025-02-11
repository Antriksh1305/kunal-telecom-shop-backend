const db = require('../config/db');
const { deleteAllFilesInFolder } = require('../services/imageService');
const CustomError = require('../utils/CustomError');

const validateCategoryName = (name) => {
    const regex = /^[a-zA-Z0-9\s]+$/;
    if (!name || name.trim().length === 0) {
        throw new CustomError('Category name cannot be empty.', 400);
    }
    if (!regex.test(name)) {
        throw new CustomError('Category name can only contain letters, numbers, and spaces.', 400);
    }
};

const ProductCategory = {
    // Get all categories
    async getAll() {
        try {
            const [rows] = await db.query('SELECT * FROM product_categories ORDER BY id ASC');
            return rows;
        } catch (error) {
            throw error;
        }
    },

    // Create a new category
    async create({ name }) {
        try {
            validateCategoryName(name);

            const [result] = await db.query(
                `INSERT INTO product_categories (name) VALUES (?)`,
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
                throw new CustomError('Category not found.', 404);
            }

            const [result] = await db.query(
                `UPDATE product_categories SET name = ? WHERE id = ?`,
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
            const [result] = await db.query(`DELETE FROM product_categories WHERE id = ?`, [categoryId]);

            if (result.affectedRows === 0) {
                throw new CustomError('Category not found for deletion.', 404);
            }

            const folderPath = `category-${categoryId}`;
            await deleteAllFilesInFolder(folderPath);

            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    },

    // Get category by ID
    async getById(categoryId) {
        try {
            const [rows] = await db.query(`SELECT * FROM product_categories WHERE id = ?`, [categoryId]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    },

    async getByName(category_name) {
        try {
            const [rows] = await db.query(`SELECT * FROM product_categories WHERE name = ?`, [category_name]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }
};

module.exports = ProductCategory;

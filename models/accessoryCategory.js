const db = require('../config/db');
const { deleteAllFilesInFolder } = require('../services/imageService');
const CustomError = require('../utils/CustomError');
const { getByName } = require('./productCategory');

const validateCategoryName = (name) => {
    const regex = /^[a-zA-Z0-9\s]+$/;
    if (!name || name.trim().length === 0) {
        throw new CustomError('Category name cannot be empty.', 400);
    }
    if (!regex.test(name)) {
        throw new CustomError('Category name can only contain letters, numbers, and spaces.', 400);
    }
};

const AccessoryCategory = {
    // Get all accessory categories
    async getAll() {
        const [rows] = await db.query('SELECT * FROM accessory_categories ORDER BY id ASC');
        return rows;
    },

    // Create a new accessory category
    async create({ name }) {
        try {
            validateCategoryName(name);

            const [result] = await db.query(
                `INSERT INTO accessory_categories (name) VALUES (?)`,
                [name]
            );

            if (result.insertId) {
                return result.insertId;
            } else {
                throw new CustomError('Unable to create category.', 500);
            }
        } catch (error) {
            throw error;
        }
    },

    // Update an accessory category by ID
    async update(categoryId, { name }) {
        try {
            validateCategoryName(name);

            const category = await this.getById(categoryId);
            if (!category) {
                throw new CustomError('Category not found.', 404);
            }

            const [result] = await db.query(
                `UPDATE accessory_categories SET name = ? WHERE id = ?`,
                [name, categoryId]
            );

            if (result.affectedRows === 0) {
                throw new CustomError('No changes made to category.', 400);
            }

            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    },

    // Delete an accessory category by ID
    async delete(categoryId) {
        try {
            const category = await this.getById(categoryId);
            if (!category) {
                throw new CustomError('Category not found.', 404);
            }

            const [result] = await db.query(`DELETE FROM accessory_categories WHERE id = ?`, [categoryId]);

            const folderPath = `category-${categoryId}`;
            await deleteAllFilesInFolder(folderPath);

            if (result.affectedRows === 0) {
                throw new CustomError('Unable to delete category.', 500);
            }

            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    },

    // Get accessory category by ID
    async getById(categoryId) {
        const [rows] = await db.query(`SELECT * FROM accessory_categories WHERE id = ?`, [categoryId]);
        return rows[0];
    },

    async getByName(name) {
        const [rows] = await db.query(`SELECT * FROM accessory_categories WHERE name = ?`, [name]);
        return rows[0];
    }
};

module.exports = AccessoryCategory;

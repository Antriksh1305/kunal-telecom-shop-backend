const db = require('../config/db');

// models
const accessoryCategory = require('./accessoryCategory');

// services
const { uploadToImageKit, deleteFileFromImageKit } = require('../services/imageService');

// utils
const CustomError = require('../utils/CustomError');

// Validate accessory data
const validateAccessoryData = ({ name, hinglish_name, market_price, dealer_price, category_id, color }) => {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw new CustomError('Accessory name is required and must be a non-empty string.', 400);
    }
    if (hinglish_name && typeof hinglish_name !== 'string') {
        throw new CustomError('Hinglish name must be a string.', 400);
    }
    if (typeof market_price !== 'number' || market_price <= 0) {
        throw new CustomError('Market price must be a positive number.', 400);
    }
    if (typeof dealer_price !== 'number' || dealer_price <= 0) {
        throw new CustomError('Dealer price must be a positive number.', 400);
    }
    if (!category_id || typeof category_id !== 'number' || category_id <= 0) {
        throw new CustomError('Valid category is required.', 400);
    }
    if (color && typeof color !== 'string') {
        throw new CustomError('Color must be a string.', 400);
    }
};

const Accessory = {
    // Get all accessories (Paginated and filtered)
    async getAll({
        page = 1, limit = 10, name, hinglish_name, category_name,
        min_price, max_price, available, color = []
    }) {
        const offset = (page - 1) * limit;
        const params = [];
        let filters = ` WHERE 1=1`;

        // Apply filters dynamically
        if (name) {
            filters += ` AND name LIKE ?`;
            params.push(`%${name}%`);
        }
        if (hinglish_name) {
            filters += ` AND hinglish_name LIKE ?`;
            params.push(`%${hinglish_name}%`);
        }
        if (category_name) {
            const category = await accessoryCategory.getByName(category_name);
            const categoryId = category?.id ?? null;

            if (categoryId) {
                filters += ` AND category_id = ?`;
                params.push(categoryId);
            }
        }
        if (min_price) {
            filters += ` AND (market_price >= ? OR dealer_price >= ?)`;
            params.push(min_price, min_price);
        }
        if (max_price) {
            filters += ` AND (market_price <= ? OR dealer_price <= ?)`;
            params.push(max_price, max_price);
        }
        if (available) {
            filters += ` AND available >= ?`;
            params.push(available);
        }
        if (color.length > 0) {
            const placeholders = color.map(() => '?').join(', ');
            filters += ` AND color IN (${placeholders})`;
            params.push(...color);
        }

        // 1️⃣ Fetch total count
        const countQuery = `SELECT COUNT(*) AS total FROM accessories ${filters}`;
        const [[{ total }]] = await db.query(countQuery, params);

        // 2️⃣ Fetch paginated products
        const accesoryQuery = `SELECT * FROM accessories ${filters} ORDER BY id ASC LIMIT ? OFFSET ?;`;
        const [accesories] = await db.query(accesoryQuery, [...params, limit, offset]);

        return {
            accesories,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        };
    },

    // Get accessory by ID
    async getById(id) {
        const [rows] = await db.query('SELECT * FROM accessories WHERE id = ?', [id]);
        if (rows.length === 0) {
            throw new CustomError('Accessory not found.', 404);
        }
        return rows[0];
    },

    // Create a new accessory
    async create({ name, hinglish_name, category_id, market_price, dealer_price, image, available, color }) {
        let imageURL = null, imageId = null;

        try {
            validateAccessoryData({ name, hinglish_name, market_price, dealer_price, category_id, color });

            // check for duplicate accessory name
            const [existingAccessory] = await db.query(
                'SELECT id FROM accessories WHERE name = ? AND color = ?', [name, color]
            );
            if (existingAccessory.length > 0) {
                throw new CustomError('Accessory with this name and color already exists.', 400);
            }

            if (image !== null && image !== undefined) {
                const imageResponse = await uploadToImageKit(image, name, `accessoryCategory-${category_id}`);
                imageURL = imageResponse?.url;
                imageId = imageResponse?.fileId;
            }

            const [result] = await db.query(
                `INSERT INTO accessories (name, hinglish_name, category_id, market_price, dealer_price, imageURL, imageId, available, color) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [name, hinglish_name, category_id, market_price, dealer_price, imageURL, imageId, available, color]
            );

            return result?.insertId;
        } catch (error) {
            if (imageId !== null) {
                await deleteFileFromImageKit(imageId);
            }
            throw error;
        }
    },

    // Update an existing accessory
    async update(id, { name, hinglish_name, market_price, dealer_price, available, category_id, color }) {
        try {
            validateAccessoryData({ name, hinglish_name, market_price, dealer_price, category_id, color });

            const [result] = await db.query(
                `UPDATE accessories SET name = ?, hinglish_name = ?, market_price = ?, dealer_price = ?, available = ?, color = ?
                WHERE id = ?`,
                [name, hinglish_name, market_price, dealer_price, available, color, id]
            );

            if (result?.affectedRows === 0) {
                throw new CustomError('Accessory not found or no changes made.', 404);
            }

            return result?.affectedRows;
        } catch (error) {
            throw error;
        }
    },

    // Update existing accessory image
    async updateImage(accesoryId, image) {
        let imageURL = null, imageId = null;
        try {
            const accesory = await this.getById(accesoryId);

            if (!accesory) {
                throw new CustomError('Accessory not found.', 404);
            }

            // upload new image
            const imageResponse = await uploadToImageKit(image, accesory?.name, `accessoryCategory-${accesory?.category_id}`);
            imageURL = imageResponse?.url;
            imageId = imageResponse?.fileId;

            if (!imageURL || !imageId) {
                throw new CustomError('Unable to Update image.', 500);
            }

            const [result] = await db.query(
                `UPDATE accessories SET imageURL = ?, imageId = ? WHERE id = ?`,
                [imageURL, imageId, accesoryId]
            );

            if (accesory?.imageId) {
                await deleteFileFromImageKit(accesory?.imageId);
            }

            return result?.affectedRows;
        } catch (error) {
            if (imageId) {
                await deleteFileFromImageKit(imageId);
            }
            throw error;
        }
    },

    // Delete an accessory
    async delete(id) {
        try {
            const accesory = await this.getById(id);
            if (!accesory) {
                throw new CustomError('Accessory not found.', 404);
            }

            const [result] = await db.query('DELETE FROM accessories WHERE id = ?', [id]);

            if (accesory?.imageId) {
                await deleteFileFromImageKit(accesory?.imageId);
            }

            if (result?.affectedRows === 0) {
                throw new CustomError('Unable to delete accessory.', 500);
            }
        } catch (error) {
            throw error;
        }
    }
};

module.exports = Accessory;

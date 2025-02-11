const db = require('../config/db');

// models
const productCategory = require('./productCategory');

// services
const { uploadToImageKit, deleteFileFromImageKit } = require('../services/imageService');

// utils
const CustomError = require('../utils/CustomError');

const validateProductData = ({ name, hinglish_name, market_price, dealer_price, category_id, color, variant }) => {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw new CustomError('Product name is required and must be a non-empty string.', 400);
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
    if (variant && typeof variant !== 'string') {
        throw new CustomError('Variant must be a string.', 400);
    }
};

const Product = {
    async getAll({
        page = 1, limit = 10, name, hinglish_name, category_name,
        min_price, max_price, available, color = [], variant = []
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
            const category = await productCategory.getByName(category_name);
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

        if (variant.length > 0) {
            const placeholders = variant.map(() => '?').join(', ');
            filters += ` AND variant IN (${placeholders})`;
            params.push(...variant);
        }

        // 1️⃣ Fetch total count
        const countQuery = `SELECT COUNT(*) AS total FROM products ${filters}`;
        const [[{ total }]] = await db.query(countQuery, params);

        // 2️⃣ Fetch paginated products
        const productQuery = `
        SELECT * FROM products 
        ${filters} 
        ORDER BY id ASC 
        LIMIT ? OFFSET ?;
    `;

        const [products] = await db.query(productQuery, [...params, limit, offset]);

        return {
            products,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        };
    },

    // Get product by ID
    async getById(id) {
        const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
        return rows[0];
    },

    // Create a new product
    async create({ name, hinglish_name, category_id, market_price, dealer_price, image, available, color, variant }) {
        let imageURL = null, imageId = null;

        try {
            validateProductData({ name, hinglish_name, market_price, dealer_price, category_id, color, variant });

            // check for duplicate product name
            const [existingProduct] = await db.query(
                'SELECT id FROM products WHERE name = ? AND color = ? AND variant = ?', [name, color, variant]
            );
            if (existingProduct.length > 0) {
                throw new CustomError('Product with this name, color, and variant already exists.', 409);
            }

            if (image !== null && image !== undefined) {
                const imageResponse = await uploadToImageKit(image, name, `productCategory-${category_id}`);
                imageURL = imageResponse.url;
                imageId = imageResponse.fileId;
            }

            const [result] = await db.query(
                `INSERT INTO products (name, hinglish_name, category_id, market_price, dealer_price, imageURL, imageId, available, color, variant) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [name, hinglish_name, category_id, market_price, dealer_price, imageURL, imageId, available, color, variant]
            );

            return result.insertId;
        } catch (error) {
            if (imageId !== null) {
                await deleteFileFromImageKit(imageId);
            }
            throw error;
        }
    },

    // Update an existing product
    async update(id, { name, hinglish_name, market_price, dealer_price, available, category_id, color, variant }) {
        try {
            validateProductData({ name, hinglish_name, market_price, dealer_price, category_id, color, variant });

            const [result] = await db.query(
                `UPDATE products SET name = ?, hinglish_name = ?, market_price = ?, dealer_price = ?, available = ?, color = ?, variant = ? 
                WHERE id = ?`,
                [name, hinglish_name, market_price, dealer_price, available, color, variant, id]
            );

            if (result.affectedRows === 0) {
                throw new CustomError('Product not found.', 404);
            }

            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    },

    // Update existing product image
    async updateImage(productId, image) {
        let imageURL = null, imageId = null;
        try {
            const product = await this.getById(productId);

            if (!product) {
                throw new CustomError('Product not found.', 404);
            }

            // upload new image
            const imageResponse = await uploadToImageKit(image, product.name, `productCategory-${product.category_id}`);
            imageURL = imageResponse.url;
            imageId = imageResponse.fileId;

            if (!imageURL || !imageId) {
                throw new CustomError('Unable to update image.', 500);
            }

            const [result] = await db.query(
                `UPDATE products SET imageURL = ?, imageId = ? WHERE id = ?`,
                [imageURL, imageId, productId]
            );

            if (product.imageId) {
                await deleteFileFromImageKit(product.imageId);
            }

            return result.affectedRows;
        } catch (error) {
            if (imageId) {
                await deleteFileFromImageKit(imageId);
            }
            throw error;
        }
    },

    // Delete a product
    async delete(id) {
        try {
            const product = await this.getById(id);

            if (!product) {
                throw new CustomError('Product not found.', 404);
            }

            const [result] = await db.query('DELETE FROM products WHERE id = ?', [id]);

            if (product?.imageId) {
                await deleteFileFromImageKit(product?.imageId);
            }

            if (result.affectedRows === 0) {
                throw new CustomError('Unable to delete product.', 500);
            }
        } catch (error) {
            throw error;
        }
    }
};

module.exports = Product;

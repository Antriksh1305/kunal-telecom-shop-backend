const db = require('../config/db');

const validateProductData = ({ name, hinglish_name, market_price, dealer_price, category_id, color, variant }) => {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw new Error('Product name is required and must be a non-empty string.');
    }
    if (hinglish_name && typeof hinglish_name !== 'string') {
        throw new Error('Hinglish name must be a string.');
    }
    if (typeof market_price !== 'number' || market_price <= 0) {
        throw new Error('Market price must be a positive number.');
    }
    if (typeof dealer_price !== 'number' || dealer_price <= 0) {
        throw new Error('Dealer price must be a positive number.');
    }
    if (!category_id || typeof category_id !== 'number' || category_id <= 0) {
        throw new Error('Valid category is required.');
    }
    if (color && typeof color !== 'string') {
        throw new Error('Color must be a string.');
    }
    if (variant && typeof variant !== 'string') {
        throw new Error('Variant must be a string.');
    }
};

const Product = {
    // Get all products
    async getAll() {
        const [rows] = await db.query('SELECT * FROM products ORDER BY id ASC');
        return rows;
    },

    // Get product by ID
    async getById(id) {
        const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
        return rows[0];
    },

    // Create a new product
    async create({ name, hinglish_name, market_price, dealer_price, image, available, category_id, color, variant }) {
        try {
            validateProductData({ name, hinglish_name, market_price, dealer_price, category_id, color, variant });

            const [result] = await db.query(
                `INSERT INTO products (name, hinglish_name, market_price, dealer_price, image, available, category_id, color, variant) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [name, hinglish_name, market_price, dealer_price, image, available, category_id, color, variant]
            );
            return result.insertId;
        } catch (error) {
            throw new Error(error.message);
        }
    },

    // Update an existing product
    async update(id, { name, hinglish_name, market_price, dealer_price, image, available, category_id, color, variant }) {
        try {
            validateProductData({ name, hinglish_name, market_price, dealer_price, category_id, color, variant });

            const [result] = await db.query(
                `UPDATE products SET name = ?, hinglish_name = ?, market_price = ?, dealer_price = ?, image = ?, available = ?, category_id = ?, color = ?, variant = ? 
                WHERE id = ?`,
                [name, hinglish_name, market_price, dealer_price, image, available, category_id, color, variant, id]
            );

            if (result.affectedRows === 0) {
                throw new Error('Product not found or no changes made.');
            }
            return result.affectedRows;
        } catch (error) {
            throw new Error(error.message);
        }
    },

    // Delete a product
    async delete(id) {
        try {
            const [result] = await db.query('DELETE FROM products WHERE id = ?', [id]);
            if (result.affectedRows === 0) {
                throw new Error('Product not found.');
            }
        } catch (error) {
            throw new Error(error.message);
        }
    }
};

module.exports = Product;

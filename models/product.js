const db = require('../config/db');
const { uploadToImageKit, deleteFileFromImageKit, moveFileToNewFolder } = require('../services/imageService');

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
    async create({ name, hinglish_name, category_id, market_price, dealer_price, image, available, color, variant }) {
        let imageURL = null, imageId = null;

        try {
            validateProductData({ name, hinglish_name, market_price, dealer_price, category_id, color, variant });

            // check for duplicate product name
            const [existingProduct] = await db.query('SELECT id FROM products WHERE name = ?', [name]);
            if (existingProduct.length > 0) {
                throw new Error('Product with this name already exists.');
            }

            if (image !== null && image !== undefined) {
                const imageResponse = await uploadToImageKit(image, name, `category-${category_id}`);
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
                throw new Error('Product not found or no changes made.');
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
                throw new Error('Product not found.');
            }

            // upload new image
            const imageResponse = await uploadToImageKit(image, product.name, `category-${product.category_id}`);
            imageURL = imageResponse.url;
            imageId = imageResponse.fileId;

            if (!imageURL || !imageId) {
                throw new Error('Unable to Update image.');
            }

            const [result] = await db.query(
                `UPDATE products SET imageURL = ?, imageId = ? WHERE id = ?`,
                [imageURL, imageId, productId]
            );

            if (result.affectedRows === 0) {
                throw new Error('Product not found or no changes made.');
            }

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
            const product = this.getById(id);
            
            if (!product) {
                throw new Error('Product not found.');
            }

            const [result] = await db.query('DELETE FROM products WHERE id = ?', [id]);
            
            if (product[0].imageId) {
                await deleteFileFromImageKit(product.imageId);
            }

            if (result.affectedRows === 0) {
                throw new Error('Product not found.');
            }
        } catch (error) {
            throw error;
        }
    }
};

module.exports = Product;

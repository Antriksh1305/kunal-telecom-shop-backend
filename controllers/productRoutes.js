const express = require('express');

// models
const Product = require('../models/product');

// middlewares
const protect = require('../middlewares/authentication');
const authorize = require('../middlewares/authorization');

// utils
const { handleSqlError } = require('../utils/errorHandler');

const router = express.Router();

// Get all products
router.get('/', protect, async (req, res, next) => {
    try {
        const products = await Product.getAll();
        res.json(products);
    } catch (error) {
        next(error);
    }
});

// Get a single product by ID
router.get('/:id', protect, async (req, res, next) => {
    const { id } = req.params;
    try {
        const product = await Product.getById(id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }
        res.json(product);
    } catch (error) {
        next(error);
    }
});

// Create a new product
router.post('/', protect, authorize('manage_product'), async (req, res, next) => {
    const { name, hinglish_name, market_price, dealer_price, image, available, category_id, color, variant } = req.body;
    
    try {
        const newProductId = await Product.create({ name, hinglish_name, market_price, dealer_price, image, available, category_id, color, variant });
        res.status(201).json({ message: 'Product created successfully!', id: newProductId });
    } catch (error) {
        next(error);
    }
});

// Update a product
router.put('/:id', protect, authorize('manage_product'), async (req, res, next) => {
    const { id } = req.params;
    
    try {
        await Product.update(id, req.body);
        res.json({ message: 'Product updated successfully!' });
    } catch (error) {
        next(error);
    }
});

// Delete a product
router.delete('/:id', protect, authorize('manage_product'), async (req, res, next) => {
    const { id } = req.params;
    
    try {
        await Product.delete(id);
        res.json({ message: 'Product deleted successfully!' });
    } catch (error) {
        next(error);
    }
});

router.use((err, req, res, next) => {
    if (err.code && err.errno) {
        return handleSqlError(err, res);
    }

    if (err.message) {
        return res.status(400).json({ error: err.message });
    }

    return res.status(500).json({ error: 'Server error' });
});

module.exports = router;

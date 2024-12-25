const express = require('express');

// models
const Product = require('../models/product');

// middlewares
const protect = require('../middlewares/authentication');
const authorize = require('../middlewares/authorization');
const upload = require('../middlewares/multerConfig');

// utils
const { handleSqlError } = require('../utils/errorHandler');
const { parse } = require('dotenv');

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
router.post('/', protect, authorize('manage_product'), upload.single('image'), async (req, res, next) => {
    const { name, hinglish_name, market_price, dealer_price, available, category_id, color, variant } = req.body;

    const image = req.file ? req.file?.buffer : null;

    try {
        const newProductId = await Product.create({ 
            name, 
            hinglish_name, 
            category_id: parseInt(category_id), 
            market_price: parseFloat(market_price), 
            dealer_price: parseFloat(dealer_price), 
            image, 
            available: parseInt(available), 
            color, 
            variant 
        });

        res.status(201).json({ message: 'Product created successfully!', id: newProductId });
    } catch (error) {
        next(error);
    }
});

// Update a product
router.put('/:id', protect, authorize('manage_product'), upload.none(), async (req, res, next) => {
    const { id } = req.params;
    const { name, hinglish_name, market_price, dealer_price, available, category_id, color, variant } = req.body;

    try {
        await Product.update(id, {
            name, 
            hinglish_name, 
            category_id: parseInt(category_id), 
            market_price: parseFloat(market_price), 
            dealer_price: parseFloat(dealer_price), 
            available: parseInt(available), 
            color,
            variant
        });
        res.json({ message: 'Product updated successfully!' });
    } catch (error) {
        next(error);
    }
});

// Update a product image
router.put('/:id/image', protect, authorize('manage_product'), upload.single('image'), async (req, res, next) => {
    const { id } = req.params;
    const image = req.file ? req.file.buffer : null;

    try {
        await Product.updateImage(id, image);
        res.json({ message: 'Product image updated successfully!' });
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

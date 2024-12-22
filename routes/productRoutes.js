const express = require('express');
const Product = require('../models/product');

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
    try {
        const products = await Product.getAll();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a single product by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const product = await Product.getById(id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new product
router.post('/', async (req, res) => {
    const { name, hinglish_name, market_price, dealer_price, image, available, category_id, color, variant } = req.body;
    
    try {
        const newProductId = await Product.create({ name, hinglish_name, market_price, dealer_price, image, available, category_id, color, variant });
        res.status(201).json({ message: 'Product created successfully!', id: newProductId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: `Product with name '${req.body.name}' already exists.`,
            });
        }
        res.status(500).json({ error: error.message || 'An error occurred while creating the product.' });
    }
});

// Update a product
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const updatedProduct = await Product.update(id, req.body);
        if (updatedProduct === 0) {
            return res.status(404).json({ error: 'Product not found or no changes made.' });
        }
        res.json({ message: 'Product updated successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message || 'An error occurred while updating the product.' });
    }
});

// Delete a product
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const deletedProduct = await Product.delete(id);
        if (deletedProduct === 0) {
            return res.status(404).json({ error: 'Product not found.' });
        }
        res.json({ message: 'Product deleted successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message || 'An error occurred while deleting the product.' });
    }
});

module.exports = router;

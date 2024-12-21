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

// Create a new product
router.post('/create', async (req, res) => {
    try {
        const newProductId = await Product.create(req.body);
        res.status(201).json({ message: 'Product created successfully!', id: newProductId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            // Handle duplicate entry
            return res.status(409).json({
                message: `Product with name '${req.body.name}' already exists.`,
            });
        }
        res.status(500).json({ error: 'An error occurred while creating the product.' });
    }
});

// Update a product
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Product.update(id, req.body);
        res.json({ message: 'Product updated successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a product
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Product.delete(id);
        res.json({ message: 'Product deleted successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

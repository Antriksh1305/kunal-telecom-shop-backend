const express = require('express');
const Category = require('../models/category');

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
    try {
        const categories = await Category.getAll();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new category
router.post('/create', async (req, res) => {
    try {
        const newCategoryId = await Category.create(req.body);
        res.status(201).json({ message: 'Category created successfully!', id: newCategoryId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            // Handle duplicate entry
            return res.status(409).json({
                message: `Category with name '${req.body.name}' already exists.`,
            });
        }
        res.status(500).json({ error: 'An error occurred while creating the category.' });
    }
});

module.exports = router;
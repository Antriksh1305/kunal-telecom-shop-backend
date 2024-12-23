const express = require('express');
const Category = require('../models/category');
const protect = require('../middlewares/authentication');
const authorize = require('../middlewares/authorization');

const router = express.Router();

// Get all categories
router.get('/', protect, async (req, res) => {
    try {
        const categories = await Category.getAll();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching categories.' });
    }
});

// Get a single category by ID
router.get('/:id', protect, async (req, res) => {
    const categoryId = req.params.id;
    try {
        const category = await Category.getById(categoryId);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json(category);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching the category.' });
    }
});

// Create a new category
router.post('/', protect, authorize('manage_product_categories'), async (req, res) => {
    const { name } = req.body;

    // Manual validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Category name is required and must be non-empty.' });
    }

    if (name.length > 255) {
        return res.status(400).json({ error: 'Category name should be less than 255 characters.' });
    }

    try {
        const newCategoryId = await Category.create({ name });
        res.status(201).json({ message: 'Category created successfully!', id: newCategoryId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: `Category with name '${name}' already exists.`,
            });
        }
        res.status(500).json({ error: 'An error occurred while creating the category.' });
    }
});

// Update an existing category
router.put('/:id', protect, authorize('manage_product_categories'), async (req, res) => {
    const categoryId = req.params.id;
    const { name } = req.body;

    // Manual validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Category name is required and must be a non-empty string.' });
    }

    if (name.length > 255) {
        return res.status(400).json({ error: 'Category name should be less than 255 characters.' });
    }

    try {
        const updatedRows = await Category.update(categoryId, { name });
        if (updatedRows === 0) {
            return res.status(404).json({ error: 'Category not found or no changes made.' });
        }
        res.json({ message: 'Category updated successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while updating the category.' });
    }
});

// Delete a category
router.delete('/:id', protect, authorize('manage_product_categories'), async (req, res) => {
    const categoryId = req.params.id;
    try {
        const deletedRows = await Category.delete(categoryId);
        if (deletedRows === 0) {
            return res.status(404).json({ error: 'Category not found.' });
        }
        res.json({ message: 'Category deleted successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while deleting the category.' });
    }
});

module.exports = router;

const express = require('express');

// models
const Acccessory = require('../models/accessory');

// middlewares
const protect = require('../middlewares/authentication');
const authorize = require('../middlewares/authorization');
const upload = require('../middlewares/multerConfig');

const router = express.Router();

// Get all accessory
router.get('/', protect, async (req, res, next) => {
    try {
        const parseArray = (value) => (value ? value.split(',') : []);

        const filters = {
            page: parseInt(req?.query?.page) || 1,
            limit: parseInt(req?.query?.limit) || 10,
            name: req?.query?.name,
            hinglish_name: req?.query?.hinglish_name,
            category_name: req?.query?.category_name,
            min_price: req?.query?.min_price,
            max_price: req?.query?.max_price,
            available: req?.query?.available,
            color: parseArray(req?.query?.color),
        };

        const data = await Acccessory.getAll(filters);
        res.json(data);
    } catch (error) {
        next(error);
    }
});

// Get a single accessory by ID
router.get('/:id', protect, async (req, res, next) => {
    const { id } = req.params;
    try {
        const accesory = await Acccessory.getById(id);
        if (!accesory) {
            return res.status(404).json({ error: 'Acccessory not found.' });
        }
        res.json(accesory);
    } catch (error) {
        next(error);
    }
});

// Create a new accessory
router.post('/', protect, authorize('manage_product'), upload.single('image'), async (req, res, next) => {
    const { name, hinglish_name, market_price, dealer_price, available, category_id, color } = req.body;

    const image = req.file ? req.file?.buffer : null;

    try {
        const newAccessoryId = await Acccessory.create({
            name,
            hinglish_name,
            category_id: parseInt(category_id),
            market_price: parseFloat(market_price),
            dealer_price: parseFloat(dealer_price),
            image,
            available: parseInt(available),
            color,
        });

        res.status(201).json({ message: 'Acccessory created successfully!', id: newAccessoryId });
    } catch (error) {
        next(error);
    }
});

// Update an accessory
router.put('/:id', protect, authorize('manage_product'), upload.none(), async (req, res, next) => {
    const { id } = req.params;
    const { name, hinglish_name, market_price, dealer_price, available, category_id, color } = req.body;

    try {
        await Acccessory.update(id, {
            name,
            hinglish_name,
            category_id: parseInt(category_id),
            market_price: parseFloat(market_price),
            dealer_price: parseFloat(dealer_price),
            available: parseInt(available),
            color,
        });
        res.json({ message: 'Acccessory updated successfully!' });
    } catch (error) {
        next(error);
    }
});

// Update an accessory image
router.put('/:id/image', protect, authorize('manage_product'), upload.single('image'), async (req, res, next) => {
    const { id } = req.params;
    const image = req.file ? req.file.buffer : null;

    try {
        await Acccessory.updateImage(id, image);
        res.json({ message: 'Acccessory image updated successfully!' });
    } catch (error) {
        next(error);
    }
});

// Delete an accessory
router.delete('/:id', protect, authorize('manage_product'), async (req, res, next) => {
    const { id } = req.params;

    try {
        await Acccessory.delete(id);
        res.json({ message: 'Acccessory deleted successfully!' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

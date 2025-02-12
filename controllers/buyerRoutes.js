const express = require('express');
const Buyer = require('../models/buyer');
const protect = require('../middlewares/authentication');

const router = express.Router();

// Create a new buyer
router.post('/', protect, async (req, res, next) => {
    try {
        const { name, phone, address, udhar } = req.body;
        const buyerId = await Buyer.create({
            name,
            phone,
            address,
            outstanding_udhar: udhar !== undefined ? parseFloat(udhar) : undefined
        });
        res.status(201).json({ message: 'Buyer created successfully', buyerId });
    } catch (error) {
        next(error);
    }
});

// Update a buyer
router.put('/:buyerId', protect, async (req, res, next) => {
    try {
        const { buyerId } = req.params;
        const { name, phone, address } = req.body;
        await Buyer.update(buyerId, {
            name,
            phone,
            address,
        });
        res.status(200).json({ message: 'Buyer updated successfully' });
    } catch (error) {
        next(error);
    }
});

// Soft delete or restore a buyer
router.put('/:buyerId/soft-delete', protect, async (req, res, next) => {
    try {
        const { buyerId } = req.params;
        await Buyer.softDeleteOrRestore(buyerId);
        res.status(200).json({ message: 'Buyer status updated successfully' });
    } catch (error) {
        next(error);
    }
});

// Get all active buyers
router.get('/active', protect, async (req, res, next) => {
    try {
        const buyers = await Buyer.getAllActiveBuyers();
        res.status(200).json({ buyers });
    } catch (error) {
        next(error);
    }
});

// Get all inactive buyers
router.get('/inactive', protect, async (req, res, next) => {
    try {
        const buyers = await Buyer.getAllInactiveBuyers();
        res.status(200).json({ buyers });
    } catch (error) {
        next(error);
    }
});

// Get all eligible buyers
router.get('/', protect, async (req, res, next) => {
    try {
        const buyers = await Buyer.getAll();
        res.status(200).json({ buyers });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

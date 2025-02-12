const express = require('express');
const Transaction = require('../models/transaction');
const protect = require('../middlewares/authentication');

const router = express.Router();

// Create a transaction
router.post('/', protect, async (req, res, next) => {
    let transactionId = null;
    try {
        const { buyer_id, user_id, total_amount, paid_amount, payment_method, products, accessories } = req.body;

        if (!user_id || !total_amount || !paid_amount || !payment_method) {
            return res.status(400).json({ error: 'Invalid transaction data' });
        }

        transactionId = await Transaction.create({
            buyer_id,
            user_id,
            total_amount: parseFloat(total_amount),
            paid_amount: parseFloat(paid_amount),
            payment_method
        });

        // Insert products
        if (Array.isArray(products)) {
            for (const product of products) {
                await Transaction.addTransactionProduct(
                    transactionId,
                    product.product_id,
                    product.product_name,
                    product.product_price,
                    product.quantity
                );
            }
        }

        // Insert accessories
        if (Array.isArray(accessories)) {
            for (const accessory of accessories) {
                await Transaction.addTransactionAccessory(
                    transactionId,
                    accessory.accessory_id,
                    accessory.accessory_name,
                    accessory.accessory_price,
                    accessory.quantity
                );
            }
        }

        res.status(201).json({ message: 'Transaction created successfully', transactionId });
    } catch (error) {
        if (transactionId) await Transaction.delete(transactionId);
        next(error);
    }
});

// Delete a transaction
router.delete('/:transactionId', protect, async (req, res, next) => {
    try {
        const { transactionId } = req.params;
        await Transaction.delete(transactionId);
        res.status(200).json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        next(error);
    }
});

// Get all transactions for a buyer
router.get('/buyer/:buyerId', protect, async (req, res, next) => {
    try {
        const { buyerId } = req.params;
        const transactions = await Transaction.getByBuyerId(buyerId);
        res.status(200).json({ transactions });
    } catch (error) {
        next(error);
    }
});

// Create a udhar payment for a buyer
router.post('/pay-udhar', protect, async (req, res, next) => {
    try {
        const { buyer_id, user_id, paid_amount, payment_method } = req.body;

        if (!user_id || !paid_amount || !payment_method) {
            return res.status(400).json({ error: 'Invalid transaction data' });
        }

        const transactionId = await Transaction.payUdhar({ buyer_id, user_id, paid_amount, payment_method });

        res.status(201).json({ message: 'Udhar Paid successfully', transactionId });
    } catch (error) {
        next(error);
    }
});

// Get All transactions
router.get('/', protect, async (req, res, next) => {
    try {
        const transactions = await Transaction.getAll();

        res.status(200).json({ transactions });
    } catch (error) {
        next(error);
    }
});

// Get All products and accessories for a transaction
router.get('/:transactionId', protect, async (req, res, next) => {
    try {
        const { transactionId } = req.params;
        const transactionItems = await Transaction.getTransactionItems(transactionId);

        res.status(200).json(transactionItems);
    } catch (error) {
        next(error);
    }
});


module.exports = router;

const db = require('../config/db');
const CustomError = require('../utils/CustomError');

const Transaction = {
    async create({ buyer_id, user_id, total_amount, paid_amount, payment_method }) {
        if (!user_id || !total_amount || !paid_amount || !payment_method) {
            throw new CustomError('Missing required fields', 400);
        }

        const [result] = await db.query(
            `INSERT INTO buyer_transactions (buyer_id, user_id, total_amount, paid_amount, payment_method, transaction_date) 
            VALUES (?, ?, ?, ?, ?, NOW())`,
            [buyer_id, user_id, total_amount, paid_amount, payment_method]
        );

        return result.insertId;
    },

    async addTransactionProduct(transaction_id, product_id, product_name, product_price, quantity) {
        const [result] = await db.query(
            `INSERT INTO transaction_products (transaction_id, product_id, product_name, product_price, quantity) 
            VALUES (?, ?, ?, ?, ?)`,
            [transaction_id, product_id, product_name, product_price, quantity]
        );

        return result.insertId;
    },

    async addTransactionAccessory(transaction_id, accessory_id, accessory_name, accessory_price, quantity) {
        const [result] = await db.query(
            `INSERT INTO transaction_accessories (transaction_id, accessory_id, accessory_name, accessory_price, quantity) 
            VALUES (?, ?, ?, ?, ?)`,
            [transaction_id, accessory_id, accessory_name, accessory_price, quantity]
        );

        return result.insertId;
    },

    async delete(transactionId) {
        const [result] = await db.query(`DELETE FROM buyer_transactions WHERE id = ?`, [transactionId]);

        if (result.affectedRows === 0) {
            throw new CustomError('Transaction not found', 404);
        }
    },

    async getByBuyerId(buyerId) {
        const [rows] = await db.query(
            `SELECT * FROM buyer_transactions WHERE buyer_id = ? ORDER BY transaction_date DESC`,
            [buyerId]
        );
        return rows;
    },

    async payUdhar({ buyer_id, user_id, paid_amount, payment_method }) {
        if (!user_id || !paid_amount || !payment_method) {
            throw new CustomError('Missing required fields', 400);
        }

        const [result] = await db.query(
            `INSERT INTO buyer_transactions (buyer_id, user_id, total_amount, paid_amount, payment_method, is_udhar_payment, transaction_date) 
            VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [buyer_id, user_id, 0, paid_amount, payment_method, 1]
        );

        return result.insertId;
    },

    async getAll() {
        const [rows] = await db.query(`SELECT * FROM buyer_transactions ORDER BY transaction_date DESC`);
        return rows;
    },

    async getTransactionItems(transactionId) {
        const [products] = await db.query(
            `SELECT * FROM transaction_products WHERE transaction_id = ?`, 
            [transactionId]
        );
        const [accessories] = await db.query(
            `SELECT * FROM transaction_accessories WHERE transaction_id = ?`, 
            [transactionId]
        );

        return { products, accessories };
    }
};

module.exports = Transaction;

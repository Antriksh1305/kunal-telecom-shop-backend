const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// models
const User = require('../models/user');

// middlewares
const protect = require('../middlewares/authentication');
const { loginLimiter, signupLimiter } = require('../middlewares/rateLimiter');

// services
const emailService = require('../services/emailService');

// utils
const { handleSqlError } = require('../utils/errorHandler');

const router = express.Router();

// Signup Route
router.post('/signup', signupLimiter, async (req, res, next) => {
    const { email, first_name, last_name, password, role } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        let roleId = null;
        if(role === 'admin') roleId = 1;
        if(role === 'employee') roleId = 2;

        const userId = await User.create({
            email: email,
            first_name: first_name,
            last_name: last_name,
            password: hashedPassword,
            role_id: roleId,
            is_approved: 0,
        });

        await emailService.sendApprovalEmail(userId, first_name, last_name, email, role);

        res.status(201).json({ message: 'Signup successful! Approval required.' });
    } catch (error) {
        next(error);
    }
});

// Login Route
router.post('/login', loginLimiter, async (req, res, next) => {
    const { email, password } = req.body;

    try {
        const user = await User.findByEmail(email);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.is_approved) {
            return res.status(403).json({ error: 'User not approved yet' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        const token = jwt.sign({ userId: user.id, role: user.role_id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
        });

        const role = user.role_id === 1 ? 'admin' : 'employee';

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                userId: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role_id: user.role_id,
                role: role,
                is_approved: user.is_approved
            }
        });
    } catch (error) {
        next(error);
    }
});

// Update User
router.put('/:userId', protect, async (req, res, next) => {
    const { userId } = req.params;
    const { first_name, last_name, password } = req.body;

    if (!first_name || !password) {
        return res.status(400).json({ error: 'First name and password are required' });
    }

    try {
        const user = await User.findByUserId(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.update(userId, {
            first_name,
            last_name,
            password: hashedPassword
        });

        res.status(200).json({ message: 'User updated successfully' });
    } catch (error) {
        next(error);
    }
});

// Delete User
router.delete('/:userId', protect, async (req, res, next) => {
    const { userId } = req.params;

    try {
        const user = await User.findByUserId(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (req.user.role_id === 2 && req.user.id !== parseInt(userId)) {
            return res.status(403).json({ error: 'Forbidden: You don\'t have permission' });
        }

        await User.delete(userId);

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        next(error);
    }
});

// Get All Users
router.get('/', protect, async (req, res, next) => {
    try {
        const users = await User.getAll();

        res.status(200).json({ users });
    } catch (error) {
        next(error);
    }
});

// Get User By ID
router.get('/:userId', protect, async (req, res, next) => {
    const { userId } = req.params;

    try {
        const user = await User.findByUserId(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            user: {
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role_id: user.role_id,
                role: user.role_id === 1 ? 'admin' : 'employee',
                is_approved: user.is_approved
            }
        });
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

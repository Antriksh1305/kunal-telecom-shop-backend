const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// models
const User = require('../models/user');

// middlewares
const protect = require('../middlewares/authentication');
const { loginLimiter, signupLimiter, resetLimiter } = require('../middlewares/rateLimiter');

// services
const emailService = require('../services/emailService');

const router = express.Router();

// constants for Role ids
const ROLE_ADMIN = 1;
const ROLE_EMPLOYEE = 2;

// Signup Route
router.post('/signup', signupLimiter, async (req, res, next) => {
    const { email, first_name, last_name, password, role } = req.body;

    try {
        let roleId = null;
        if (role === 'admin') roleId = ROLE_ADMIN;
        if (role === 'employee') roleId = ROLE_EMPLOYEE;

        const userId = await User.create({
            email: email,
            first_name: first_name,
            last_name: last_name,
            password: password,
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

        if (!user.is_approved) {
            return res.status(403).json({ error: 'You are not approved yet' });
        }

        if (!user.is_active) {
            return res.status(403).json({ error: 'Your account is disabled' });
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

// Forgot Password Route
router.post("/forgot-password", resetLimiter, async (req, res, next) => {
    const { email } = req.body;

    try {
        const user = await User.findByEmail(email);
        
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
            expiresIn: "10m",
        });

        console.log(token);
        await emailService.sendPasswordResetEmail(user.id, user.first_name, user.last_name, email, token);
        res.status(200).json({ message: "Password reset link sent successfully." });
    } catch (error) {
        next(error);
    }
});

// Reset Password Route
router.post("/reset-password", async (req, res, next) => {
    const { token, password } = req.body;

    // Basic password validation
    if (!password || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        // Update user password
        await User.update(userId, { password });

        res.status(200).json({ message: "Password reset successful." });
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(400).json({ error: "Reset token has expired. Please request a new link." });
        }
        return res.status(400).json({ error: "Invalid or malformed token." });
    }
});

// Update User
router.put('/', protect, async (req, res, next) => {
    try {
        const { first_name, last_name, password } = req.body;
        const userId = req.user.id;

        if (!first_name && !last_name && !password) {
            return res.status(400).json({ error: 'At least one field is required for update' });
        }

        await User.update(userId, req.body);
        res.status(200).json({ message: 'User updated successfully' });
    } catch (error) {
        next(error);
    }
});

// Delete User
router.delete('/', protect, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const user = await User.findByUserId(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
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

module.exports = router;

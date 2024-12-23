const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const emailService = require('../services/emailService');

const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
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
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Email already exists' });
        } else {
            console.log(error);
            res.status(500).json({ error: 'Server error' });
        }
    }
});

// Login 
router.post('/login', async (req, res) => {
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
            expiresIn: '1d',
        });

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role_id: user.role_id,
                is_approved: user.is_approved
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update User
router.put('/:userId', async (req, res) => {
    const { userId } = req.params;
    const { first_name, last_name, password } = req.body;

    // Basic validation
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
        console.log(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete User
router.delete('/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findByUserId(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await User.delete(userId);

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get All Users
router.get('/', async (req, res) => {
    try {
        const users = await User.getAll();

        res.status(200).json({ users });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get User By ID
router.get('/:userId', async (req, res) => {
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
                is_approved: user.is_approved
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

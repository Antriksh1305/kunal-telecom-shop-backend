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
            expiresIn: '1h',
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

// Approve User
router.get('/approve/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // find if it exists in the database or not
        const user = await User.findByUserId(userId);
        if (!user) throw new Error('User not found');

        // approve the user
        await User.approveUser(userId);
        
        const permissions = await User.getAllPermissions();
        if (user.role_id === 1) {
            // admin
            for (let permission of permissions) {
                await User.assignPermission(userId, permission.id);
            }
        } else if (user.role === 2) {
            // employee
            for (let permission of permissions) {
                if (permission.permission_name === 'manage_product' || permission.permission_name === 'manage_product_categories') {
                    await User.assignPermission(userId, permission.id);
                }
            }
        }

        const htmlResponse = `
            <html>
                <head>
                    <title>User Approval</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            text-align: center;
                            margin-top: 50px;
                        }
                        .message {
                            background-color: #4CAF50;
                            color: white;
                            padding: 20px;
                            border-radius: 10px;
                            display: inline-block;
                        }
                    </style>
                </head>
                <body>
                    <div class="message">
                        <h2>User Approved Successfully!</h2>
                        <p>The user has been successfully approved.</p>
                    </div>
                </body>
            </html>
        `;
        res.send(htmlResponse);

    } catch (error) {
        console.log(error);
        
        // Respond with a friendly error message
        const errorHtml = `
            <html>
                <head>
                    <title>Error</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            text-align: center;
                            margin-top: 50px;
                        }
                        .error {
                            background-color: #f44336;
                            color: white;
                            padding: 20px;
                            border-radius: 10px;
                            display: inline-block;
                        }
                    </style>
                </head>
                <body>
                    <div class="error">
                        <h2>Error Approving User</h2>
                        <p>Something went wrong while approving the user. Please try again later.</p>
                    </div>
                </body>
            </html>
        `;
        res.status(500).send(errorHtml);
    }
});

// Disapprove User
router.get('/disapprove/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findByUserId(userId);
        if (!user) throw new Error('User not found');

        await User.disapproveUser(userId);

        const htmlResponse = `
            <html>
                <head>
                    <title>User Disapproval</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            text-align: center;
                            margin-top: 50px;
                        }
                        .message {
                            background-color: #f44336;
                            color: white;
                            padding: 20px;
                            border-radius: 10px;
                            display: inline-block;
                        }
                    </style>
                </head>
                <body>
                    <div class="message">
                        <h2>User Disapproved Successfully!</h2>
                        <p>The user has been successfully disapproved.</p>
                    </div>
                </body>
            </html>
        `;
        res.send(htmlResponse);
    } catch (error) {
        const errorHtml = `
            <html>
                <head>
                    <title>Error</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            text-align: center;
                            margin-top: 50px;
                        }
                        .error {
                            background-color: #f44336;
                            color: white;
                            padding: 20px;
                            border-radius: 10px;
                            display: inline-block;
                        }
                    </style>
                </head>
                <body>
                    <div class="error">
                        <h2>Error Disapproving User</h2>
                        <p>Something went wrong while disapproving the user. Please try again later.</p>
                    </div>
                </body>
            </html>
        `;
        res.status(500).send(errorHtml);
    }
});

// Update User
router.put('/update/:userId', async (req, res) => {
    
});

// Get All Permissions
router.get('/permissions', async (req, res) => {
    try {
        const permissions = await User.getAllPermissions();
        res.status(200).json(permissions);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get User Permissions
router.get('/permissions/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const permissions = await User.getUserPermissions(userId);
        res.status(200).json(permissions);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

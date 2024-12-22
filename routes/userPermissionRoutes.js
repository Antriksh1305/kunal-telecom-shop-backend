const express = require('express');
const User = require('../models/user');
const UserPermission = require('../models/userPermission');

const router = express.Router();

// Approve User
router.get('/approve/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // find if it exists in the database or not
        const user = await User.findByUserId(userId);
        if (!user) throw new Error('User not found');

        // approve the user
        await UserPermission.approveUser(userId);
        
        const permissions = await UserPermission.getAllPermissions();
        if (user.role_id === 1) {
            // admin
            for (let permission of permissions) {
                await UserPermission.assignPermission(userId, permission.id);
            }
        } else if (user.role === 2) {
            // employee
            for (let permission of permissions) {
                if (permission.permission_name === 'manage_product' || permission.permission_name === 'manage_product_categories') {
                    await UserPermission.assignPermission(userId, permission.id);
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

        await UserPermission.disapproveUser(userId);

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

// Get All Permissions
router.get('/', async (req, res) => {
    try {
        const permissions = await UserPermission.getAllPermissions();
        res.status(200).json(permissions);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get User Permissions
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const permissions = await UserPermission.getUserPermissions(userId);
        res.status(200).json(permissions);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
const express = require('express');

// models
const User = require('../models/user');
const UserPermission = require('../models/userPermission');

// middlewares
const protect = require('../middlewares/authentication');
const authorize = require('../middlewares/authorization');

const router = express.Router();

// Approve User
router.get('/approve/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // Check if the user exists
        const user = await User.findByUserId(userId);
        if (!user) throw new Error('User not found');
        if (user.is_approved === 1) throw new Error('User is already approved');
        // if (user.is_approved === 0) throw new Error('User is already disapproved');

        await UserPermission.approveUser(userId);

        const permissions = await UserPermission.getAllPermissions();
        const assignPermissions = [];

        if (user.role_id === 1) {
            // Admin: Assign all permissions
            assignPermissions.push(...permissions.map(permission => permission.id));
        } else if (user.role_id === 2) {
            // Employee: Assign specific permissions
            assignPermissions.push(
                ...permissions
                    .filter(permission => 
                        permission.permission_name === 'manage_product' || 
                        permission.permission_name === 'manage_product_categories')
                    .map(permission => permission.id)
            );
        }

        // Assign permissions in bulk
        if (assignPermissions.length > 0) {
            await UserPermission.assignPermissions(userId, assignPermissions);
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
                        <p>${error}</p>
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
        if (user.is_approved === 1) throw new Error('User is already approved');
        if (user.is_approved === 0) throw new Error('User is already disapproved');

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
                        <p>${error}</p>
                    </div>
                </body>
            </html>
        `;
        res.status(500).send(errorHtml);
    }
});

// Get All Permissions
router.get('/', protect, async (req, res, next) => {
    try {
        const permissions = await UserPermission.getAllPermissions();
        res.status(200).json(permissions);
    } catch (error) {
        next(error);
    }
});

// Get User Permissions
router.get('/:userId', protect, async (req, res, next) => {
    const { userId } = req.params;

    try {
        const permissions = await UserPermission.getUserPermissions(userId);
        res.status(200).json(permissions);
    } catch (error) {
        next(error);
    }
});

// Change User Permissions
router.post('/change-permission', protect, authorize('change_permissions'), async (req, res, next) => {
    const { userId, assignPermissions, removePermissions } = req.body;

    if (!userId || (assignPermissions.length == 0 && removePermissions.length == 0)) {
        return res.status(400).json({ error: 'Missing userId or permissions data' });
    }

    try {
        if (assignPermissions && assignPermissions.length > 0) {
            await UserPermission.assignPermissions(userId, assignPermissions);
        }

        if (removePermissions && removePermissions.length > 0) {
            await UserPermission.removePermissions(userId, removePermissions);
        }

        res.status(200).json({ message: 'Permissions updated successfully' });
    } catch (error) {
        next(error);
    }
});

// Check if User Has Specific Permission
router.get('/:userId/has-permission/:permissionId', protect, async (req, res, next) => {
    const { userId, permissionId } = req.params;

    try {
        const userPermissions = await UserPermission.getUserPermissions(userId);
        const hasPermission = userPermissions.some(permission => permission.id === parseInt(permissionId));

        res.status(200).json({ hasPermission });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
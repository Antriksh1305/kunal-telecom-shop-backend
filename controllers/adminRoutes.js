const express = require('express');

// models
const User = require('../models/user');

// middleware
const protect = require('../middlewares/authentication');
const authorize = require('../middlewares/authorization');

const router = express.Router();

// Get All Admins
router.get('/', protect, async (req, res, next) => {
    try {
        const admins = await User.getAllAdmins();
        
        res.status(200).json({ admins });
    } catch (error) {
        next(error);
    }
});

// Get All Employees
router.get('/employees', protect, async (req, res, next) => {
    try {
        const employees = await User.getAllEmployees();

        res.status(200).json({ employees });
    } catch (error) {
        next(error);
    }
});

// remove employee
router.delete('/remove-employee/:userId', protect, authorize('delete_employee_account'), async (req, res, next) => {
    const { userId } = req.params;

    try {
        const user = await User.findByUserId(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await User.delete(userId);

        res.status(200).json({ message: 'Employee Removed successfully' });
    } catch (error) {
        next(error);
    }
});

// Change Account Activity
router.put('/account-activity/:userId', protect, authorize('disable_employee_account'), async (req, res, next) => {
    const { userId } = req.params;

    try {
        const user = await User.findByUserId(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await User.changeAccountActivity(userId, user.is_active);

        if (user.is_active) return res.status(200).json({ message: 'Employee account disabled successfully' });
        else return res.status(200).json({ message: 'Employee account enabled successfully' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

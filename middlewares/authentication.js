const jwt = require('jsonwebtoken');
const db = require('../config/db');

const protect = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [decoded.userId]);
        if (!rows.length) {
            return res.status(401).json({ message: 'Invalid token or user does not exist.' });
        }

        req.user = rows[0]; // Store user data in request object for further use
        next();
    } catch (error) {
        return res.status(400).json({ message: 'Invalid token.' });
    }
};

module.exports = protect;

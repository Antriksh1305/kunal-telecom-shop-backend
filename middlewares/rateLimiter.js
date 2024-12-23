const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 8,
    message: 'Too many login attempts. Please try again after 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            error: 'Too many login attempts. Please try again after 15 minutes.',
        });
    },
});

const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 4,
    message: 'Too many signup attempts. Please try again after an hour.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            error: 'Too many signup attempts. Please try again after an hour.',
        });
    },
});

module.exports = { loginLimiter, signupLimiter };
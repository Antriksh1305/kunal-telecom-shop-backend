const CustomError = require('../utils/CustomError');

const handleErrors = (err, req, res, next) => {
    console.error('❌ Error:', err);

    // Handle Custom Errors (Manually Thrown)
    if (err instanceof CustomError) {
        return res.status(err.statusCode).json({ error: err.message });
    }

    // ⚠ Handle Sequelize Unique Constraint Violation (Duplicate Entries)
    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
            error: err.errors?.map(e => e.message) || 'Duplicate entry. A unique constraint was violated.',
        });
    }

    // ⚠ Handle Sequelize Validation Errors (e.g., null values, invalid format)
    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            error: err.errors?.map(e => e.message) || 'Validation failed.',
        });
    }

    // ⚠ Handle Foreign Key Constraint Violations
    if (err.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({
            error: 'Cannot delete/update this record due to foreign key constraints.',
        });
    }

    // ⚠ Handle General Database Errors
    if (err.name === 'SequelizeDatabaseError') {
        return res.status(500).json({
            error: err.message || 'A database error occurred.',
        });
    }

    // ⚠ Handle Empty Result Errors
    if (err.name === 'SequelizeEmptyResultError') {
        return res.status(404).json({
            error: 'Requested data not found.',
        });
    }

    // ⚠ Handle Invalid JSON Requests
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            error: 'Invalid JSON format in request body.',
        });
    }

    // ⚠ Generic Catch-All Error
    return res.status(500).json({
        error: err.message || 'Internal Server Error. Please try again later.',
    });
};

module.exports = handleErrors;

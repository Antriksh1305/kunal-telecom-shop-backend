function handleSqlError(error, res) {
    console.error(error);

    switch (error.code) {
        case 'ER_PARSE_ERROR':
            return res.status(400).json({ error: 'Invalid SQL syntax. Please check the query structure.' });
        case 'ER_DUP_ENTRY':
            return res.status(409).json({ error: 'Duplicate entry. The value already exists in the database.' });
        case 'ER_BAD_NULL_ERROR':
            return res.status(400).json({ error: 'Missing required fields.' });
        case 'ER_NO_REFERENCED_ROW':
        case 'ER_NO_REFERENCED_ROW_2':
            return res.status(400).json({ error: 'Invalid reference. Ensure all referenced records exist.' });
        case 'ER_LOCK_WAIT_TIMEOUT':
            return res.status(408).json({ error: 'Database lock timeout. Please try again later.' });
        case 'ER_LOCK_DEADLOCK':
            return res.status(500).json({ error: 'Database deadlock detected. Please retry the operation.' });
        case 'ER_BAD_FIELD_ERROR':
            return res.status(400).json({ error: 'Invalid field name or table. Please check the query.' });
        default:
            return res.status(500).json({ error: 'Database error' });
    }
}

module.exports = { handleSqlError };

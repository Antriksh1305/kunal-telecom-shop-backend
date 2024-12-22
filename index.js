const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const initializeDatabase = require('./config/initDb');
const userRoutes = require('./routes/userRoutes');
const userPermissionRoutes = require('./routes/userPermissionRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Initialize Database
initializeDatabase();

// Routes
app.use('/users', userRoutes);
app.use('/user-permission', userPermissionRoutes);
app.use('/products', productRoutes);
app.use('/categories', categoryRoutes);

// Start Server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

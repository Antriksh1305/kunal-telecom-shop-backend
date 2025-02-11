const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const initializeDatabase = require('./config/initDb');
const userRoutes = require('./controllers/userRoutes');
const userPermissionRoutes = require('./controllers/userPermissionRoutes');
const adminRoutes = require('./controllers/adminRoutes');
const productRoutes = require('./controllers/productRoutes');
const productCategoryRoutes = require('./controllers/productCategoryRoutes');
const accessoryRoutes = require('./controllers/accessoryRoutes');
const accessoryCategoryRoutes = require('./controllers/accessoryCategoryRoutes');
const handleErrors = require('./middlewares/errorHandler');

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
app.use('/admin', adminRoutes);
app.use('/products', productRoutes);
app.use('/product-categories', productCategoryRoutes);
app.use('/accessories', accessoryRoutes);
app.use('/accessory-categories', accessoryCategoryRoutes);
app.use(handleErrors);

// Start Server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

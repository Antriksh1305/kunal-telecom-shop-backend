const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Load the SSL certificate
const sslCertificate = fs.readFileSync(path.resolve(__dirname, '../ca-certificate.pem'));

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    port: process.env.DB_PORT || 3306,
    ssl: {
        ca: sslCertificate,
        rejectUnauthorized: true,
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
};

const pool = mysql.createPool(dbConfig);

// Log when the pool is created
console.log('Database pool created with configuration:', {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
});

module.exports = pool;

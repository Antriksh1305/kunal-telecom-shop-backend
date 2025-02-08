const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';
const isLocal = process.env.LOCAL_ENV === 'true';

// for deployment
let certificatePath = '/etc/secrets/CA_CERT';

if (isLocal) {
    if (isProduction) {
        certificatePath = path.resolve(__dirname, '../ca-certificate.pem');
    } else {
        certificatePath = path.resolve(__dirname, '../ca-certificate-dev.pem');
    }
}

const sslCertificate = fs.readFileSync(certificatePath);

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
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
    user: dbConfig.user,
    port: dbConfig.port,
    sslCertificatePath: certificatePath,
});

module.exports = pool;

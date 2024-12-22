const db = require('./db');

async function initializeDatabase() {
  try {
    const connection = await db.getConnection();

    // Create database if it does not exist
    await connection.query('CREATE DATABASE IF NOT EXISTS shop;');

    // Use the newly created or existing database
    await connection.query('USE shop;');
    
    // Create `categories` table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL);
    `);

    // Create `products` table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      hinglish_name VARCHAR(255),
      category_id INT NOT NULL,
      market_price DECIMAL(10, 2),
      dealer_price DECIMAL(10, 2),
      image TEXT,
      available INT DEFAULT 0,
      color VARCHAR(50) NOT NULL,
      variant VARCHAR(100) NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE);
    `);
    
    // Create `roles` table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS roles (
          id INT AUTO_INCREMENT PRIMARY KEY,
          role_name VARCHAR(50) NOT NULL UNIQUE
      );
    `);

    // Insert default roles
    await connection.query(`
      INSERT IGNORE INTO roles (id, role_name) VALUES
      (1, 'admin'),
      (2, 'employee');
    `);

    // Create `user` table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          first_name VARCHAR(255) NOT NULL,
          last_name VARCHAR(255),
          password VARCHAR(255) NOT NULL,
          role_id INT NOT NULL,
          is_approved BOOLEAN DEFAULT 0,
          FOREIGN KEY (role_id) REFERENCES roles(id)
      );
    `);

    // Create `permissions` table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS permissions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          permission_name VARCHAR(255) NOT NULL UNIQUE
      );
    `);

    // Insert default permissions
    await connection.query(`
      INSERT IGNORE INTO permissions (id, permission_name) VALUES
      (1, 'manage_product'),
      (2, 'manage_product_categories'),
      (3, 'disable_employee_account'),
      (4, 'delete_employee_account');
    `);

    // Create `user_permissions` table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_permissions (
          user_id INT,
          permission_id INT,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (permission_id) REFERENCES permissions(id),
          PRIMARY KEY (user_id, permission_id)
      );
    `);

    console.log('Database initialized successfully!');
    connection.release();
  } catch (error) {
    console.error('Error initializing database:', error.message);
  }
}

module.exports = initializeDatabase;

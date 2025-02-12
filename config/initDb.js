const db = require('./db');

async function initializeDatabase() {
  try {
    const connection = await db.getConnection();

    // Create database if it does not exist
    await connection.query('CREATE DATABASE IF NOT EXISTS shop;');
    await connection.query('USE shop;');

    // ----------------------------
    // Category and Product Tables
    // ----------------------------

    // Create product_categories table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL
      );
    `);

    // Create accessory_categories table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS accessory_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL
      );
    `);

    // Create products table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        hinglish_name VARCHAR(255),
        category_id INT NOT NULL,
        market_price DECIMAL(10, 2) DEFAULT 0,
        dealer_price DECIMAL(10, 2) DEFAULT 0,
        imageURL TEXT,
        imageId VARCHAR(255),
        available INT DEFAULT 0,
        color VARCHAR(50) NOT NULL,
        variant VARCHAR(100) NOT NULL,
        FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE CASCADE,
        UNIQUE (name, color, variant)
      );
    `);

    // Create accessories table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS accessories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        hinglish_name VARCHAR(255),
        category_id INT NOT NULL,
        market_price DECIMAL(10, 2) DEFAULT 0,
        dealer_price DECIMAL(10, 2) DEFAULT 0,
        imageURL TEXT,
        imageId VARCHAR(255),
        available INT DEFAULT 0,
        color VARCHAR(50) NOT NULL,
        FOREIGN KEY (category_id) REFERENCES accessory_categories(id) ON DELETE CASCADE,
        UNIQUE (name, color)
      );
    `);

    // ----------------------------
    // User, Roles, and Permissions
    // ----------------------------

    // Create roles table
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

    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255),
        password VARCHAR(255) NOT NULL,
        role_id INT NOT NULL,
        is_approved BOOLEAN DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY (role_id) REFERENCES roles(id)
      );
    `);

    // Create permissions table
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
      (4, 'delete_employee_account'),
      (5, 'change_permissions'),
      (6, 'manage_buyer_transactions'),
      (7, 'manage_udhar');
    `);

    // Create user_permissions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_permissions (
        user_id INT,
        permission_id INT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id),
        PRIMARY KEY (user_id, permission_id)
      );
    `);

    // ----------------------------
    // Buyers and Transactions
    // ----------------------------

    // Create buyers table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS buyers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) UNIQUE,
        address TEXT,
        outstanding_udhar DECIMAL(10,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT 1  -- Soft delete flag (1 = active, 0 = deleted)
      );
    `);

    // Create buyer_transactions table with user (employee) tracking and payment method
    await connection.query(`
      CREATE TABLE IF NOT EXISTS buyer_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        buyer_id INT DEFAULT NULL,
        user_id INT NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        paid_amount DECIMAL(10,2) DEFAULT 0,
        payment_method VARCHAR(50) NOT NULL,
        is_udhar_payment BOOLEAN DEFAULT 0,
        transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (buyer_id) REFERENCES buyers(id) ON DELETE SET NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Create transaction_products table with product name and price retention
    await connection.query(`
      CREATE TABLE IF NOT EXISTS transaction_products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        transaction_id INT NOT NULL,
        product_id INT DEFAULT NULL,  -- NULL if product is deleted
        quantity INT NOT NULL DEFAULT 1,
        product_name VARCHAR(255),  -- Stores product name at the time of transaction
        product_price DECIMAL(10,2),  -- Stores product price at the time of transaction
        FOREIGN KEY (transaction_id) REFERENCES buyer_transactions(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL  -- Prevents sales record loss
      );
    `);

    // Create transaction_accessories table with accessory name and price retention
    await connection.query(`
      CREATE TABLE IF NOT EXISTS transaction_accessories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        transaction_id INT NOT NULL,
        accessory_id INT DEFAULT NULL,  -- NULL if accessory is deleted
        quantity INT NOT NULL DEFAULT 1,
        accessory_name VARCHAR(255),  -- Stores accessory name at the time of transaction
        accessory_price DECIMAL(10,2),  -- Stores accessory price at the time of transaction
        FOREIGN KEY (transaction_id) REFERENCES buyer_transactions(id) ON DELETE CASCADE,
        FOREIGN KEY (accessory_id) REFERENCES accessories(id) ON DELETE SET NULL  -- Prevents sales record loss
      );
    `);

    // ----------------------------
    // Triggers
    // ----------------------------
    await createTriggers(connection);
  } catch (error) {
    console.error('Error initializing Critical Queries:', error.message);
  }
}

async function createTriggers(connection) {
  try {
    // ----------------------------
    // DROP ALL TRIGGERS FIRST (IN PARALLEL)
    // ----------------------------
    console.log('Dropping existing triggers...');
    await Promise.all([
      connection.query(`DROP TRIGGER IF EXISTS check_product_stock;`),
      connection.query(`DROP TRIGGER IF EXISTS check_accessory_stock;`),
      connection.query(`DROP TRIGGER IF EXISTS decrease_product_stock;`),
      connection.query(`DROP TRIGGER IF EXISTS decrease_accessory_stock;`),
      connection.query(`DROP TRIGGER IF EXISTS restore_stock_before_transaction_delete;`),
      connection.query(`DROP TRIGGER IF EXISTS update_udhar_on_transaction;`),
      connection.query(`DROP TRIGGER IF EXISTS update_udhar_on_transaction_delete;`)
    ]);

    // ----------------------------
    // CREATE ALL TRIGGERS IN PARALLEL
    // ----------------------------
    await Promise.all([
      // Check if product stock is available before inserting transaction_products
      connection.query(`
        CREATE TRIGGER check_product_stock
        BEFORE INSERT ON transaction_products
        FOR EACH ROW
        BEGIN
          DECLARE currentAvailable INT;
          SELECT available INTO currentAvailable FROM products WHERE id = NEW.product_id;
          IF NEW.product_id IS NOT NULL AND currentAvailable < NEW.quantity THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient product inventory for sale';
          END IF;
        END;
      `),

      // Check if accessory stock is available before inserting transaction_accessories
      connection.query(`
        CREATE TRIGGER check_accessory_stock
        BEFORE INSERT ON transaction_accessories
        FOR EACH ROW
        BEGIN
          DECLARE currentAvailable INT;
          SELECT available INTO currentAvailable FROM accessories WHERE id = NEW.accessory_id;
          IF NEW.accessory_id IS NOT NULL AND currentAvailable < NEW.quantity THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient accessory inventory for sale';
          END IF;
        END;
      `),

      // Decrease product stock after inserting transaction_products
      connection.query(`
        CREATE TRIGGER decrease_product_stock
        AFTER INSERT ON transaction_products
        FOR EACH ROW
        BEGIN
          UPDATE products 
          SET available = available - NEW.quantity 
          WHERE id = NEW.product_id AND NEW.product_id IS NOT NULL;
        END;
      `),

      // Decrease accessory stock after inserting transaction_accessories
      connection.query(`
        CREATE TRIGGER decrease_accessory_stock
        AFTER INSERT ON transaction_accessories
        FOR EACH ROW
        BEGIN
          UPDATE accessories 
          SET available = available - NEW.quantity 
          WHERE id = NEW.accessory_id AND NEW.accessory_id IS NOT NULL;
        END;
      `),

      // Restore product stock before deleting a transaction
      connection.query(`
        CREATE TRIGGER restore_stock_before_transaction_delete
        BEFORE DELETE ON buyer_transactions
        FOR EACH ROW
        BEGIN
            -- Restore stock for products
            UPDATE products p
            JOIN transaction_products tp ON p.id = tp.product_id
            SET p.available = p.available + tp.quantity
            WHERE tp.transaction_id = OLD.id;

            -- Restore stock for accessories
            UPDATE accessories a
            JOIN transaction_accessories ta ON a.id = ta.accessory_id
            SET a.available = a.available + ta.quantity
            WHERE ta.transaction_id = OLD.id;
        END;
      `),

      // Update outstanding udhar when a transaction is created
      connection.query(`
        CREATE TRIGGER update_udhar_on_transaction
        AFTER INSERT ON buyer_transactions
        FOR EACH ROW
        BEGIN
          IF NEW.buyer_id IS NOT NULL THEN
            UPDATE buyers 
            SET outstanding_udhar = outstanding_udhar + (NEW.total_amount - NEW.paid_amount)
            WHERE id = NEW.buyer_id;
          END IF;
        END;
      `),

      connection.query(`
        CREATE TRIGGER update_udhar_on_transaction_delete
        AFTER DELETE ON buyer_transactions
        FOR EACH ROW
        BEGIN
          IF OLD.buyer_id IS NOT NULL THEN
            UPDATE buyers 
            SET outstanding_udhar = outstanding_udhar - (OLD.total_amount - OLD.paid_amount)
            WHERE id = OLD.buyer_id;
          END IF;
        END;
      `)
    ]);

    console.log('Database initialized successfully!');
    connection.release();
  } catch (error) {
    console.error('Error Creating Triggers: ', error.message);
  }
}

module.exports = initializeDatabase;

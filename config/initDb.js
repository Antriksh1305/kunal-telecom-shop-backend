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
        phone VARCHAR(20) UNIQUE NOT NULL,
        address TEXT,
        outstanding_udhar DECIMAL(10,2) DEFAULT 0,
        is_deleted BOOLEAN DEFAULT 0  -- Soft delete field
      );
    `);
    
    // Create buyer_transactions table with user (employee) tracking and payment method
    await connection.query(`
      CREATE TABLE IF NOT EXISTS buyer_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        buyer_id INT NOT NULL,
        user_id INT NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        paid_amount DECIMAL(10,2) DEFAULT 0,
        payment_method VARCHAR(50) NOT NULL,
        is_udhar BOOLEAN DEFAULT 0,
        transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (buyer_id) REFERENCES buyers(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);
    
    // Create transaction_items table with product name and price retention
    await connection.query(`
      CREATE TABLE IF NOT EXISTS transaction_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        transaction_id INT NOT NULL,
        product_id INT DEFAULT NULL,  -- Allow NULL for products that are deleted
        quantity INT NOT NULL DEFAULT 1,
        price_per_unit DECIMAL(10,2) NOT NULL,
        product_name VARCHAR(255),  -- Store the product name at the time of transaction
        product_price DECIMAL(10,2),  -- Store the product price at the time of transaction
        FOREIGN KEY (transaction_id) REFERENCES buyer_transactions(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL  -- If product is deleted, set product_id to NULL
      );
    `);
    
    // Create transaction_accessories table with accessory name and price retention
    await connection.query(`
      CREATE TABLE IF NOT EXISTS transaction_accessories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        transaction_id INT NOT NULL,
        accessory_id INT DEFAULT NULL,  -- Allow NULL for accessories that are deleted
        quantity INT NOT NULL DEFAULT 1,
        price_per_unit DECIMAL(10,2) NOT NULL,
        accessory_name VARCHAR(255),  -- Store the accessory name at the time of transaction
        accessory_price DECIMAL(10,2),  -- Store the accessory price at the time of transaction
        FOREIGN KEY (transaction_id) REFERENCES buyer_transactions(id) ON DELETE CASCADE,
        FOREIGN KEY (accessory_id) REFERENCES accessories(id) ON DELETE SET NULL  -- If accessory is deleted, set accessory_id to NULL
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
      connection.query(`DROP TRIGGER IF EXISTS restore_product_stock_after_delete;`),
      connection.query(`DROP TRIGGER IF EXISTS restore_accessory_stock_after_delete;`),
      connection.query(`DROP TRIGGER IF EXISTS update_product_stock_after_update;`),
      connection.query(`DROP TRIGGER IF EXISTS update_accessory_stock_after_update;`),
      connection.query(`DROP TRIGGER IF EXISTS update_udhar_on_transaction;`),
      connection.query(`DROP TRIGGER IF EXISTS update_udhar_on_payment;`),
    ]);

    // ----------------------------
    // CREATE ALL TRIGGERS IN PARALLEL
    // ----------------------------
    await Promise.all([
      connection.query(`
        CREATE TRIGGER check_product_stock
        BEFORE INSERT ON transaction_items
        FOR EACH ROW
        BEGIN
          DECLARE currentAvailable INT;
          SELECT available INTO currentAvailable FROM products WHERE id = NEW.product_id;
          IF currentAvailable < NEW.quantity THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient product inventory for sale';
          END IF;
        END;
      `),
      connection.query(`
        CREATE TRIGGER check_accessory_stock
        BEFORE INSERT ON transaction_accessories
        FOR EACH ROW
        BEGIN
          DECLARE currentAvailable INT;
          SELECT available INTO currentAvailable FROM accessories WHERE id = NEW.accessory_id;
          IF currentAvailable < NEW.quantity THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient accessory inventory for sale';
          END IF;
        END;
      `),
      connection.query(`
        CREATE TRIGGER decrease_product_stock
        AFTER INSERT ON transaction_items
        FOR EACH ROW
        BEGIN
          UPDATE products SET available = available - NEW.quantity WHERE id = NEW.product_id;
        END;
      `),
      connection.query(`
        CREATE TRIGGER decrease_accessory_stock
        AFTER INSERT ON transaction_accessories
        FOR EACH ROW
        BEGIN
          UPDATE accessories SET available = available - NEW.quantity WHERE id = NEW.accessory_id;
        END;
      `),
      connection.query(`
        CREATE TRIGGER restore_product_stock_after_delete
        AFTER DELETE ON transaction_items
        FOR EACH ROW
        BEGIN
          UPDATE products SET available = available + OLD.quantity WHERE id = OLD.product_id;
        END;
      `),
      connection.query(`
        CREATE TRIGGER restore_accessory_stock_after_delete
        AFTER DELETE ON transaction_accessories
        FOR EACH ROW
        BEGIN
          UPDATE accessories SET available = available + OLD.quantity WHERE id = OLD.accessory_id;
        END;
      `),
      connection.query(`
        CREATE TRIGGER update_product_stock_after_update
        AFTER UPDATE ON transaction_items
        FOR EACH ROW
        BEGIN
          UPDATE products SET available = available + OLD.quantity - NEW.quantity WHERE id = NEW.product_id;
        END;
      `),
      connection.query(`
        CREATE TRIGGER update_accessory_stock_after_update
        AFTER UPDATE ON transaction_accessories
        FOR EACH ROW
        BEGIN
          UPDATE accessories SET available = available + OLD.quantity - NEW.quantity WHERE id = NEW.accessory_id;
        END;
      `),
      connection.query(`
        CREATE TRIGGER update_udhar_on_transaction
        AFTER INSERT ON buyer_transactions
        FOR EACH ROW
        BEGIN
          DECLARE balance_difference DECIMAL(10,2);

          IF NEW.is_udhar THEN
            SET balance_difference = NEW.paid_amount - NEW.total_amount;
            UPDATE buyers 
            SET outstanding_udhar = outstanding_udhar + balance_difference 
            WHERE id = NEW.buyer_id;

            IF (SELECT outstanding_udhar FROM buyers WHERE id = NEW.buyer_id) = 0 THEN
              UPDATE buyers 
              SET is_udhar = FALSE
              WHERE id = NEW.buyer_id;
            END IF;
          END IF;
        END;
      `),
      connection.query(`
        CREATE TRIGGER update_udhar_on_payment
        AFTER UPDATE ON buyer_transactions
        FOR EACH ROW
        BEGIN
          DECLARE balance_difference DECIMAL(10,2);

          IF NEW.paid_amount <> OLD.paid_amount THEN
            SET balance_difference = NEW.paid_amount - OLD.paid_amount;
            UPDATE buyers 
            SET outstanding_udhar = outstanding_udhar + balance_difference 
            WHERE id = NEW.buyer_id;

            IF (SELECT outstanding_udhar FROM buyers WHERE id = NEW.buyer_id) = 0 THEN
              UPDATE buyers 
              SET is_udhar = FALSE
              WHERE id = NEW.buyer_id;
            END IF;
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

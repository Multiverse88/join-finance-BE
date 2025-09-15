const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database path
const DB_PATH = process.env.DB_PATH || './database/join_finance.db';

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Database connection
let db;

const getDB = () => {
  if (!db) {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
      }
      console.log('📗 Connected to SQLite database');
    });
  }
  return db;
};

// Initialize database with tables
const initializeDatabase = () => {
  const database = getDB();
  
  // Enable foreign keys
  database.run('PRAGMA foreign_keys = ON');
  
  // Create users table
  database.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(100),
      role VARCHAR(20) DEFAULT 'user',
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating users table:', err.message);
    } else {
      console.log('✅ Users table ready');
    }
  });
  
  // Create disbursements table
  database.run(`
    CREATE TABLE IF NOT EXISTS disbursements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_name VARCHAR(255) NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      file_size INTEGER NOT NULL,
      uploaded_by INTEGER NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      total_records INTEGER DEFAULT 0,
      processed_records INTEGER DEFAULT 0,
      error_records INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (uploaded_by) REFERENCES users (id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating disbursements table:', err.message);
    } else {
      console.log('✅ Disbursements table ready');
    }
  });
  
  // Create disbursement_records table (untuk data dari excel)
  database.run(`
    CREATE TABLE IF NOT EXISTS disbursement_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      disbursement_id INTEGER NOT NULL,
      account_number VARCHAR(50),
      account_name VARCHAR(100),
      amount DECIMAL(15,2),
      bank_code VARCHAR(10),
      bank_name VARCHAR(50),
      reference_number VARCHAR(100),
      description TEXT,
      status VARCHAR(20) DEFAULT 'pending',
      error_message TEXT,
      processed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (disbursement_id) REFERENCES disbursements (id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating disbursement_records table:', err.message);
    } else {
      console.log('✅ Disbursement records table ready');
    }
  });
  
  // Insert default admin user if not exists
  const bcrypt = require('bcryptjs');
  const defaultPassword = 'admin123';
  
  database.get('SELECT id FROM users WHERE username = ?', ['admin'], (err, row) => {
    if (err) {
      console.error('Error checking admin user:', err.message);
      return;
    }
    
    if (!row) {
      bcrypt.hash(defaultPassword, 10, (err, hash) => {
        if (err) {
          console.error('Error hashing password:', err.message);
          return;
        }
        
        database.run(
          'INSERT INTO users (username, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)',
          ['admin', 'admin@joinfinance.com', hash, 'Administrator', 'admin'],
          (err) => {
            if (err) {
              console.error('Error creating admin user:', err.message);
            } else {
              console.log('👤 Default admin user created (username: admin, password: admin123)');
            }
          }
        );
      });
    }
  });
};

// Close database connection
const closeDB = () => {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed');
      }
    });
  }
};

module.exports = {
  getDB,
  initializeDatabase,
  closeDB
};
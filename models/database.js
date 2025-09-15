const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, '..', 'database', 'join_finance.db');

// Initialize database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeTables();
  }
});

function initializeTables() {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      full_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating users table:', err);
    else console.log('✅ Users table ready');
  });

  // Check if disbursements table exists and validate schema
  db.all("PRAGMA table_info(disbursements)", (err, columns) => {
    if (err) {
      console.error('Error checking disbursements table:', err);
      return;
    }

    if (!columns || columns.length === 0) {
      // Table doesn't exist, create new one
      db.run(`
        CREATE TABLE disbursements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          batch_number TEXT UNIQUE NOT NULL,
          filename TEXT NOT NULL,
          total_records INTEGER DEFAULT 0,
          status TEXT DEFAULT 'processing',
          uploaded_by INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (uploaded_by) REFERENCES users (id)
        )
      `, (err) => {
        if (err) console.error('Error creating disbursements table:', err);
        else console.log('✅ Disbursements table created');
      });
    } else {
      // Table exists, check for required columns
      const columnNames = columns.map(col => col.name);
      const requiredColumns = ['batch_number', 'filename', 'total_records', 'status', 'uploaded_by'];
      const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
      
      if (missingColumns.length > 0) {
        console.log('🔧 Updating disbursements table schema...');
        
        // Instead of altering, let's recreate the table with proper schema
        db.run(`
          CREATE TABLE disbursements_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            batch_number TEXT UNIQUE NOT NULL,
            filename TEXT NOT NULL,
            total_records INTEGER DEFAULT 0,
            status TEXT DEFAULT 'processing',
            uploaded_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (uploaded_by) REFERENCES users (id)
          )
        `, (err) => {
          if (err) {
            console.error('Error creating new disbursements table:', err);
          } else {
            // Copy existing data if any
            db.run(`
              INSERT INTO disbursements_new (id, filename, total_records, status, uploaded_by, created_at, updated_at, batch_number)
              SELECT 
                id, 
                COALESCE(filename, 'migrated_file.xlsx') as filename,
                COALESCE(total_records, 0) as total_records,
                COALESCE(status, 'processed') as status,
                COALESCE(uploaded_by, 1) as uploaded_by,
                COALESCE(created_at, datetime('now')) as created_at,
                COALESCE(updated_at, datetime('now')) as updated_at,
                COALESCE(batch_number, 'BATCH-' || date('now') || '-' || substr(hex(randomblob(4)), 1, 8)) as batch_number
              FROM disbursements
            `, (err) => {
              if (err) {
                console.log('No existing data to migrate (this is normal for first run)');
              }
              
              // Drop old table and rename new one
              db.run(`DROP TABLE IF EXISTS disbursements`, (err) => {
                if (err) console.error('Error dropping old table:', err);
                
                db.run(`ALTER TABLE disbursements_new RENAME TO disbursements`, (err) => {
                  if (err) console.error('Error renaming table:', err);
                  else console.log('✅ Disbursements table updated with complete schema');
                });
              });
            });
          }
        });
      } else {
        console.log('✅ Disbursements table ready');
      }
    }
  });

  // Check disbursement_records table and update schema if needed
  db.all("PRAGMA table_info(disbursement_records)", (err, columns) => {
    if (err) {
      console.error('Error checking disbursement_records table:', err);
      return;
    }

    const hasNewColumns = columns && columns.some(col => col.name === 'nama');
    
    if (!columns || columns.length === 0) {
      // Table doesn't exist, create new one with new schema
      db.run(`
        CREATE TABLE disbursement_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          disbursement_id INTEGER NOT NULL,
          batch_number TEXT NOT NULL,
          nama TEXT NOT NULL,
          ktp TEXT NOT NULL,
          jenis_kelamin TEXT NOT NULL,
          penghasilan DECIMAL(15,2),
          plafond DECIMAL(15,2),
          cif TEXT,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (disbursement_id) REFERENCES disbursements (id)
        )
      `, (err) => {
        if (err) console.error('Error creating disbursement_records table:', err);
        else console.log('✅ Disbursement records table created');
      });
    } else if (!hasNewColumns) {
      // Table exists with old schema, recreate it
      db.run(`DROP TABLE IF EXISTS disbursement_records`, (err) => {
        if (err) {
          console.error('Error dropping old disbursement_records table:', err);
        } else {
          db.run(`
            CREATE TABLE disbursement_records (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              disbursement_id INTEGER NOT NULL,
              batch_number TEXT NOT NULL,
              nama TEXT NOT NULL,
              ktp TEXT NOT NULL,
              jenis_kelamin TEXT NOT NULL,
              penghasilan DECIMAL(15,2),
              plafond DECIMAL(15,2),
              cif TEXT,
              status TEXT DEFAULT 'pending',
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (disbursement_id) REFERENCES disbursements (id)
            )
          `, (err) => {
            if (err) console.error('Error recreating disbursement_records table:', err);
            else console.log('✅ Disbursement records table recreated with new schema');
          });
        }
      });
    } else {
      console.log('✅ Disbursement records table ready');
    }
  });

  // Create default admin user if not exists
  db.get("SELECT id FROM users WHERE username = 'admin'", (err, row) => {
    if (err) {
      console.error('Error checking for admin user:', err);
      return;
    }
    
    if (!row) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      
      db.run(
        "INSERT INTO users (username, password, email, full_name) VALUES (?, ?, ?, ?)",
        ['admin', hashedPassword, 'admin@joinfinance.com', 'Administrator'],
        function(err) {
          if (err) {
            console.error('Error creating admin user:', err);
          } else {
            console.log('Default admin user created successfully');
          }
        }
      );
    }
  });
}

// Helper function to generate batch number
function generateBatchNumber() {
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const uniqueId = uuidv4().slice(0, 8).toUpperCase();
  return `BATCH-${timestamp}-${uniqueId}`;
}

// Database operations
const dbOperations = {
  // User operations
  getUserByUsername: (username) => {
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  getUserById: (id) => {
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM users WHERE id = ?", [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Disbursement operations
  createDisbursement: (filename, totalRecords, uploadedBy) => {
    return new Promise((resolve, reject) => {
      const batchNumber = generateBatchNumber();
      
      db.run(
        "INSERT INTO disbursements (batch_number, filename, total_records, uploaded_by) VALUES (?, ?, ?, ?)",
        [batchNumber, filename, totalRecords, uploadedBy],
        function(err) {
          if (err) reject(err);
          else resolve({ 
            id: this.lastID, 
            batch_number: batchNumber,
            filename,
            total_records: totalRecords,
            status: 'processing'
          });
        }
      );
    });
  },

  createDisbursementRecord: (disbursementId, batchNumber, record) => {
    return new Promise((resolve, reject) => {
      const { nama, ktp, jenis_kelamin, penghasilan, plafond, cif } = record;
      
      db.run(
        `INSERT INTO disbursement_records 
         (disbursement_id, batch_number, nama, ktp, jenis_kelamin, penghasilan, plafond, cif) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [disbursementId, batchNumber, nama, ktp, jenis_kelamin, penghasilan, plafond, cif],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...record });
        }
      );
    });
  },

  getDisbursements: (userId) => {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM disbursements WHERE uploaded_by = ? ORDER BY created_at DESC",
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  },

  getDisbursementByBatch: (batchNumber) => {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM disbursements WHERE batch_number = ?",
        [batchNumber],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  },

  getDisbursementRecords: (batchNumber) => {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM disbursement_records WHERE batch_number = ? ORDER BY created_at ASC",
        [batchNumber],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  },

  updateDisbursementStatus: (id, status) => {
    return new Promise((resolve, reject) => {
      db.run(
        "UPDATE disbursements SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [status, id],
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  }
};

module.exports = {
  db,
  dbOperations,
  generateBatchNumber
};
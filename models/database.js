const { getDB } = require("../config/database");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

// Generate UUID v4 using crypto module
function generateUUID() {
  return crypto.randomUUID();
}

async function initializeTables() {
  const db = getDB();

  try {
    // Create basic users table for authentication
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        full_name VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Users table ready");

    // Create separate profile table for detailed BJB employee data
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        nrp VARCHAR(50),
        nama VARCHAR(255),
        nip VARCHAR(50),
        kode_cabang VARCHAR(50),
        nama_cabang VARCHAR(255),
        kode_induk VARCHAR(50),
        nama_induk VARCHAR(255),
        kode_kanwil VARCHAR(50),
        nama_kanwil VARCHAR(255),
        jabatan VARCHAR(255),
        id_fungsi VARCHAR(50),
        nama_fungsi VARCHAR(255),
        kode_penempatan VARCHAR(50),
        nama_penempatan VARCHAR(255),
        cost_centre VARCHAR(50),
        is_approval BOOLEAN DEFAULT FALSE,
        kode_unit_kerja VARCHAR(50),
        nama_unit_kerja VARCHAR(255),
        kode_jabatan VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ User profiles table ready");

    await db.query(`
      CREATE TABLE IF NOT EXISTS disbursements (
        id SERIAL PRIMARY KEY,
        batch_number VARCHAR(255) UNIQUE NOT NULL,
        filename VARCHAR(255) NOT NULL,
        total_records INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'processing',
        uploaded_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Disbursements table ready");

    await db.query(`
      CREATE TABLE IF NOT EXISTS disbursement_records (
        id SERIAL PRIMARY KEY,
        disbursement_id INTEGER NOT NULL REFERENCES disbursements(id),
        batch_number VARCHAR(255) NOT NULL,
        nama VARCHAR(255) NOT NULL,
        ktp VARCHAR(255) NOT NULL,
        jenis_kelamin VARCHAR(50) NOT NULL,
        penghasilan DECIMAL(15,2),
        plafond DECIMAL(15,2),
        cif VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Disbursement records table ready");

    const adminCheck = await db.query(
      "SELECT id FROM users WHERE username = $1",
      ["admin"]
    );

    if (adminCheck.rows.length === 0) {
      const hashedPassword = bcrypt.hashSync("admin123", 10);

      await db.query(
        "INSERT INTO users (username, password, email, full_name) VALUES ($1, $2, $3, $4)",
        ["admin", hashedPassword, "admin@joinfinance.com", "Administrator"]
      );
      console.log("✅ Default admin user created");
    }

    // Create ADMINDGB user
    const adminDgbCheck = await db.query(
      "SELECT id FROM users WHERE username = $1",
      ["ADMINDGB"]
    );

    if (adminDgbCheck.rows.length === 0) {
      const hashedPassword = bcrypt.hashSync("bebas123", 10);

      // Insert basic user data
      const userResult = await db.query(
        `INSERT INTO users (username, password, email, full_name, is_active)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [
          "ADMINDGB",
          hashedPassword,
          "test@BANKBJB.CO.ID",
          "AMMAR RAMADHAN",
          true,
        ]
      );

      const userId = userResult.rows[0].id;

      // Insert detailed profile data
      await db.query(
        `INSERT INTO user_profiles (
          user_id, nrp, nama, nip, kode_cabang, nama_cabang, kode_induk, nama_induk,
          kode_kanwil, nama_kanwil, jabatan, id_fungsi, nama_fungsi, kode_penempatan,
          nama_penempatan, cost_centre, is_approval, kode_unit_kerja, nama_unit_kerja, kode_jabatan
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
        [
          userId,
          "84177",
          "AMMAR RAMADHAN",
          "24.00.0125",
          "0000",
          "DIVISI INFORMATION TECHNOLOGY",
          "D440",
          "DIVISI INFORMATION TECHNOLOGY",
          "0000",
          "Kantor Pusat",
          "Staf Development Team Digital Business",
          "4861",
          "Admin IT",
          "D440",
          "DIVISI INFORMATION TECHNOLOGY",
          "01300",
          false,
          "D440",
          "DIVISI INFORMATION TECHNOLOGY",
          "J2337",
        ]
      );

      console.log(
        "✅ ADMINDGB user and profile created with password: bebas123"
      );
    } else {
      // Check if profile exists, create if missing
      const userId = adminDgbCheck.rows[0].id;
      const profileCheck = await db.query(
        "SELECT id FROM user_profiles WHERE user_id = $1",
        [userId]
      );

      if (profileCheck.rows.length === 0) {
        await db.query(
          `INSERT INTO user_profiles (
            user_id, nrp, nama, nip, kode_cabang, nama_cabang, kode_induk, nama_induk,
            kode_kanwil, nama_kanwil, jabatan, id_fungsi, nama_fungsi, kode_penempatan,
            nama_penempatan, cost_centre, is_approval, kode_unit_kerja, nama_unit_kerja, kode_jabatan
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
          [
            userId,
            "84177",
            "AMMAR RAMADHAN",
            "24.00.0125",
            "0000",
            "DIVISI INFORMATION TECHNOLOGY",
            "D440",
            "DIVISI INFORMATION TECHNOLOGY",
            "0000",
            "Kantor Pusat",
            "Staf Development Team Digital Business",
            "4861",
            "Admin IT",
            "D440",
            "DIVISI INFORMATION TECHNOLOGY",
            "01300",
            false,
            "D440",
            "DIVISI INFORMATION TECHNOLOGY",
            "J2337",
          ]
        );
        console.log("✅ ADMINDGB profile created for existing user");
      }
    }
  } catch (error) {
    console.error("❌ Error initializing database tables:", error);
  }
}

function generateBatchNumber() {
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const uniqueId = generateUUID().slice(0, 8).toUpperCase();
  return `BATCH-${timestamp}-${uniqueId}`;
}

const dbOperations = {
  getUserByUsername: async (username) => {
    const db = getDB();
    try {
      const result = await db.query("SELECT * FROM users WHERE username = $1", [
        username,
      ]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  },

  getUserById: async (id) => {
    const db = getDB();
    try {
      const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  },

  // Get user with profile data (JOIN operation)
  getUserWithProfile: async (username) => {
    const db = getDB();
    try {
      const result = await db.query(
        `
        SELECT 
          u.id, u.username, u.password, u.email, u.full_name, u.is_active,
          u.created_at, u.updated_at,
          p.nrp, p.nama, p.nip, p.kode_cabang, p.nama_cabang, p.kode_induk, p.nama_induk,
          p.kode_kanwil, p.nama_kanwil, p.jabatan, p.id_fungsi, p.nama_fungsi,
          p.kode_penempatan, p.nama_penempatan, p.cost_centre, p.is_approval,
          p.kode_unit_kerja, p.nama_unit_kerja, p.kode_jabatan
        FROM users u
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE u.username = $1 AND u.is_active = true
      `,
        [username]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  },

  getUserWithProfileById: async (id) => {
    const db = getDB();
    try {
      const result = await db.query(
        `
        SELECT 
          u.id, u.username, u.password, u.email, u.full_name, u.is_active,
          u.created_at, u.updated_at,
          p.nrp, p.nama, p.nip, p.kode_cabang, p.nama_cabang, p.kode_induk, p.nama_induk,
          p.kode_kanwil, p.nama_kanwil, p.jabatan, p.id_fungsi, p.nama_fungsi,
          p.kode_penempatan, p.nama_penempatan, p.cost_centre, p.is_approval,
          p.kode_unit_kerja, p.nama_unit_kerja, p.kode_jabatan
        FROM users u
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE u.id = $1 AND u.is_active = true
      `,
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  },

  createDisbursement: async (filename, totalRecords, uploadedBy) => {
    const db = getDB();
    const batchNumber = generateBatchNumber();

    try {
      const result = await db.query(
        "INSERT INTO disbursements (batch_number, filename, total_records, uploaded_by) VALUES ($1, $2, $3, $4) RETURNING *",
        [batchNumber, filename, totalRecords, uploadedBy]
      );

      return {
        id: result.rows[0].id,
        batch_number: batchNumber,
        filename,
        total_records: totalRecords,
        status: "processing",
      };
    } catch (error) {
      throw error;
    }
  },

  createDisbursementRecord: async (disbursementId, batchNumber, record) => {
    const db = getDB();
    const { nama, ktp, jenis_kelamin, penghasilan, plafond, cif } = record;

    try {
      const result = await db.query(
        `INSERT INTO disbursement_records 
         (disbursement_id, batch_number, nama, ktp, jenis_kelamin, penghasilan, plafond, cif) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          disbursementId,
          batchNumber,
          nama,
          ktp,
          jenis_kelamin,
          penghasilan,
          plafond,
          cif,
        ]
      );

      return { id: result.rows[0].id, ...record };
    } catch (error) {
      throw error;
    }
  },

  getDisbursements: async (userId) => {
    const db = getDB();
    try {
      const result = await db.query(
        "SELECT * FROM disbursements WHERE uploaded_by = $1 ORDER BY created_at DESC",
        [userId]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  getDisbursementByBatch: async (batchNumber) => {
    const db = getDB();
    try {
      const result = await db.query(
        "SELECT * FROM disbursements WHERE batch_number = $1",
        [batchNumber]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  },

  getDisbursementRecords: async (batchNumber) => {
    const db = getDB();
    try {
      const result = await db.query(
        "SELECT * FROM disbursement_records WHERE batch_number = $1 ORDER BY created_at ASC",
        [batchNumber]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  updateDisbursementStatus: async (id, status) => {
    const db = getDB();
    try {
      const result = await db.query(
        "UPDATE disbursements SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [status, id]
      );
      return { changes: result.rowCount };
    } catch (error) {
      throw error;
    }
  },
};

module.exports = {
  dbOperations,
  generateBatchNumber,
  initializeTables,
};

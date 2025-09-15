const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://username:password@host:port/database';

const pool = new Pool({
  connectionString: connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const getDB = () => {
  return pool;
};

const testConnection = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('📗 Connected to NeonDB PostgreSQL database');
    return true;
  } catch (err) {
    console.error('❌ Error connecting to database:', err.message);
    return false;
  }
};

module.exports = {
  getDB,
  testConnection
};
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
  try {
    console.log('Checking users table schema...');
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('Users table columns:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
    });
    
    // Also check if there are any users in the table
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`\nTotal users in table: ${userCount.rows[0].count}`);
    
    if (userCount.rows[0].count > 0) {
      const users = await pool.query('SELECT id, username, email, full_name FROM users LIMIT 5');
      console.log('\nFirst few users:');
      users.rows.forEach(user => {
        console.log(`- ${user.username} (${user.email || 'no email'})`);
      });
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkSchema();
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrateDatabase() {
  try {
    console.log('Starting database migration...');
    
    // Step 1: Add is_active column to users table if it doesn't exist
    console.log('1. Adding is_active column to users table...');
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE
    `);
    
    // Step 2: Get all current users with their profile data
    console.log('2. Getting existing users with profile data...');
    const users = await pool.query(`
      SELECT * FROM users
    `);
    
    console.log(`Found ${users.rows.length} users to migrate`);
    
    // Step 3: For each user, create profile record in user_profiles table
    for (const user of users.rows) {
      console.log(`3. Migrating profile for user: ${user.username}`);
      
      // Check if profile already exists
      const existingProfile = await pool.query(`
        SELECT id FROM user_profiles WHERE user_id = $1
      `, [user.id]);
      
      if (existingProfile.rows.length === 0) {
        // Insert profile data
        await pool.query(`
          INSERT INTO user_profiles (
            user_id, nrp, nama, nip, kode_cabang, nama_cabang, kode_induk, nama_induk,
            kode_kanwil, nama_kanwil, jabatan, id_fungsi, nama_fungsi,
            kode_penempatan, nama_penempatan, cost_centre, is_approval,
            kode_unit_kerja, nama_unit_kerja, kode_jabatan
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
          )
        `, [
          user.id, user.nrp, user.nama, user.nip, user.kode_cabang, user.nama_cabang,
          user.kode_induk, user.nama_induk, user.kode_kanwil, user.nama_kanwil,
          user.jabatan, user.id_fungsi, user.nama_fungsi, user.kode_penempatan,
          user.nama_penempatan, user.cost_centre, user.is_approval || false,
          user.kode_unit_kerja, user.nama_unit_kerja, user.kode_jabatan
        ]);
        
        console.log(`✅ Profile created for ${user.username}`);
      } else {
        console.log(`⚠️  Profile already exists for ${user.username}`);
      }
    }
    
    // Step 4: Remove profile columns from users table
    console.log('4. Removing profile columns from users table...');
    const profileColumns = [
      'nrp', 'nama', 'nip', 'kode_cabang', 'nama_cabang', 'kode_induk', 'nama_induk',
      'kode_kanwil', 'nama_kanwil', 'jabatan', 'id_fungsi', 'nama_fungsi',
      'kode_penempatan', 'nama_penempatan', 'cost_centre', 'is_approval',
      'kode_unit_kerja', 'nama_unit_kerja', 'kode_jabatan'
    ];
    
    for (const column of profileColumns) {
      try {
        await pool.query(`ALTER TABLE users DROP COLUMN IF EXISTS ${column}`);
        console.log(`✅ Dropped column: ${column}`);
      } catch (error) {
        console.log(`⚠️  Could not drop column ${column}: ${error.message}`);
      }
    }
    
    // Step 5: Verify the final structure
    console.log('5. Verifying final structure...');
    const finalUsers = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('Final users table columns:');
    finalUsers.rows.forEach(row => {
      console.log(`- ${row.column_name}`);
    });
    
    const profiles = await pool.query(`SELECT COUNT(*) FROM user_profiles`);
    console.log(`\nTotal profiles created: ${profiles.rows[0].count}`);
    
    console.log('\n✅ Database migration completed successfully!');
    
    await pool.end();
  } catch (error) {
    console.error('Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

migrateDatabase();
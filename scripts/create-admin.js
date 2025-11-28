const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool } = require('../src/config/database');

async function createAdmin() {
  try {
    console.log('🔐 Creating admin user...\n');

    // Generate strong random password
    const password = crypto.randomBytes(16).toString('hex');
    const passwordHash = await bcrypt.hash(password, 12); // Use 12 rounds for security

    const result = await pool.query(`
      INSERT INTO users (email, full_name, role, password_hash, is_active)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO UPDATE SET
        password_hash = $4,
        updated_at = NOW()
      RETURNING id, email, full_name, role
    `, ['admin@pos.com', 'System Administrator', 'admin', passwordHash, true]);

    const user = result.rows[0];

    console.log('✅ Admin user created successfully!\n');
    console.log('📧 Email:', user.email);
    console.log('🔑 Password:', password);
    console.log('👤 Role:', user.role);
    console.log('\n⚠️  IMPORTANT: Save this password securely!');
    console.log('   This password will not be shown again.\n');
    console.log('💡 You can change the password after logging in.\n');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    await pool.end();
    process.exit(1);
  }
}

createAdmin();

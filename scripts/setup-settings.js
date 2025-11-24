const { Pool } = require('pg');
require('dotenv').config();

// Check if DATABASE_URL contains render.com (production)
const isRenderDB = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: (process.env.NODE_ENV === 'production' || isRenderDB) ? {
    rejectUnauthorized: false
  } : false
});

async function setupSettings() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Setting up settings table...');

    // Create settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Settings table created');

    // Insert default settings
    await client.query(`
      INSERT INTO settings (key, value) VALUES
        ('viber_bot_token', ''),
        ('telegram_bot_token', ''),
        ('messenger_page_access_token', ''),
        ('messenger_verify_token', ''),
        ('webhook_domain', ''),
        ('smtp_host', ''),
        ('smtp_port', '587'),
        ('smtp_user', ''),
        ('smtp_pass', ''),
        ('company_name', 'Myanmar POS'),
        ('company_address', ''),
        ('company_phone', ''),
        ('company_email', ''),
        ('currency', 'MMK'),
        ('tax_rate', '0'),
        ('low_stock_threshold', '10')
      ON CONFLICT (key) DO NOTHING
    `);
    console.log('✅ Default settings inserted');

    // Verify
    const result = await client.query('SELECT COUNT(*) FROM settings');
    console.log(`✅ Settings table has ${result.rows[0].count} entries`);

    console.log('🎉 Settings setup complete!');
  } catch (error) {
    console.error('❌ Error setting up settings:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

setupSettings()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

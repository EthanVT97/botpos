const { pool } = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function createStoresTable() {
  console.log('🏪 Creating stores table and schema...');

  try {
    // Read the multi-store schema file
    const schemaPath = path.join(__dirname, '../database/multi_store_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute the schema
    await pool.query(schema);
    
    console.log('✅ Stores table and schema created successfully!');
    
    // Verify stores were created
    const result = await pool.query('SELECT * FROM stores ORDER BY created_at');
    console.log(`✅ Found ${result.rows.length} stores:`);
    result.rows.forEach(store => {
      console.log(`   - ${store.name} (${store.name_mm}) - Code: ${store.code}`);
    });

  } catch (error) {
    console.error('❌ Error creating stores table:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createStoresTable();

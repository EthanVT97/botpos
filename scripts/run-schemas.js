const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const schemaFiles = [
  'database/schema.sql',
  'database/chat_schema.sql',
  'database/bot_flow_schema.sql',
  'database/uom_schema.sql',
  'database/multi_store_schema.sql',
  'database/analytics_schema.sql',
  'database/auth_schema.sql'
];

async function runSchemas() {
  console.log('🚀 Starting database migration...\n');
  
  for (const schemaFile of schemaFiles) {
    const filePath = path.join(__dirname, '..', schemaFile);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  WARNING: Schema file not found: ${schemaFile}`);
      continue;
    }
    
    console.log(`📄 Running ${schemaFile}...`);
    
    try {
      const sql = fs.readFileSync(filePath, 'utf8');
      await pool.query(sql);
      console.log(`✅ ${schemaFile} completed successfully\n`);
    } catch (error) {
      console.error(`❌ ERROR in ${schemaFile}:`, error.message);
      console.error('   Continuing with next schema...\n');
    }
  }
  
  console.log('='.repeat(50));
  console.log('✅ Migration completed!');
  console.log('='.repeat(50));
  console.log('\nNext steps:');
  console.log('  1. Start your server: npm run dev');
  console.log('  2. Test the API: curl http://localhost:3001/health');
  console.log('  3. Open frontend: http://localhost:3000\n');
  
  await pool.end();
}

runSchemas().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});

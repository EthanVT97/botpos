#!/usr/bin/env node

/**
 * Auto-Migration Script for Render Deployment
 * 
 * This script automatically creates all necessary database tables
 * when deploying to Render. It runs as part of the build process.
 * 
 * Usage: node scripts/auto-migrate.js
 */

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// List of SQL files to execute in order
const SQL_FILES = [
  'schema.sql',              // Core tables
  'auth_schema.sql',         // Authentication & roles
  'chat_schema.sql',         // Chat messages & sessions
  'uom_schema.sql',          // Unit of measure
  'multi_store_schema.sql',  // Multi-store support
  'price_history_schema.sql',// Price tracking
  'bot_flow_schema.sql',     // Bot flows
  'chat_enhancements.sql',   // Chat enhancements
  'analytics_schema.sql',    // Analytics (if exists)
  'add_constraints.sql'      // Constraints
];

async function checkTableExists(tableName) {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      )
    `, [tableName]);
    return result.rows[0].exists;
  } catch (error) {
    return false;
  }
}

async function executeSQLFile(filename) {
  const filePath = path.join(__dirname, '../database', filename);
  
  try {
    // Check if file exists
    await fs.access(filePath);
    
    console.log(`📄 Executing: ${filename}`);
    const sql = await fs.readFile(filePath, 'utf8');
    
    // Execute the SQL
    await pool.query(sql);
    console.log(`✅ Completed: ${filename}`);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`⏭️  Skipped: ${filename} (file not found)`);
      return false;
    }
    
    // Log error but continue with other files
    console.error(`⚠️  Error in ${filename}:`, error.message);
    return false;
  }
}

async function verifyTables() {
  console.log('\n🔍 Verifying tables...');
  
  const criticalTables = [
    'users',
    'roles',
    'categories',
    'products',
    'customers',
    'orders',
    'order_items',
    'chat_messages',
    'chat_sessions',
    'stores',
    'uom'
  ];
  
  const results = [];
  for (const table of criticalTables) {
    const exists = await checkTableExists(table);
    results.push({ table, exists });
    console.log(`   ${exists ? '✓' : '✗'} ${table}`);
  }
  
  const allExist = results.every(r => r.exists);
  return allExist;
}

async function createExtensions() {
  console.log('🔧 Creating PostgreSQL extensions...');
  
  try {
    // Create uuid extension if not exists
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✅ uuid-ossp extension ready');
    
    // Try to create pgcrypto (for gen_random_uuid)
    try {
      await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
      console.log('✅ pgcrypto extension ready');
    } catch (err) {
      console.log('⚠️  pgcrypto not available (optional)');
    }
  } catch (error) {
    console.error('⚠️  Extension creation error:', error.message);
  }
}

async function runMigration() {
  console.log('🚀 Starting Auto-Migration for Render Deployment');
  console.log('================================================\n');

  // Skip migration if DATABASE_URL is not set (during Docker build)
  if (!process.env.DATABASE_URL) {
    console.log('⏭️  Skipping migration: DATABASE_URL not set');
    console.log('   (This is normal during Docker build)\n');
    process.exit(0);
  }

  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected\n');

    // Create extensions
    await createExtensions();
    console.log('');

    // Execute SQL files in order
    console.log('📚 Executing SQL files...\n');
    let successCount = 0;
    let skipCount = 0;
    
    for (const file of SQL_FILES) {
      const success = await executeSQLFile(file);
      if (success) successCount++;
      else skipCount++;
    }
    
    console.log(`\n📊 Summary: ${successCount} executed, ${skipCount} skipped\n`);

    // Verify critical tables
    const allTablesExist = await verifyTables();
    
    if (allTablesExist) {
      console.log('\n✅ All critical tables verified!');
    } else {
      console.log('\n⚠️  Some tables are missing. Check errors above.');
    }

    // Check for enhancements
    console.log('\n🎨 Checking optional features...');
    const hasTemplates = await checkTableExists('message_templates');
    const hasTags = await checkTableExists('conversation_tags');
    const hasNotes = await checkTableExists('customer_notes');
    
    console.log(`   ${hasTemplates ? '✓' : '✗'} Message Templates`);
    console.log(`   ${hasTags ? '✓' : '✗'} Conversation Tags`);
    console.log(`   ${hasNotes ? '✓' : '✗'} Customer Notes`);

    console.log('\n🎉 Auto-Migration Complete!');
    console.log('================================================\n');

    if (!allTablesExist) {
      console.log('⚠️  WARNING: Some critical tables are missing.');
      console.log('   The system may not work correctly.');
      console.log('   Please check the errors above.\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
runMigration();

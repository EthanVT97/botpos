#!/usr/bin/env node

/**
 * Apply Chat Typing Indicator Migration
 * Adds typing indicator and attachment support columns
 */

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function applyMigration() {
  console.log('🔧 Applying Chat Typing Indicator Migration...\n');

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected\n');

    // Read migration file
    const migrationPath = path.join(__dirname, '../database/chat_typing_migration.sql');
    const sql = await fs.readFile(migrationPath, 'utf8');

    // Execute migration
    console.log('📄 Executing migration...');
    await pool.query(sql);
    console.log('✅ Migration applied successfully\n');

    // Verify columns
    console.log('🔍 Verifying columns...');
    
    const sessionColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'chat_sessions' 
      AND column_name IN ('is_typing', 'typing_at', 'last_exported_at')
      ORDER BY column_name
    `);
    
    const messageColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'chat_messages' 
      AND column_name IN ('attachment_url', 'attachment_type', 'attachment_name', 'attachment_size')
      ORDER BY column_name
    `);

    console.log('\nChat Sessions columns:');
    sessionColumns.rows.forEach(row => {
      console.log(`  ✓ ${row.column_name}`);
    });

    console.log('\nChat Messages columns:');
    messageColumns.rows.forEach(row => {
      console.log(`  ✓ ${row.column_name}`);
    });

    console.log('\n✅ All columns verified!\n');
    console.log('🎉 Migration complete!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
applyMigration();

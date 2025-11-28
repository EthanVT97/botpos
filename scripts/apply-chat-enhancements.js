#!/usr/bin/env node

/**
 * Apply Chat Enhancements Migration
 * 
 * This script applies the chat enhancements schema to the database.
 * Run with: node scripts/apply-chat-enhancements.js
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
  console.log('🚀 Starting chat enhancements migration...\n');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../database/chat_enhancements.sql');
    const sql = await fs.readFile(sqlPath, 'utf8');

    console.log('📄 Loaded migration file: chat_enhancements.sql');

    // Execute the migration
    console.log('⚙️  Applying migration...');
    await pool.query(sql);

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📊 New features added:');
    console.log('   ✓ File attachments support');
    console.log('   ✓ Message templates');
    console.log('   ✓ Customer notes');
    console.log('   ✓ Conversation tags');
    console.log('   ✓ Typing indicators');
    console.log('   ✓ Message search');
    console.log('   ✓ Export functionality');

    // Verify tables were created
    console.log('\n🔍 Verifying tables...');
    
    const tables = [
      'message_templates',
      'customer_notes',
      'conversation_tags',
      'chat_session_tags'
    ];

    for (const table of tables) {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        )
      `, [table]);
      
      if (result.rows[0].exists) {
        console.log(`   ✓ ${table}`);
      } else {
        console.log(`   ✗ ${table} - FAILED`);
      }
    }

    // Check default data
    console.log('\n📝 Checking default data...');
    
    const templatesCount = await pool.query('SELECT COUNT(*) FROM message_templates');
    console.log(`   ✓ Message templates: ${templatesCount.rows[0].count}`);
    
    const tagsCount = await pool.query('SELECT COUNT(*) FROM conversation_tags');
    console.log(`   ✓ Conversation tags: ${tagsCount.rows[0].count}`);

    console.log('\n🎉 All done! Your chat system is now enhanced with new features.');
    console.log('\n📖 Next steps:');
    console.log('   1. Restart your backend server: npm run dev');
    console.log('   2. Restart your frontend: cd client && npm start');
    console.log('   3. Visit the Messages page to see the new features');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
applyMigration();

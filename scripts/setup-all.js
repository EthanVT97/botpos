#!/usr/bin/env node

/**
 * All-in-One Setup Script
 * Runs all necessary setup steps in order
 */

const { execSync } = require('child_process');

function runCommand(command, description) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔧 ${description}`);
  console.log(`${'='.repeat(60)}\n`);
  
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`\n✅ ${description} - Complete\n`);
    return true;
  } catch (error) {
    console.error(`\n❌ ${description} - Failed\n`);
    return false;
  }
}

async function setupAll() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║          Myanmar POS System - Complete Setup              ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');

  const steps = [
    {
      command: 'node scripts/fix-permissions.js',
      description: 'Step 1: Fix Permissions & Create Admin User'
    },
    {
      command: 'node scripts/seed-database.js',
      description: 'Step 2: Seed Database with Sample Data'
    },
    {
      command: 'node scripts/check-data.js',
      description: 'Step 3: Verify Data'
    }
  ];

  let successCount = 0;
  let failCount = 0;

  for (const step of steps) {
    const success = runCommand(step.command, step.description);
    if (success) {
      successCount++;
    } else {
      failCount++;
      console.log('\n⚠️  Setup encountered an error. Continuing...\n');
    }
  }

  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                    Setup Complete!                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');
  console.log(`Results: ${successCount} successful, ${failCount} failed\n`);
  
  if (failCount === 0) {
    console.log('✅ All setup steps completed successfully!\n');
    console.log('🚀 You can now start the application:\n');
    console.log('   Backend:  npm run dev');
    console.log('   Frontend: cd client && npm start\n');
    console.log('🔐 Login credentials:');
    console.log('   Email:    admin@pos.com');
    console.log('   Password: admin123\n');
    console.log('📊 Your database now has:');
    console.log('   - 5+ categories');
    console.log('   - 15+ products');
    console.log('   - 5+ customers');
    console.log('   - 10+ orders');
    console.log('   - 1 admin user\n');
  } else {
    console.log('⚠️  Some steps failed. Please check the errors above.\n');
    console.log('You can run individual scripts:');
    console.log('   node scripts/fix-permissions.js');
    console.log('   node scripts/seed-database.js');
    console.log('   node scripts/check-data.js\n');
  }
}

setupAll();

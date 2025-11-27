#!/usr/bin/env node

const { pool } = require('../src/config/database');
const bcrypt = require('bcryptjs');

async function fixPermissions() {
  console.log('🔧 Fixing permissions and roles...\n');

  try {
    // Update admin role with "all" permission
    console.log('1. Updating admin role permissions...');
    await pool.query(`
      UPDATE roles 
      SET permissions = jsonb_set(
        permissions, 
        '{all}', 
        'true'::jsonb
      )
      WHERE name = 'admin'
    `);
    console.log('   ✅ Admin role updated with "all" permission\n');

    // Add stores permission to all roles
    console.log('2. Adding stores permission to all roles...');
    await pool.query(`
      UPDATE roles 
      SET permissions = jsonb_set(
        permissions, 
        '{stores}', 
        CASE 
          WHEN name = 'admin' THEN '{"view": true, "create": true, "edit": true, "delete": true}'::jsonb
          WHEN name = 'manager' THEN '{"view": true, "create": true, "edit": true, "delete": false}'::jsonb
          WHEN name = 'cashier' THEN '{"view": true, "create": false, "edit": false, "delete": false}'::jsonb
          WHEN name = 'viewer' THEN '{"view": true, "create": false, "edit": false, "delete": false}'::jsonb
          ELSE '{"view": false, "create": false, "edit": false, "delete": false}'::jsonb
        END
      )
      WHERE permissions->>'stores' IS NULL
    `);
    console.log('   ✅ Stores permission added to all roles\n');

    // Check if admin user exists
    console.log('3. Checking admin user...');
    const adminCheck = await pool.query(`
      SELECT id, email, role FROM users WHERE email = 'admin@pos.com'
    `);

    if (adminCheck.rows.length === 0) {
      // Create admin user
      console.log('   Creating admin user...');
      const passwordHash = await bcrypt.hash('admin123', 10);
      
      await pool.query(`
        INSERT INTO users (email, full_name, role, password_hash, is_active)
        VALUES ($1, $2, $3, $4, $5)
      `, ['admin@pos.com', 'System Administrator', 'admin', passwordHash, true]);
      
      console.log('   ✅ Admin user created: admin@pos.com / admin123\n');
    } else {
      console.log('   ✅ Admin user exists:', adminCheck.rows[0].email);
      
      // Update password if needed
      const updatePassword = process.argv.includes('--reset-password');
      if (updatePassword) {
        console.log('   Resetting admin password...');
        const passwordHash = await bcrypt.hash('admin123', 10);
        await pool.query(`
          UPDATE users SET password_hash = $1 WHERE email = 'admin@pos.com'
        `, [passwordHash]);
        console.log('   ✅ Admin password reset to: admin123\n');
      } else {
        console.log('   (Use --reset-password flag to reset password)\n');
      }
    }

    // Display current roles and permissions
    console.log('4. Current roles and permissions:');
    const roles = await pool.query(`
      SELECT name, description, permissions FROM roles ORDER BY name
    `);

    roles.rows.forEach(role => {
      console.log(`\n   📋 ${role.name.toUpperCase()}`);
      console.log(`      ${role.description}`);
      
      const perms = role.permissions;
      if (perms.all) {
        console.log('      ✅ ALL PERMISSIONS (Admin)');
      } else {
        const resources = Object.keys(perms).filter(k => k !== 'all');
        console.log(`      Resources: ${resources.join(', ')}`);
      }
    });

    console.log('\n' + '='.repeat(50));
    console.log('✅ Permissions fixed successfully!');
    console.log('='.repeat(50));
    console.log('\nYou can now login with:');
    console.log('  Email: admin@pos.com');
    console.log('  Password: admin123');
    console.log('\nAll routes should now be accessible.\n');

  } catch (error) {
    console.error('❌ Error fixing permissions:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the fix
fixPermissions();

#!/usr/bin/env node

const { pool } = require('../src/config/database');

async function checkData() {
  console.log('🔍 Checking database data...\n');

  try {
    // Check categories
    const categories = await pool.query('SELECT COUNT(*) as count FROM categories');
    console.log(`📦 Categories: ${categories.rows[0].count}`);

    // Check products
    const products = await pool.query('SELECT COUNT(*) as count FROM products');
    console.log(`📦 Products: ${products.rows[0].count}`);

    // Check customers
    const customers = await pool.query('SELECT COUNT(*) as count FROM customers');
    console.log(`👥 Customers: ${customers.rows[0].count}`);

    // Check orders
    const orders = await pool.query('SELECT COUNT(*) as count FROM orders');
    console.log(`📋 Orders: ${orders.rows[0].count}`);

    // Check users
    const users = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log(`👤 Users: ${users.rows[0].count}`);

    // Check stores
    try {
      const stores = await pool.query('SELECT COUNT(*) as count FROM stores');
      console.log(`🏪 Stores: ${stores.rows[0].count}`);
    } catch (e) {
      console.log('🏪 Stores: Table not found');
    }

    // Check UOMs
    try {
      const uoms = await pool.query('SELECT COUNT(*) as count FROM uom');
      console.log(`📏 UOMs: ${uoms.rows[0].count}`);
    } catch (e) {
      console.log('📏 UOMs: Table not found');
    }

    console.log('\n' + '='.repeat(50));
    
    const totalRecords = parseInt(categories.rows[0].count) + 
                        parseInt(products.rows[0].count) + 
                        parseInt(customers.rows[0].count) + 
                        parseInt(orders.rows[0].count);

    if (totalRecords === 0) {
      console.log('❌ No data found! Run: node scripts/seed-database.js');
    } else if (totalRecords < 20) {
      console.log('⚠️  Low data count. Consider running seed script.');
    } else {
      console.log('✅ Database has sufficient data!');
    }
    
    console.log('='.repeat(50) + '\n');

    // Show sample data
    console.log('📊 Sample Data:\n');
    
    const sampleProducts = await pool.query('SELECT name, price, stock_quantity FROM products LIMIT 5');
    console.log('Products:');
    sampleProducts.rows.forEach(p => {
      console.log(`  - ${p.name}: ${p.price} Ks (Stock: ${p.stock_quantity})`);
    });

    const sampleCustomers = await pool.query('SELECT name, phone FROM customers LIMIT 3');
    console.log('\nCustomers:');
    sampleCustomers.rows.forEach(c => {
      console.log(`  - ${c.name}: ${c.phone}`);
    });

  } catch (error) {
    console.error('❌ Error checking data:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkData();

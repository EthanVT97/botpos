const { pool } = require('../src/config/database');

async function addMoreStores() {
  console.log('🏪 Adding more stores...');

  try {
    // Additional stores to add
    const newStores = [
      { 
        name: 'Downtown Branch', 
        name_mm: 'မြို့လယ်ဆိုင်ခွဲ', 
        code: 'DT01', 
        address: 'Downtown Yangon, Sule Pagoda Road', 
        phone: '09444444444',
        email: 'downtown@pos.com'
      },
      { 
        name: 'Airport Branch', 
        name_mm: 'လေဆိပ်ဆိုင်ခွဲ', 
        code: 'AP01', 
        address: 'Yangon International Airport', 
        phone: '09555555555',
        email: 'airport@pos.com'
      },
      { 
        name: 'Bagan Branch', 
        name_mm: 'ပုဂံဆိုင်ခွဲ', 
        code: 'BG01', 
        address: 'Bagan, Mandalay Region', 
        phone: '09666666666',
        email: 'bagan@pos.com'
      }
    ];

    const storeIds = [];
    
    for (const store of newStores) {
      // Check if store already exists
      const existing = await pool.query('SELECT id FROM stores WHERE code = $1', [store.code]);
      
      if (existing.rows.length > 0) {
        console.log(`⚠️  Store ${store.name} (${store.code}) already exists`);
        storeIds.push(existing.rows[0].id);
      } else {
        const result = await pool.query(`
          INSERT INTO stores (name, name_mm, code, address, phone, email, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `, [store.name, store.name_mm, store.code, store.address, store.phone, store.email, true]);
        
        storeIds.push(result.rows[0].id);
        console.log(`✅ Created store: ${store.name} (${store.code})`);
      }
    }

    // Get all products
    const productsResult = await pool.query('SELECT id, name, stock_quantity FROM products');
    const products = productsResult.rows;

    // Initialize inventory for new stores
    console.log('\n📦 Initializing inventory for new stores...');
    for (const storeId of storeIds) {
      for (const product of products) {
        // Random stock between 10-100 for variety
        const randomStock = Math.floor(Math.random() * 91) + 10;
        
        await pool.query(`
          INSERT INTO store_inventory (store_id, product_id, quantity, min_quantity)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (store_id, product_id) 
          DO UPDATE SET quantity = $3
        `, [storeId, product.id, randomStock, 5]);
      }
    }
    console.log(`✅ Initialized inventory for ${storeIds.length} stores`);

    // Create some sample store transfers
    console.log('\n🚚 Creating sample store transfers...');
    const allStores = await pool.query('SELECT id FROM stores ORDER BY created_at LIMIT 5');
    
    if (allStores.rows.length >= 2) {
      const fromStore = allStores.rows[0].id;
      const toStore = allStores.rows[1].id;
      
      // Get admin user
      const adminResult = await pool.query('SELECT id FROM users WHERE email = $1', ['admin@pos.com']);
      const adminId = adminResult.rows[0]?.id;

      if (adminId) {
        // Create a transfer
        const transferResult = await pool.query(`
          INSERT INTO store_transfers (from_store_id, to_store_id, status, requested_by, notes)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `, [fromStore, toStore, 'pending', adminId, 'Sample transfer for testing']);

        const transferId = transferResult.rows[0].id;

        // Add 3 random products to transfer
        const randomProducts = products.slice(0, 3);
        for (const product of randomProducts) {
          await pool.query(`
            INSERT INTO store_transfer_items (transfer_id, product_id, quantity)
            VALUES ($1, $2, $3)
          `, [transferId, product.id, 10]);
        }

        console.log(`✅ Created sample transfer with ${randomProducts.length} items`);
      }
    }

    // Display summary
    console.log('\n📊 Store Summary:');
    const allStoresResult = await pool.query(`
      SELECT 
        s.name, 
        s.name_mm, 
        s.code, 
        s.address,
        s.phone,
        COUNT(si.id) as product_count,
        SUM(si.quantity) as total_inventory
      FROM stores s
      LEFT JOIN store_inventory si ON s.id = si.store_id
      WHERE s.is_active = TRUE
      GROUP BY s.id, s.name, s.name_mm, s.code, s.address, s.phone
      ORDER BY s.created_at
    `);

    console.log('\n🏪 All Stores:');
    allStoresResult.rows.forEach((store, index) => {
      console.log(`\n${index + 1}. ${store.name} (${store.name_mm})`);
      console.log(`   Code: ${store.code}`);
      console.log(`   Address: ${store.address}`);
      console.log(`   Phone: ${store.phone}`);
      console.log(`   Products: ${store.product_count}`);
      console.log(`   Total Inventory: ${store.total_inventory} units`);
    });

    console.log('\n🎉 Store setup completed successfully!');

  } catch (error) {
    console.error('❌ Error adding stores:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

addMoreStores();

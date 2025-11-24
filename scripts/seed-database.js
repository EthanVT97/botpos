const { pool } = require('../src/config/database');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Create admin user
    console.log('Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const userResult = await pool.query(`
      INSERT INTO users (email, password_hash, full_name, role, is_active)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO UPDATE 
      SET password_hash = $2, full_name = $3, role = $4, is_active = $5
      RETURNING id
    `, ['admin@pos.com', hashedPassword, 'Admin User', 'admin', true]);
    
    const adminId = userResult.rows[0].id;
    console.log('✅ Admin user created (email: admin@pos.com, password: admin123)');

    // 2. Create categories
    console.log('Creating categories...');
    const categories = [
      { name: 'Beverages', description: 'Drinks and beverages' },
      { name: 'Snacks', description: 'Snacks and chips' },
      { name: 'Electronics', description: 'Electronic items' },
      { name: 'Stationery', description: 'Office and school supplies' },
      { name: 'Food', description: 'Food items' }
    ];

    const categoryIds = [];
    for (const cat of categories) {
      // Check if category exists
      const existing = await pool.query('SELECT id FROM categories WHERE name = $1', [cat.name]);
      if (existing.rows.length > 0) {
        categoryIds.push(existing.rows[0].id);
      } else {
        // Try with name_mm column first, fall back to without if it doesn't exist
        try {
          const result = await pool.query(`
            INSERT INTO categories (name, description)
            VALUES ($1, $2)
            RETURNING id
          `, [cat.name, cat.description]);
          categoryIds.push(result.rows[0].id);
        } catch (error) {
          console.error('Error inserting category:', error.message);
          throw error;
        }
      }
    }
    console.log(`✅ Created ${categories.length} categories`);

    // 3. Create UOMs (Units of Measure) - if table exists
    console.log('Creating UOMs...');
    let uomIds = [];
    try {
      const uoms = [
        { code: 'PCS', name: 'Pieces', name_mm: 'ခု', description: 'Individual pieces' },
        { code: 'BOX', name: 'Box', name_mm: 'သေတ္တာ', description: 'Box of items' },
        { code: 'KG', name: 'Kilogram', name_mm: 'ကီလိုဂရမ်', description: 'Weight in kilograms' },
        { code: 'L', name: 'Liter', name_mm: 'လီတာ', description: 'Volume in liters' },
        { code: 'PKT', name: 'Packet', name_mm: 'အထုပ်', description: 'Packet of items' },
        { code: 'BTL', name: 'Bottle', name_mm: 'ပုလင်း', description: 'Bottle' },
        { code: 'CAN', name: 'Can', name_mm: 'ဘူး', description: 'Can' }
      ];

      for (const uom of uoms) {
        const existing = await pool.query('SELECT id FROM uom WHERE code = $1', [uom.code]);
        if (existing.rows.length > 0) {
          uomIds.push(existing.rows[0].id);
        } else {
          const result = await pool.query(`
            INSERT INTO uom (code, name, name_mm, description)
            VALUES ($1, $2, $3, $4)
            RETURNING id
          `, [uom.code, uom.name, uom.name_mm, uom.description]);
          uomIds.push(result.rows[0].id);
        }
      }
      console.log(`✅ Created ${uoms.length} UOMs`);
    } catch (error) {
      console.log('⚠️  UOM table not found, skipping UOMs');
      uomIds = [null]; // Use null for products without UOM
    }

    // 4. Create products
    console.log('Creating products...');
    const products = [
      { name: 'Coca Cola', price: 1000, cost: 700, category_idx: 0, stock: 50, sku: 'BEV001', barcode: '1234567890001' },
      { name: 'Pepsi', price: 1000, cost: 700, category_idx: 0, stock: 45, sku: 'BEV002', barcode: '1234567890002' },
      { name: 'Lay\'s Chips', price: 1500, cost: 1000, category_idx: 1, stock: 100, sku: 'SNK001', barcode: '1234567890003' },
      { name: 'Pringles', price: 3500, cost: 2500, category_idx: 1, stock: 30, sku: 'SNK002', barcode: '1234567890004' },
      { name: 'USB Cable', price: 5000, cost: 3000, category_idx: 2, stock: 25, sku: 'ELC001', barcode: '1234567890005' },
      { name: 'Power Bank', price: 15000, cost: 10000, category_idx: 2, stock: 15, sku: 'ELC002', barcode: '1234567890006' },
      { name: 'Notebook A4', price: 2000, cost: 1200, category_idx: 3, stock: 80, sku: 'STA001', barcode: '1234567890007' },
      { name: 'Pen Set', price: 3000, cost: 1800, category_idx: 3, stock: 60, sku: 'STA002', barcode: '1234567890008' },
      { name: 'Instant Noodles', price: 800, cost: 500, category_idx: 4, stock: 200, sku: 'FOD001', barcode: '1234567890009' },
      { name: 'Rice 1kg', price: 2500, cost: 1800, category_idx: 4, stock: 50, sku: 'FOD002', barcode: '1234567890010' },
      { name: 'Mineral Water', price: 500, cost: 300, category_idx: 0, stock: 150, sku: 'BEV003', barcode: '1234567890011' },
      { name: 'Energy Drink', price: 2000, cost: 1400, category_idx: 0, stock: 40, sku: 'BEV004', barcode: '1234567890012' },
      { name: 'Chocolate Bar', price: 1200, cost: 800, category_idx: 1, stock: 90, sku: 'SNK003', barcode: '1234567890013' },
      { name: 'Biscuits', price: 1000, cost: 600, category_idx: 1, stock: 120, sku: 'SNK004', barcode: '1234567890014' },
      { name: 'Headphones', price: 8000, cost: 5000, category_idx: 2, stock: 20, sku: 'ELC003', barcode: '1234567890015' }
    ];

    const productIds = [];
    for (const prod of products) {
      const existing = await pool.query('SELECT id FROM products WHERE sku = $1', [prod.sku]);
      if (existing.rows.length > 0) {
        productIds.push(existing.rows[0].id);
      } else {
        const result = await pool.query(`
          INSERT INTO products (name, price, cost, category_id, stock_quantity, sku, barcode)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `, [
          prod.name, 
          prod.price, 
          prod.cost, 
          categoryIds[prod.category_idx], 
          prod.stock, 
          prod.sku, 
          prod.barcode
        ]);
        productIds.push(result.rows[0].id);
      }
    }
    console.log(`✅ Created ${products.length} products`);

    // 5. Create customers
    console.log('Creating customers...');
    const customers = [
      { name: 'Aung Aung (အောင်အောင်)', phone: '09123456789', email: 'aung@example.com', address: 'Yangon' },
      { name: 'Su Su (စုစု)', phone: '09234567890', email: 'susu@example.com', address: 'Mandalay' },
      { name: 'Ko Ko (ကိုကို)', phone: '09345678901', email: 'koko@example.com', address: 'Naypyidaw' },
      { name: 'Mya Mya (မြမြ)', phone: '09456789012', email: 'myamya@example.com', address: 'Yangon' },
      { name: 'Zaw Zaw (ဇော်ဇော်)', phone: '09567890123', email: 'zawzaw@example.com', address: 'Bago' }
    ];

    const customerIds = [];
    for (const cust of customers) {
      const existing = await pool.query('SELECT id FROM customers WHERE phone = $1', [cust.phone]);
      if (existing.rows.length > 0) {
        customerIds.push(existing.rows[0].id);
      } else {
        const result = await pool.query(`
          INSERT INTO customers (name, phone, email, address)
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `, [cust.name, cust.phone, cust.email, cust.address]);
        customerIds.push(result.rows[0].id);
      }
    }
    console.log(`✅ Created ${customers.length} customers`);

    // 6. Get or create stores
    console.log('Setting up stores...');
    let storeIds = [];
    try {
      // Check if stores already exist
      const existingStores = await pool.query('SELECT id, name, code FROM stores ORDER BY created_at');
      
      if (existingStores.rows.length > 0) {
        console.log(`✅ Found ${existingStores.rows.length} existing stores`);
        storeIds = existingStores.rows.map(s => s.id);
        existingStores.rows.forEach(store => {
          console.log(`   - ${store.name} (Code: ${store.code})`);
        });
      } else {
        // Create stores if none exist
        const stores = [
          { name: 'Main Store', name_mm: 'ပင်မဆိုင်', code: 'MAIN', address: 'Yangon Downtown, Myanmar', phone: '09111111111' },
          { name: 'Branch 1', name_mm: 'ဆိုင်ခွဲ ၁', code: 'BR01', address: 'Mandalay Center, Myanmar', phone: '09222222222' },
          { name: 'Branch 2', name_mm: 'ဆိုင်ခွဲ ၂', code: 'BR02', address: 'Naypyidaw Plaza, Myanmar', phone: '09333333333' }
        ];

        for (const store of stores) {
          const result = await pool.query(`
            INSERT INTO stores (name, name_mm, code, address, phone, is_active)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
          `, [store.name, store.name_mm, store.code, store.address, store.phone, true]);
          storeIds.push(result.rows[0].id);
        }
        console.log(`✅ Created ${stores.length} stores`);
      }
      
      // Initialize store inventory for all products
      console.log('Initializing store inventory...');
      for (const storeId of storeIds) {
        for (const productId of productIds) {
          // Get product stock
          const productResult = await pool.query('SELECT stock_quantity FROM products WHERE id = $1', [productId]);
          const stock = productResult.rows[0]?.stock_quantity || 0;
          
          // Add to store inventory
          await pool.query(`
            INSERT INTO store_inventory (store_id, product_id, quantity, min_quantity)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (store_id, product_id) DO NOTHING
          `, [storeId, productId, stock, 5]);
        }
      }
      console.log(`✅ Initialized inventory for ${storeIds.length} stores`);
      
    } catch (error) {
      console.log('⚠️  Stores table not found, skipping stores');
      console.log('   Error:', error.message);
      storeIds = [null];
    }

    // 7. Create sample orders
    console.log('Creating sample orders...');
    const orderCount = 10;
    for (let i = 0; i < orderCount; i++) {
      const customerId = customerIds[Math.floor(Math.random() * customerIds.length)];
      const storeId = storeIds.length > 0 && storeIds[0] !== null 
        ? storeIds[Math.floor(Math.random() * storeIds.length)] 
        : null;
      
      // Create order with store_id if available
      let orderResult;
      if (storeId) {
        orderResult = await pool.query(`
          INSERT INTO orders (customer_id, store_id, total_amount, status, payment_method)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `, [customerId, storeId, 0, 'completed', 'cash']);
      } else {
        orderResult = await pool.query(`
          INSERT INTO orders (customer_id, total_amount, status, payment_method)
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `, [customerId, 0, 'completed', 'cash']);
      }
      
      const orderId = orderResult.rows[0].id;
      
      // Add 2-4 random items to order
      const itemCount = 2 + Math.floor(Math.random() * 3);
      let totalAmount = 0;
      
      for (let j = 0; j < itemCount; j++) {
        const productId = productIds[Math.floor(Math.random() * productIds.length)];
        const quantity = 1 + Math.floor(Math.random() * 3);
        
        // Get product price
        const productResult = await pool.query('SELECT price FROM products WHERE id = $1', [productId]);
        const price = parseFloat(productResult.rows[0].price);
        const subtotal = price * quantity;
        totalAmount += subtotal;
        
        // Insert order item
        await pool.query(`
          INSERT INTO order_items (order_id, product_id, quantity, price, subtotal)
          VALUES ($1, $2, $3, $4, $5)
        `, [orderId, productId, quantity, price, subtotal]);
      }
      
      // Update order total
      await pool.query('UPDATE orders SET total_amount = $1 WHERE id = $2', [totalAmount, orderId]);
    }
    console.log(`✅ Created ${orderCount} sample orders`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📝 Login credentials:');
    console.log('   Email: admin@pos.com');
    console.log('   Password: admin123');
    console.log('\n📊 Summary:');
    console.log(`   - ${categories.length} categories`);
    console.log(`   - ${uomIds.length > 0 && uomIds[0] !== null ? uomIds.length : 0} UOMs`);
    console.log(`   - ${products.length} products`);
    console.log(`   - ${customers.length} customers`);
    console.log(`   - ${storeIds.length > 0 && storeIds[0] !== null ? storeIds.length : 0} stores`);
    console.log(`   - ${orderCount} orders`);
    console.log('   - 1 admin user\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the seed function
seedDatabase();

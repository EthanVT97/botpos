const { supabase } = require('../config/supabase');

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Check if data already exists
    const { data: existingCategories } = await supabase
      .from('categories')
      .select('id')
      .limit(1);

    if (existingCategories && existingCategories.length > 0) {
      console.log('⚠️  Database already has data. Skipping seed.');
      return;
    }

    // Seed Categories
    console.log('📦 Seeding categories...');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .insert([
        { name: 'Electronics', name_mm: 'အီလက်ထရောနစ်', description: 'Electronic devices and accessories' },
        { name: 'Food & Beverage', name_mm: 'အစားအသောက်', description: 'Food and drinks' },
        { name: 'Clothing', name_mm: 'အဝတ်အထည်', description: 'Clothes and fashion items' },
        { name: 'Home & Garden', name_mm: 'အိမ်နှင့်ဥယျာဉ်', description: 'Home and garden supplies' },
        { name: 'Beauty & Health', name_mm: 'အလှနှင့်ကျန်းမာရေး', description: 'Beauty and health products' }
      ])
      .select();

    if (catError) throw catError;
    console.log(`✅ Created ${categories.length} categories`);

    // Seed Products
    console.log('📦 Seeding products...');
    const products = [
      { name: 'Smartphone', name_mm: 'စမတ်ဖုန်း', price: 500000, cost: 350000, stock_quantity: 50, category_id: categories[0].id, sku: 'ELEC-001' },
      { name: 'Laptop', name_mm: 'လက်တော့ပ်', price: 1200000, cost: 900000, stock_quantity: 20, category_id: categories[0].id, sku: 'ELEC-002' },
      { name: 'Headphones', name_mm: 'နားကြပ်', price: 50000, cost: 30000, stock_quantity: 100, category_id: categories[0].id, sku: 'ELEC-003' },
      { name: 'Coffee', name_mm: 'ကော်ဖီ', price: 3000, cost: 1500, stock_quantity: 200, category_id: categories[1].id, sku: 'FOOD-001' },
      { name: 'Green Tea', name_mm: 'လက်ဖက်ရည်', price: 2500, cost: 1200, stock_quantity: 150, category_id: categories[1].id, sku: 'FOOD-002' },
      { name: 'Snacks', name_mm: 'သုပ်ခွက်', price: 1500, cost: 800, stock_quantity: 300, category_id: categories[1].id, sku: 'FOOD-003' },
      { name: 'T-Shirt', name_mm: 'တီရှပ်', price: 15000, cost: 8000, stock_quantity: 80, category_id: categories[2].id, sku: 'CLTH-001' },
      { name: 'Jeans', name_mm: 'ဂျင်းဘောင်းဘီ', price: 35000, cost: 20000, stock_quantity: 60, category_id: categories[2].id, sku: 'CLTH-002' },
      { name: 'Shampoo', name_mm: 'ခေါင်းလျှော်ရည်', price: 8000, cost: 5000, stock_quantity: 120, category_id: categories[4].id, sku: 'HLTH-001' },
      { name: 'Soap', name_mm: 'ဆပ်ပြာ', price: 2000, cost: 1000, stock_quantity: 250, category_id: categories[4].id, sku: 'HLTH-002' }
    ];

    const { data: createdProducts, error: prodError } = await supabase
      .from('products')
      .insert(products)
      .select();

    if (prodError) throw prodError;
    console.log(`✅ Created ${createdProducts.length} products`);

    // Seed Sample Customer
    console.log('👥 Seeding customers...');
    const { data: customers, error: custError } = await supabase
      .from('customers')
      .insert([
        { name: 'Aung Aung', phone: '+95 9 123 456 789', email: 'aung@example.com', address: 'Yangon, Myanmar' },
        { name: 'Su Su', phone: '+95 9 987 654 321', email: 'susu@example.com', address: 'Mandalay, Myanmar' },
        { name: 'Ko Ko', phone: '+95 9 555 666 777', address: 'Naypyidaw, Myanmar' }
      ])
      .select();

    if (custError) throw custError;
    console.log(`✅ Created ${customers.length} customers`);

    // Seed Sample Settings
    console.log('⚙️  Seeding settings...');
    const { error: settingsError } = await supabase
      .from('settings')
      .insert([
        { key: 'store_name', value: 'Myanmar POS Store' },
        { key: 'store_name_mm', value: 'မြန်မာ POS ဆိုင်' },
        { key: 'store_phone', value: '+95 9 123 456 789' },
        { key: 'store_address', value: 'Yangon, Myanmar' },
        { key: 'tax_rate', value: '5' },
        { key: 'currency', value: 'MMK' },
        { key: 'low_stock_threshold', value: '10' },
        { key: 'viber_bot_token', value: '' },
        { key: 'telegram_bot_token', value: '' },
        { key: 'messenger_page_access_token', value: '' },
        { key: 'messenger_verify_token', value: '' },
        { key: 'webhook_domain', value: '' }
      ]);

    if (settingsError) throw settingsError;
    console.log('✅ Created settings');

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedDatabase };

#!/usr/bin/env node

const axios = require('axios');

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

async function testAPI() {
  console.log('🧪 Testing API Endpoints...\n');
  console.log(`📍 API URL: ${API_URL}\n`);

  const endpoints = [
    { name: 'Products', url: '/products' },
    { name: 'Categories', url: '/categories' },
    { name: 'Customers', url: '/customers' },
    { name: 'Orders', url: '/orders' },
    { name: 'Stores', url: '/stores' },
    { name: 'UOMs', url: '/uom' }
  ];

  let successCount = 0;
  let failCount = 0;

  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${API_URL}${endpoint.url}`);
      const data = response.data?.data || response.data;
      const count = Array.isArray(data) ? data.length : 0;
      
      if (count > 0) {
        console.log(`✅ ${endpoint.name}: ${count} records`);
        successCount++;
      } else {
        console.log(`⚠️  ${endpoint.name}: 0 records (empty)`);
        failCount++;
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Error: ${error.response.data?.error || 'Unknown error'}`);
      }
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`Results: ${successCount} success, ${failCount} failed`);
  console.log('='.repeat(50));

  if (failCount > 0) {
    console.log('\n⚠️  Some endpoints failed!');
    console.log('Troubleshooting:');
    console.log('  1. Make sure backend is running: npm run dev');
    console.log('  2. Check database has data: node scripts/check-data.js');
    console.log('  3. Verify API_URL is correct');
    console.log('  4. Check backend logs for errors\n');
    process.exit(1);
  } else {
    console.log('\n✅ All API endpoints working!\n');
  }
}

testAPI();

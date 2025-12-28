/**
 * Test Order API for customer_mobile field
 * Run with: node scripts/testOrderAPI.js [order_id]
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
const orderId = process.argv[2] || 1; // Default to order ID 1

async function testOrderAPI() {
  console.log(`\n=== Testing Order API (ID: ${orderId}) ===\n`);

  try {
    // Test 1: Get single order
    console.log('1. Fetching order details...');
    const response = await axios.get(`${API_URL}/orders/${orderId}`);
    
    if (!response.data.success) {
      console.log('❌ API returned error:', response.data.message);
      return;
    }

    const order = response.data.data;
    
    console.log('✅ Order fetched successfully:');
    console.log(`   Order No: ${order.order_no}`);
    console.log(`   Customer: ${order.customer_name}`);
    console.log(`   Customer State: ${order.customer_state}`);
    console.log(`   Customer Mobile: ${order.customer_mobile || '❌ NOT FOUND'}`);
    
    // Check if customer_mobile exists
    if (order.customer_mobile) {
      console.log(`\n✅ SUCCESS: customer_mobile field is present: ${order.customer_mobile}`);
      console.log('   WhatsApp notifications can be sent to this customer.');
    } else {
      console.log('\n❌ PROBLEM: customer_mobile field is missing or empty!');
      console.log('   This will cause "Customer mobile number not available" error.');
      console.log('\n   Possible causes:');
      console.log('   1. Customer record has no mobile_no in database');
      console.log('   2. Backend query not including mobile_no field');
      console.log('   3. Server needs restart to load updated query');
    }

    // Test 2: Check pending orders API
    console.log('\n2. Fetching pending orders...');
    const pendingResponse = await axios.get(`${API_URL}/orders/status/pending`);
    
    if (pendingResponse.data.success && pendingResponse.data.data.length > 0) {
      const firstPending = pendingResponse.data.data[0];
      console.log('✅ Pending orders fetched:');
      console.log(`   First order: ${firstPending.order_no}`);
      console.log(`   Customer Mobile: ${firstPending.customer_mobile || '❌ NOT FOUND'}`);
    }

    console.log('\n=== Test Complete ===\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

testOrderAPI();

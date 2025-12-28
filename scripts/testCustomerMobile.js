/**
 * Test script to verify customer mobile numbers in orders
 * Run with: node scripts/testCustomerMobile.js
 */

const { query } = require('../config/database');

async function testCustomerMobile() {
  console.log('=== Testing Customer Mobile Numbers ===\n');

  try {
    // Test 1: Check if customers have mobile numbers
    console.log('1. Checking customers with mobile numbers:');
    const customersResult = await query(
      'SELECT id, customer_name, mobile_no FROM customers ORDER BY id LIMIT 5'
    );
    
    console.log(`   Found ${customersResult.rows.length} customers:`);
    customersResult.rows.forEach(customer => {
      const mobileStatus = customer.mobile_no ? `✅ ${customer.mobile_no}` : '❌ No mobile';
      console.log(`   - ${customer.customer_name}: ${mobileStatus}`);
    });

    // Test 2: Check orders with customer mobile numbers
    console.log('\n2. Checking orders with customer mobile numbers:');
    const ordersResult = await query(`
      SELECT 
        o.id,
        o.order_no,
        c.customer_name,
        c.mobile_no as customer_mobile
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      ORDER BY o.id DESC
      LIMIT 5
    `);

    console.log(`   Found ${ordersResult.rows.length} orders:`);
    ordersResult.rows.forEach(order => {
      const mobileStatus = order.customer_mobile ? `✅ ${order.customer_mobile}` : '❌ No mobile';
      console.log(`   - ${order.order_no} (${order.customer_name}): ${mobileStatus}`);
    });

    // Test 3: Count customers without mobile numbers
    console.log('\n3. Customers missing mobile numbers:');
    const missingMobileResult = await query(`
      SELECT COUNT(*) as count
      FROM customers
      WHERE mobile_no IS NULL OR mobile_no = ''
    `);

    const missingCount = parseInt(missingMobileResult.rows[0].count);
    if (missingCount > 0) {
      console.log(`   ⚠️  ${missingCount} customers need mobile numbers to be added`);
      
      // Show which customers are missing
      const customersList = await query(`
        SELECT id, customer_name
        FROM customers
        WHERE mobile_no IS NULL OR mobile_no = ''
        ORDER BY customer_name
        LIMIT 10
      `);
      
      console.log('\n   Customers without mobile numbers:');
      customersList.rows.forEach(customer => {
        console.log(`   - ${customer.customer_name} (ID: ${customer.id})`);
      });
    } else {
      console.log('   ✅ All customers have mobile numbers!');
    }

    // Test 4: Sample update query
    if (missingCount > 0) {
      console.log('\n4. To add mobile numbers, use:');
      console.log('   UPDATE customers SET mobile_no = \'919876543210\' WHERE id = 1;');
      console.log('   (Replace with actual country code + number)');
    }

    console.log('\n=== Test Complete ===');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

testCustomerMobile();

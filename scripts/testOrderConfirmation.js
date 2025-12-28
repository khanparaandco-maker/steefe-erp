/**
 * Test Order Confirmation WhatsApp Message
 * Run with: node scripts/testOrderConfirmation.js [phone_number]
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testOrderConfirmation() {
  const phoneNumber = process.argv[2];

  if (!phoneNumber) {
    log('❌ Please provide a phone number', 'red');
    log('Usage: node scripts/testOrderConfirmation.js 919876543210', 'yellow');
    return;
  }

  log('\n╔════════════════════════════════════════════╗', 'cyan');
  log('║  Testing Order Confirmation WhatsApp      ║', 'cyan');
  log('╚════════════════════════════════════════════╝\n', 'cyan');

  try {
    // Check WhatsApp status first
    log('1️⃣  Checking WhatsApp status...', 'cyan');
    const statusResponse = await axios.get(`${API_URL}/whatsapp/status`);
    
    if (!statusResponse.data.isReady) {
      log('❌ WhatsApp is not ready!', 'red');
      log('Please initialize WhatsApp and scan QR code first:', 'yellow');
      log('   http://localhost:5173/settings/whatsapp', 'cyan');
      return;
    }
    log('✅ WhatsApp is ready\n', 'green');

    // Sample order data with multiple items
    const sampleOrderData = {
      order_no: 'ORD-202512-00099',
      order_date: new Date().toISOString(),
      customer_name: 'ABC Industries Pvt Ltd',
      contact_person: 'Rajesh Kumar',
      items: [
        {
          item_name: 'Stel Shots-S330',
          quantity: '5000',
          uom: 'KG',
          rate: '50.00',
          amount: '250000.00'
        },
        {
          item_name: 'Stel Shots-S390',
          quantity: '3000',
          uom: 'KG',
          rate: '55.00',
          amount: '165000.00'
        },
        {
          item_name: 'Stel Shots-S460',
          quantity: '2000',
          uom: 'KG',
          rate: '60.00',
          amount: '120000.00'
        }
      ],
      total_amount: '535000.00',
      estimated_delivery_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
      payment_condition: 'Advance Payment'
    };

    log('2️⃣  Sending order confirmation...', 'cyan');
    log(`   To: ${phoneNumber}`, 'reset');
    log(`   Order: ${sampleOrderData.order_no}`, 'reset');
    log(`   Items: ${sampleOrderData.items.length}`, 'reset');
    log(`   Total: ₹${parseFloat(sampleOrderData.total_amount).toLocaleString('en-IN')}\n`, 'reset');

    const response = await axios.post(`${API_URL}/whatsapp/send-order`, {
      phoneNumber,
      orderData: sampleOrderData
    });

    if (response.data.success) {
      log('✅ Order confirmation sent successfully!', 'green');
      log(`   Message ID: ${response.data.data.messageId}`, 'reset');
      log(`   Timestamp: ${new Date(response.data.data.timestamp * 1000).toLocaleString()}`, 'reset');
    }

    log('\n📱 Check your WhatsApp to see the message!', 'cyan');
    log('\n📋 Message Preview:', 'yellow');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'yellow');
    
    console.log(`
🔔 ORDER CONFIRMATION

━━━━━━━━━━━━━━━━━━━━━━━━━
CUSTOMER DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━

Customer: ABC Industries Pvt Ltd
Contact Person: Rajesh Kumar

━━━━━━━━━━━━━━━━━━━━━━━━━
ORDER INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━

Order No: ORD-202512-00099
Order Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}

━━━━━━━━━━━━━━━━━━━━━━━━━
ITEMS ORDERED
━━━━━━━━━━━━━━━━━━━━━━━━━

1. Stel Shots-S330
   Qty: 5000 KG | Rate: ₹50.00/KG
   Amount: ₹2,50,000

2. Stel Shots-S390
   Qty: 3000 KG | Rate: ₹55.00/KG
   Amount: ₹1,65,000

3. Stel Shots-S460
   Qty: 2000 KG | Rate: ₹60.00/KG
   Amount: ₹1,20,000

━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL INVOICE VALUE
━━━━━━━━━━━━━━━━━━━━━━━━━

₹5,35,000.00

━━━━━━━━━━━━━━━━━━━━━━━━━
DELIVERY DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━

Estimated Dispatch: ${new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
Payment Terms: Advance Payment

Thank you for your order! 🙏

_STEEFE ERP - Automated Message_
    `);
    
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'yellow');

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Message: ${error.response.data.message}`, 'red');
    }
  }
}

testOrderConfirmation();

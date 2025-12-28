/**
 * WhatsApp Integration Test Script
 * 
 * This script demonstrates how to use the WhatsApp API endpoints
 * Run with: node scripts/testWhatsAppIntegration.js
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api/whatsapp';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkStatus() {
  try {
    log('\n📊 Checking WhatsApp Status...', 'cyan');
    const response = await axios.get(`${API_URL}/status`);
    const status = response.data;
    
    log('\nStatus:', 'yellow');
    log(`  Initialized: ${status.isInitialized ? '✅' : '❌'}`, status.isInitialized ? 'green' : 'red');
    log(`  Ready: ${status.isReady ? '✅' : '❌'}`, status.isReady ? 'green' : 'red');
    log(`  Has QR: ${status.hasQR ? '✅' : '❌'}`, status.hasQR ? 'yellow' : 'reset');
    
    return status;
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    return null;
  }
}

async function initialize() {
  try {
    log('\n🔄 Initializing WhatsApp client...', 'cyan');
    const response = await axios.post(`${API_URL}/initialize`);
    log(`✅ ${response.data.message}`, 'green');
    log('\n⏳ Waiting for QR code... (this may take 10-20 seconds)', 'yellow');
    log('💡 Open the WhatsApp Integration page in your browser to see the QR code', 'blue');
    log('   URL: http://localhost:5173/settings/whatsapp', 'blue');
    return true;
  } catch (error) {
    log(`❌ Error: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function sendTestMessage(phoneNumber) {
  try {
    log(`\n📱 Sending test message to ${phoneNumber}...`, 'cyan');
    const response = await axios.post(`${API_URL}/test`, {
      phoneNumber
    });
    log(`✅ ${response.data.message}`, 'green');
    log(`   Message ID: ${response.data.data.messageId}`, 'reset');
    return true;
  } catch (error) {
    log(`❌ Error: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function sendCustomMessage(phoneNumber, message) {
  try {
    log(`\n💬 Sending custom message to ${phoneNumber}...`, 'cyan');
    const response = await axios.post(`${API_URL}/send-message`, {
      phoneNumber,
      message
    });
    log(`✅ ${response.data.message}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Error: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function sendSampleProforma(phoneNumber) {
  try {
    log(`\n📄 Sending sample proforma invoice to ${phoneNumber}...`, 'cyan');
    
    const invoiceData = {
      invoice_no: 'ORD-TEST-001',
      invoice_date: new Date().toISOString(),
      customer_name: 'Test Customer',
      customer_address: '123 Test Street, Mumbai, Maharashtra',
      item_name: 'Stel Shots-S330',
      size_name: '4mm',
      quantity: 100,
      rate: 50,
      amount: 5000,
      gst_rate: 18,
      gst_amount: 900,
      total_amount: 5900,
      bank_name: 'HDFC Bank',
      account_number: '1234567890',
      ifsc_code: 'HDFC0001234'
    };
    
    const response = await axios.post(`${API_URL}/send-proforma`, {
      phoneNumber,
      invoiceData
    });
    
    log(`✅ ${response.data.message}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Error: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function sendSampleDispatch(phoneNumber) {
  try {
    log(`\n🚚 Sending sample dispatch notification to ${phoneNumber}...`, 'cyan');
    
    const dispatchData = {
      order_no: 'ORD-TEST-001',
      challan_no: 'CH-TEST-001',
      dispatch_date: new Date().toISOString(),
      item_name: 'Stel Shots-S330',
      bags_dispatched: 100,
      transporter_name: 'XYZ Logistics',
      vehicle_no: 'MH-12-AB-1234',
      lr_no: 'LR-12345'
    };
    
    const response = await axios.post(`${API_URL}/send-dispatch`, {
      phoneNumber,
      dispatchData
    });
    
    log(`✅ ${response.data.message}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Error: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function main() {
  log('\n╔════════════════════════════════════════════╗', 'cyan');
  log('║   WhatsApp Integration Test Suite         ║', 'cyan');
  log('╚════════════════════════════════════════════╝', 'cyan');
  
  // Check initial status
  let status = await checkStatus();
  
  // If not initialized, initialize it
  if (!status || !status.isInitialized) {
    const initialized = await initialize();
    if (!initialized) {
      log('\n❌ Failed to initialize. Please check if the server is running.', 'red');
      return;
    }
    
    log('\n⏳ Please scan the QR code in the browser and press Enter when ready...', 'yellow');
    log('   Then come back here and run this script again.', 'yellow');
    return;
  }
  
  // Check if ready
  if (!status.isReady) {
    log('\n⚠️  WhatsApp client is initialized but not ready yet.', 'yellow');
    log('   Please scan the QR code at: http://localhost:5173/settings/whatsapp', 'blue');
    log('   Then run this script again.', 'yellow');
    return;
  }
  
  log('\n✅ WhatsApp is ready! You can now send messages.', 'green');
  
  // Get phone number from command line argument
  const phoneNumber = process.argv[2];
  
  if (!phoneNumber) {
    log('\n❌ Please provide a phone number as argument', 'red');
    log('   Usage: node scripts/testWhatsAppIntegration.js 919876543210', 'yellow');
    log('   Format: Country code + number (no + sign)', 'yellow');
    return;
  }
  
  log(`\n📞 Test phone number: ${phoneNumber}`, 'cyan');
  
  // Interactive menu
  log('\n╔════════════════════════════════════════════╗', 'cyan');
  log('║   Available Tests                          ║', 'cyan');
  log('╠════════════════════════════════════════════╣', 'cyan');
  log('║   1. Send test message                     ║', 'cyan');
  log('║   2. Send custom message                   ║', 'cyan');
  log('║   3. Send sample proforma invoice          ║', 'cyan');
  log('║   4. Send sample dispatch notification     ║', 'cyan');
  log('║   5. Send all (demo)                       ║', 'cyan');
  log('╚════════════════════════════════════════════╝', 'cyan');
  
  const testType = process.argv[3] || '1';
  
  log(`\n🎯 Running test type: ${testType}`, 'blue');
  
  switch (testType) {
    case '1':
      await sendTestMessage(phoneNumber);
      break;
    
    case '2':
      const customMsg = process.argv[4] || 'Hello from STEEFE ERP! This is a custom message test.';
      await sendCustomMessage(phoneNumber, customMsg);
      break;
    
    case '3':
      await sendSampleProforma(phoneNumber);
      break;
    
    case '4':
      await sendSampleDispatch(phoneNumber);
      break;
    
    case '5':
      log('\n🎬 Running all tests (with 2-second delays)...', 'blue');
      await sendTestMessage(phoneNumber);
      await wait(2000);
      await sendSampleProforma(phoneNumber);
      await wait(2000);
      await sendSampleDispatch(phoneNumber);
      break;
    
    default:
      log(`\n❌ Invalid test type: ${testType}`, 'red');
  }
  
  log('\n✅ Test completed!', 'green');
  log('\n💡 Tips:', 'cyan');
  log('   - Check your WhatsApp to verify message delivery', 'reset');
  log('   - View status anytime: node scripts/testWhatsAppIntegration.js status', 'reset');
  log('   - Integration page: http://localhost:5173/settings/whatsapp', 'reset');
}

// Handle "status" command
if (process.argv[2] === 'status') {
  checkStatus().then(() => process.exit(0));
} else {
  main().catch(error => {
    log(`\n❌ Unexpected error: ${error.message}`, 'red');
    console.error(error);
  });
}

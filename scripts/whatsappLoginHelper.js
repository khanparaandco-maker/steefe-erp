/**
 * WhatsApp Troubleshooting & Login Helper
 * Run with: node scripts/whatsappLoginHelper.js
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3000/api/whatsapp';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkStatus() {
  try {
    const response = await axios.get(`${API_URL}/status`);
    return response.data;
  } catch (error) {
    log(`❌ Cannot connect to server: ${error.message}`, 'red');
    return null;
  }
}

async function checkSessionFolder() {
  const sessionPath = path.join(__dirname, '..', 'whatsapp-session');
  
  if (fs.existsSync(sessionPath)) {
    const files = fs.readdirSync(sessionPath);
    log(`\n📁 Session folder exists with ${files.length} files`, 'cyan');
    if (files.length > 0) {
      log('   Session files found - trying to use existing session', 'yellow');
      return true;
    } else {
      log('   Session folder is empty - fresh login needed', 'yellow');
      return false;
    }
  } else {
    log('\n📁 Session folder does not exist - will be created on first login', 'yellow');
    return false;
  }
}

async function destroySession() {
  try {
    log('\n🗑️  Destroying existing session...', 'yellow');
    await axios.post(`${API_URL}/destroy`);
    log('✅ Session destroyed', 'green');
    await wait(2000);
  } catch (error) {
    log(`⚠️  Could not destroy session: ${error.message}`, 'yellow');
  }
}

async function initialize() {
  try {
    log('\n🔄 Initializing WhatsApp client...', 'cyan');
    const response = await axios.post(`${API_URL}/initialize`);
    log('✅ Initialization started', 'green');
    log('⏳ Waiting for QR code (this takes 15-30 seconds)...', 'yellow');
    return true;
  } catch (error) {
    log(`❌ Initialization failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function monitorStatus() {
  log('\n👀 Monitoring status (will check every 3 seconds)...', 'cyan');
  log('   Press Ctrl+C to stop\n', 'yellow');
  
  let lastStatus = '';
  let qrShown = false;
  
  for (let i = 0; i < 40; i++) { // Monitor for 2 minutes max
    await wait(3000);
    
    const status = await checkStatus();
    if (!status) continue;
    
    const currentStatus = JSON.stringify(status);
    if (currentStatus !== lastStatus) {
      lastStatus = currentStatus;
      
      const timestamp = new Date().toLocaleTimeString();
      log(`[${timestamp}] Status Update:`, 'blue');
      log(`   Initialized: ${status.isInitialized ? '✅' : '❌'}`, status.isInitialized ? 'green' : 'red');
      log(`   Has QR: ${status.hasQR ? '✅' : '❌'}`, status.hasQR ? 'green' : 'red');
      log(`   Ready: ${status.isReady ? '✅' : '❌'}`, status.isReady ? 'green' : 'red');
      
      if (status.hasQR && !qrShown) {
        qrShown = true;
        log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
        log('📱 QR CODE IS READY!', 'green');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
        log('\nOpen this page in your browser:', 'yellow');
        log('👉 http://localhost:5173/settings/whatsapp', 'cyan');
        log('\nThen scan the QR code with your phone:', 'yellow');
        log('1. Open WhatsApp on your phone', 'reset');
        log('2. Tap Menu (⋮) or Settings', 'reset');
        log('3. Tap "Linked Devices"', 'reset');
        log('4. Tap "Link a Device"', 'reset');
        log('5. Scan the QR code shown in browser', 'reset');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');
      }
      
      if (status.isReady) {
        log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'green');
        log('🎉 SUCCESS! WhatsApp is connected and ready!', 'green');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'green');
        log('You can now:', 'cyan');
        log('✅ Send messages from Proforma Invoice page', 'green');
        log('✅ Receive dispatch notifications', 'green');
        log('✅ Test messages from WhatsApp settings', 'green');
        return true;
      }
    }
  }
  
  log('\n⏱️  Timeout reached. Status did not change to ready.', 'yellow');
  return false;
}

async function main() {
  log('\n╔════════════════════════════════════════════╗', 'cyan');
  log('║   WhatsApp Login Helper & Troubleshooter  ║', 'cyan');
  log('╚════════════════════════════════════════════╝\n', 'cyan');
  
  // Step 1: Check if server is running
  log('1️⃣  Checking server connection...', 'cyan');
  let status = await checkStatus();
  if (!status) {
    log('\n❌ Server is not responding!', 'red');
    log('\nPlease start the server first:', 'yellow');
    log('   npm start', 'cyan');
    return;
  }
  log('✅ Server is running', 'green');
  
  // Step 2: Check current status
  log('\n2️⃣  Current WhatsApp Status:', 'cyan');
  log(`   Initialized: ${status.isInitialized ? '✅' : '❌'}`, status.isInitialized ? 'green' : 'red');
  log(`   Has QR: ${status.hasQR ? '✅' : '❌'}`, status.hasQR ? 'green' : 'red');
  log(`   Ready: ${status.isReady ? '✅' : '❌'}`, status.isReady ? 'green' : 'red');
  
  if (status.isReady) {
    log('\n🎉 WhatsApp is already connected and ready!', 'green');
    log('No action needed. You can send messages now.', 'green');
    return;
  }
  
  // Step 3: Check session files
  log('\n3️⃣  Checking session files...', 'cyan');
  const hasSession = await checkSessionFolder();
  
  // Step 4: Decide action
  if (status.isInitialized && !status.isReady) {
    log('\n4️⃣  Client is initialized but not connected.', 'yellow');
    
    if (hasSession) {
      log('\n❓ What would you like to do?', 'cyan');
      log('   A) Wait and monitor (maybe session is loading)', 'yellow');
      log('   B) Destroy session and start fresh', 'yellow');
      log('\nRecommendation: Try option A first', 'blue');
      
      // For automation, let's monitor first
      log('\n📊 Starting monitoring...', 'cyan');
      await monitorStatus();
      
    } else {
      log('\n💡 No session found. Need to scan QR code.', 'yellow');
      log('   Destroying and reinitializing...', 'yellow');
      await destroySession();
      await initialize();
      await monitorStatus();
    }
    
  } else if (!status.isInitialized) {
    log('\n4️⃣  Client not initialized. Initializing now...', 'cyan');
    await initialize();
    await monitorStatus();
  }
  
  // Final status check
  log('\n📊 Final Status Check:', 'cyan');
  status = await checkStatus();
  if (status) {
    log(`   Initialized: ${status.isInitialized ? '✅' : '❌'}`, status.isInitialized ? 'green' : 'red');
    log(`   Ready: ${status.isReady ? '✅' : '❌'}`, status.isReady ? 'green' : 'red');
    
    if (!status.isReady) {
      log('\n💡 Troubleshooting Tips:', 'yellow');
      log('1. Make sure QR code is displayed in browser:', 'reset');
      log('   http://localhost:5173/settings/whatsapp', 'cyan');
      log('2. Check browser console (F12) for errors', 'reset');
      log('3. Verify phone has internet connection', 'reset');
      log('4. Try clearing whatsapp-session folder and restart', 'reset');
      log('5. Check server logs in the terminal window', 'reset');
    }
  }
  
  log('\n✅ Helper script complete', 'green');
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  log('\n\n👋 Monitoring stopped by user', 'yellow');
  process.exit(0);
});

main().catch(error => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

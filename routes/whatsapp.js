const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappService');

// Store connected clients for SSE (Server-Sent Events)
let sseClients = [];

// Initialize WhatsApp client
router.post('/initialize', (req, res) => {
  try {
    whatsappService.initialize();
    res.json({ 
      success: true, 
      message: 'WhatsApp client initialization started',
      status: whatsappService.getStatus()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get current status
router.get('/status', (req, res) => {
  const status = whatsappService.getStatus();
  res.json({
    success: true,
    ...status
  });
});

// SSE endpoint for real-time QR code and status updates
router.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial status
  res.write(`data: ${JSON.stringify({ 
    type: 'status', 
    data: whatsappService.getStatus() 
  })}\n\n`);

  // Add client to list
  sseClients.push(res);

  // Remove client on disconnect
  req.on('close', () => {
    sseClients = sseClients.filter(client => client !== res);
  });
});

// Event listeners for WhatsApp service
whatsappService.on('qr', (data) => {
  console.log('Broadcasting QR code to clients');
  sseClients.forEach(client => {
    client.write(`data: ${JSON.stringify({ 
      type: 'qr', 
      data 
    })}\n\n`);
  });
});

whatsappService.on('ready', () => {
  console.log('Broadcasting ready status to clients');
  sseClients.forEach(client => {
    client.write(`data: ${JSON.stringify({ 
      type: 'ready', 
      data: { isReady: true } 
    })}\n\n`);
  });
});

whatsappService.on('authenticated', () => {
  console.log('Broadcasting authenticated status to clients');
  sseClients.forEach(client => {
    client.write(`data: ${JSON.stringify({ 
      type: 'authenticated', 
      data: { authenticated: true } 
    })}\n\n`);
  });
});

whatsappService.on('disconnected', (reason) => {
  console.log('Broadcasting disconnected status to clients');
  sseClients.forEach(client => {
    client.write(`data: ${JSON.stringify({ 
      type: 'disconnected', 
      data: { reason } 
    })}\n\n`);
  });
});

whatsappService.on('auth_failure', (msg) => {
  console.log('Broadcasting auth failure to clients');
  sseClients.forEach(client => {
    client.write(`data: ${JSON.stringify({ 
      type: 'auth_failure', 
      data: { message: msg } 
    })}\n\n`);
  });
});

// Send a text message
router.post('/send-message', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number and message are required' 
      });
    }

    const result = await whatsappService.sendMessage(phoneNumber, message);
    res.json({ 
      success: true, 
      message: 'Message sent successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Send order confirmation
router.post('/send-order', async (req, res) => {
  try {
    const { phoneNumber, orderData, pdfPath } = req.body;

    if (!phoneNumber || !orderData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number and order data are required' 
      });
    }

    let result;
    if (pdfPath) {
      // Send with PDF attachment
      result = await whatsappService.sendOrderDetailsWithPDF(phoneNumber, orderData, pdfPath);
    } else {
      // Send text only
      result = await whatsappService.sendOrderDetails(phoneNumber, orderData);
    }
    
    res.json({ 
      success: true, 
      message: 'Order confirmation sent successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Send proforma invoice
router.post('/send-proforma', async (req, res) => {
  try {
    const { phoneNumber, invoiceData, pdfPath } = req.body;

    if (!phoneNumber || !invoiceData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number and invoice data are required' 
      });
    }

    let result;
    if (pdfPath) {
      // Send with PDF attachment
      result = await whatsappService.sendProformaInvoiceWithPDF(phoneNumber, invoiceData, pdfPath);
    } else {
      // Send text only
      result = await whatsappService.sendProformaInvoice(phoneNumber, invoiceData);
    }
    
    res.json({ 
      success: true, 
      message: 'Proforma invoice sent successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Send dispatch notification
router.post('/send-dispatch', async (req, res) => {
  try {
    const { phoneNumber, dispatchData } = req.body;

    if (!phoneNumber || !dispatchData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number and dispatch data are required' 
      });
    }

    const result = await whatsappService.sendDispatchNotification(phoneNumber, dispatchData);
    res.json({ 
      success: true, 
      message: 'Dispatch notification sent successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Test connection with a message to yourself
router.post('/test', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number is required' 
      });
    }

    const testMessage = `🧪 *Test Message from STEEFE ERP*\n\nWhatsApp integration is working correctly!\n\nTimestamp: ${new Date().toLocaleString('en-IN')}`;
    
    const result = await whatsappService.sendMessage(phoneNumber, testMessage);
    res.json({ 
      success: true, 
      message: 'Test message sent successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Logout from WhatsApp
router.post('/logout', async (req, res) => {
  try {
    await whatsappService.logout();
    res.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Destroy client (remove session)
router.post('/destroy', async (req, res) => {
  try {
    await whatsappService.destroy();
    res.json({ 
      success: true, 
      message: 'WhatsApp client destroyed successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const EventEmitter = require('events');

class WhatsAppService extends EventEmitter {
  constructor() {
    super();
    this.client = null;
    this.isReady = false;
    this.qrCode = null;
    this.sessionData = null;
  }

  initialize() {
    if (this.client) {
      console.log('WhatsApp client already initialized');
      return;
    }

    console.log('Initializing WhatsApp client...');
    
    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: 'steefe-erp',
        dataPath: './whatsapp-session'
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      }
    });

    // QR Code event - user needs to scan this
    this.client.on('qr', async (qr) => {
      console.log('QR Code received, generating image...');
      this.qrCode = qr;
      
      // Generate base64 image for frontend
      try {
        const qrImageUrl = await qrcode.toDataURL(qr);
        this.emit('qr', { qr, qrImageUrl });
      } catch (err) {
        console.error('Error generating QR code:', err);
        this.emit('qr', { qr, qrImageUrl: null });
      }
    });

    // Authentication successful
    this.client.on('authenticated', (session) => {
      console.log('WhatsApp authenticated successfully');
      this.sessionData = session;
      this.emit('authenticated');
    });

    // Authentication failed
    this.client.on('auth_failure', (msg) => {
      console.error('WhatsApp authentication failed:', msg);
      this.isReady = false;
      this.emit('auth_failure', msg);
    });

    // Client is ready
    this.client.on('ready', () => {
      console.log('WhatsApp client is ready!');
      this.isReady = true;
      this.qrCode = null;
      this.emit('ready');
    });

    // Client disconnected
    this.client.on('disconnected', (reason) => {
      console.log('WhatsApp client disconnected:', reason);
      this.isReady = false;
      this.qrCode = null;
      this.emit('disconnected', reason);
    });

    // Initialize the client
    this.client.initialize().catch(err => {
      console.error('Error initializing WhatsApp client:', err);
      this.emit('error', err);
    });
  }

  async sendMessage(phoneNumber, message) {
    if (!this.isReady) {
      throw new Error('WhatsApp client is not ready. Please scan QR code first.');
    }

    try {
      // Format phone number (remove spaces, dashes, etc.)
      const formattedNumber = phoneNumber.replace(/[^\d]/g, '');
      
      // Add country code if not present (assuming India +91)
      let chatId = formattedNumber;
      if (!formattedNumber.startsWith('91') && formattedNumber.length === 10) {
        chatId = '91' + formattedNumber;
      }
      
      // WhatsApp format: number@c.us
      chatId = chatId + '@c.us';

      console.log(`Sending message to ${chatId}`);
      const result = await this.client.sendMessage(chatId, message);
      
      return {
        success: true,
        messageId: result.id.id,
        timestamp: result.timestamp,
        to: phoneNumber
      };
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  async sendMessageWithMedia(phoneNumber, message, mediaPath, caption = '') {
    if (!this.isReady) {
      throw new Error('WhatsApp client is not ready. Please scan QR code first.');
    }

    try {
      const MessageMedia = require('whatsapp-web.js').MessageMedia;
      
      // Format phone number
      const formattedNumber = phoneNumber.replace(/[^\d]/g, '');
      let chatId = formattedNumber;
      if (!formattedNumber.startsWith('91') && formattedNumber.length === 10) {
        chatId = '91' + formattedNumber;
      }
      chatId = chatId + '@c.us';

      console.log(`Sending message with media to ${chatId}`);
      
      // Send text message first
      await this.client.sendMessage(chatId, message);
      
      // Then send media file
      const media = MessageMedia.fromFilePath(mediaPath);
      const result = await this.client.sendMessage(chatId, media, { caption });
      
      return {
        success: true,
        messageId: result.id.id,
        timestamp: result.timestamp,
        to: phoneNumber
      };
    } catch (error) {
      console.error('Error sending WhatsApp message with media:', error);
      throw new Error(`Failed to send message with media: ${error.message}`);
    }
  }

  async sendOrderDetails(phoneNumber, orderData) {
    // Format items list
    let itemsList = '';
    if (orderData.items && orderData.items.length > 0) {
      orderData.items.forEach((item, index) => {
        itemsList += `${index + 1}. *${item.item_name}*\n`;
        itemsList += `   Qty: ${item.quantity} ${item.uom || 'KG'} | Rate: ₹${item.rate}/${item.uom || 'KG'}\n`;
        itemsList += `   Amount: ₹${parseFloat(item.amount).toLocaleString('en-IN')}\n\n`;
      });
    }

    const message = `
🔔 *ORDER CONFIRMATION*

━━━━━━━━━━━━━━━━━━━━━━━━━
*CUSTOMER DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━

Customer: *${orderData.customer_name}*
Contact Person: *${orderData.contact_person || orderData.customer_name}*

━━━━━━━━━━━━━━━━━━━━━━━━━
*ORDER INFORMATION*
━━━━━━━━━━━━━━━━━━━━━━━━━

Order No: *${orderData.order_no}*
Order Date: *${new Date(orderData.order_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}*

━━━━━━━━━━━━━━━━━━━━━━━━━
*ITEMS ORDERED*
━━━━━━━━━━━━━━━━━━━━━━━━━

${itemsList}
━━━━━━━━━━━━━━━━━━━━━━━━━
*TOTAL INVOICE VALUE*
━━━━━━━━━━━━━━━━━━━━━━━━━

₹${parseFloat(orderData.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

━━━━━━━━━━━━━━━━━━━━━━━━━
*DELIVERY DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━

Estimated Dispatch: *${orderData.estimated_delivery_date ? new Date(orderData.estimated_delivery_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'As agreed'}*
Payment Terms: ${orderData.payment_condition || 'As per agreement'}

Thank you for your order! 🙏

_STEEFE ERP - Automated Message_
    `.trim();

    return await this.sendMessage(phoneNumber, message);
  }

  async sendOrderDetailsWithPDF(phoneNumber, orderData, pdfPath) {
    // Format items list
    let itemsList = '';
    if (orderData.items && orderData.items.length > 0) {
      orderData.items.forEach((item, index) => {
        itemsList += `${index + 1}. *${item.item_name}*\n`;
        itemsList += `   Qty: ${item.quantity} ${item.uom || 'KG'} | Rate: ₹${item.rate}/${item.uom || 'KG'}\n`;
        itemsList += `   Amount: ₹${parseFloat(item.amount).toLocaleString('en-IN')}\n\n`;
      });
    }

    const message = `
🔔 *ORDER CONFIRMATION*

━━━━━━━━━━━━━━━━━━━━━━━━━
*CUSTOMER DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━

Customer: *${orderData.customer_name}*
Contact Person: *${orderData.contact_person || orderData.customer_name}*

━━━━━━━━━━━━━━━━━━━━━━━━━
*ORDER INFORMATION*
━━━━━━━━━━━━━━━━━━━━━━━━━

Order No: *${orderData.order_no}*
Order Date: *${new Date(orderData.order_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}*

━━━━━━━━━━━━━━━━━━━━━━━━━
*ITEMS ORDERED*
━━━━━━━━━━━━━━━━━━━━━━━━━

${itemsList}
━━━━━━━━━━━━━━━━━━━━━━━━━
*TOTAL INVOICE VALUE*
━━━━━━━━━━━━━━━━━━━━━━━━━

₹${parseFloat(orderData.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

━━━━━━━━━━━━━━━━━━━━━━━━━
*DELIVERY DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━

Estimated Dispatch: *${orderData.estimated_delivery_date ? new Date(orderData.estimated_delivery_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'As agreed'}*
Payment Terms: ${orderData.payment_condition || 'As per agreement'}

📄 *Please find the order confirmation PDF attached below*

Thank you for your order! 🙏

_STEEFE ERP - Automated Message_
    `.trim();

    return await this.sendMessageWithMedia(phoneNumber, message, pdfPath, `Order Confirmation - ${orderData.order_no}`);
  }

  async sendProformaInvoice(phoneNumber, invoiceData) {
    // Format items list
    let itemsList = '';
    if (invoiceData.items && invoiceData.items.length > 0) {
      invoiceData.items.forEach((item, index) => {
        itemsList += `${index + 1}. *${item.item_name}* - ${item.size_name}\n`;
        itemsList += `   Qty: ${item.quantity} bags | Rate: ₹${item.rate}/bag\n`;
        itemsList += `   Amount: ₹${parseFloat(item.amount).toLocaleString('en-IN')}\n\n`;
      });
    }

    const message = `
📄 *PROFORMA INVOICE*

━━━━━━━━━━━━━━━━━━━━━━━━━
*INVOICE DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━

Invoice No: *${invoiceData.invoice_no}*
Date: *${new Date(invoiceData.invoice_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}*

━━━━━━━━━━━━━━━━━━━━━━━━━
*CUSTOMER DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━

Customer: *${invoiceData.customer_name}*
${invoiceData.customer_address ? 'Address: ' + invoiceData.customer_address : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━
*ITEMS*
━━━━━━━━━━━━━━━━━━━━━━━━━

${itemsList}
━━━━━━━━━━━━━━━━━━━━━━━━━
*TOTAL AMOUNT*
━━━━━━━━━━━━━━━━━━━━━━━━━

₹${parseFloat(invoiceData.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

━━━━━━━━━━━━━━━━━━━━━━━━━
*BANK DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━

Bank: ${invoiceData.bank_name}
A/c No: ${invoiceData.account_number}
IFSC: ${invoiceData.ifsc_code}

Thank you for your business! 🙏

_STEEFE ERP - Automated Message_
    `.trim();

    return await this.sendMessage(phoneNumber, message);
  }

  async sendProformaInvoiceWithPDF(phoneNumber, invoiceData, pdfPath) {
    // Format items list
    let itemsList = '';
    if (invoiceData.items && invoiceData.items.length > 0) {
      invoiceData.items.forEach((item, index) => {
        itemsList += `${index + 1}. *${item.item_name}* - ${item.size_name}\n`;
        itemsList += `   Qty: ${item.quantity} bags | Rate: ₹${item.rate}/bag\n`;
        itemsList += `   Amount: ₹${parseFloat(item.amount).toLocaleString('en-IN')}\n\n`;
      });
    }

    const message = `
📄 *PROFORMA INVOICE*

━━━━━━━━━━━━━━━━━━━━━━━━━
*INVOICE DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━

Invoice No: *${invoiceData.invoice_no}*
Date: *${new Date(invoiceData.invoice_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}*

━━━━━━━━━━━━━━━━━━━━━━━━━
*CUSTOMER DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━

Customer: *${invoiceData.customer_name}*
${invoiceData.customer_address ? 'Address: ' + invoiceData.customer_address : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━
*ITEMS*
━━━━━━━━━━━━━━━━━━━━━━━━━

${itemsList}
━━━━━━━━━━━━━━━━━━━━━━━━━
*TOTAL AMOUNT*
━━━━━━━━━━━━━━━━━━━━━━━━━

₹${parseFloat(invoiceData.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

━━━━━━━━━━━━━━━━━━━━━━━━━
*BANK DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━

Bank: ${invoiceData.bank_name}
A/c No: ${invoiceData.account_number}
IFSC: ${invoiceData.ifsc_code}

Thank you for your business! 🙏

_STEEFE ERP - Automated Message_
    `.trim();

    return await this.sendMessageWithMedia(phoneNumber, message, pdfPath, `Proforma Invoice - ${invoiceData.invoice_no}`);
  }

  async sendDispatchNotification(phoneNumber, dispatchData) {
    const message = `
🚚 *Dispatch Notification*

*Order No:* ${dispatchData.order_no}
*Challan No:* ${dispatchData.challan_no}
*Date:* ${new Date(dispatchData.dispatch_date).toLocaleDateString('en-IN')}

*Item:* ${dispatchData.item_name}
*Quantity Dispatched:* ${dispatchData.bags_dispatched} bags

*Transporter:* ${dispatchData.transporter_name || 'N/A'}
*Vehicle No:* ${dispatchData.vehicle_no || 'N/A'}
*LR No:* ${dispatchData.lr_no || 'N/A'}

Your order is on the way!

_STEEFE ERP - Automated Message_
    `.trim();

    return await this.sendMessage(phoneNumber, message);
  }

  getStatus() {
    return {
      isReady: this.isReady,
      hasQR: !!this.qrCode,
      isInitialized: !!this.client
    };
  }

  async logout() {
    if (this.client) {
      await this.client.logout();
      this.client = null;  // Reset client so initialize() can create a new one
      this.isReady = false;
      this.qrCode = null;
      this.emit('logout');
    }
  }

  async destroy() {
    if (this.client) {
      await this.client.destroy();
      this.client = null;
      this.isReady = false;
      this.qrCode = null;
      this.emit('destroyed');
    }
  }
}

// Singleton instance
const whatsappService = new WhatsAppService();

module.exports = whatsappService;

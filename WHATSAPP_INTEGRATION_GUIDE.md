# WhatsApp Web Integration Guide

## Overview
Your STEEFE ERP now has WhatsApp Web integration using `whatsapp-web.js`. This allows you to send automated messages to customers using your personal or business WhatsApp account.

## Features Implemented

### 1. WhatsApp Service (`services/whatsappService.js`)
- QR code authentication
- Session persistence (stays logged in after restart)
- Connection status monitoring
- Automated message templates for:
  - Order confirmations
  - Proforma invoices
  - Dispatch notifications
  - Custom messages

### 2. API Routes (`routes/whatsapp.js`)
**Endpoints:**
- `POST /api/whatsapp/initialize` - Initialize WhatsApp client
- `GET /api/whatsapp/status` - Get connection status
- `GET /api/whatsapp/events` - SSE stream for real-time updates (QR code, status)
- `POST /api/whatsapp/send-message` - Send custom message
- `POST /api/whatsapp/send-order` - Send order confirmation
- `POST /api/whatsapp/send-proforma` - Send proforma invoice
- `POST /api/whatsapp/send-dispatch` - Send dispatch notification
- `POST /api/whatsapp/test` - Send test message
- `POST /api/whatsapp/logout` - Logout from WhatsApp
- `POST /api/whatsapp/destroy` - Remove session completely

### 3. Frontend Integration

#### WhatsApp Settings Page (`/settings/whatsapp`)
- QR code display for authentication
- Real-time connection status
- Test message functionality
- Session management (logout/reconnect)

#### Proforma Invoice Page
- New "Send via WhatsApp" button
- Automatically sends formatted invoice to customer
- Includes all order details, GST, bank details

#### Dispatch Details Page
- Automatic WhatsApp notification after dispatch creation
- Sends transporter details, LR number, quantity dispatched

## How to Use

### Step 1: Start the Server
```bash
npm start
```

### Step 2: Initialize WhatsApp
1. Navigate to **Settings → WhatsApp Integration** in your ERP
2. Click **"Initialize WhatsApp"** button
3. Wait for QR code to appear (takes 10-20 seconds)

### Step 3: Scan QR Code
1. Open WhatsApp on your phone
2. Tap **Menu (⋮)** or **Settings**
3. Tap **"Linked Devices"**
4. Tap **"Link a Device"**
5. Scan the QR code shown in your ERP

### Step 4: You're Connected!
Once connected:
- Green checkmark appears next to "WhatsApp Ready"
- Session is saved - you won't need to scan QR again after restart
- You can now send messages

### Step 5: Test It
1. Enter a phone number (with country code, e.g., 919876543210)
2. Click **"Send Test Message"**
3. Check your WhatsApp - you should receive a test message

## Automatic Notifications

### Proforma Invoice
When viewing any order's proforma invoice:
- Click **"Send via WhatsApp"** button
- Invoice details sent automatically to customer's mobile number
- Includes: Order no, items, quantities, GST, total amount, bank details

### Dispatch Notification
When creating a new dispatch:
- Notification sent automatically after successful dispatch creation
- Only if customer has mobile number in their profile
- Includes: Order no, challan no, items dispatched, transporter, LR number

## Message Templates

### Order Confirmation
```
🔔 *New Order Confirmation*

*Order No:* ORD-001
*Date:* 07/12/2025

*Customer:* ABC Industries
*Item:* Stel Shots-S330 (4mm)
*Quantity:* 100 bags
*Rate:* ₹50/bag
*Total Amount:* ₹5,000

*Payment Terms:* 30 days
*Delivery:* Ex-Works

Thank you for your order!

_STEEFE ERP - Automated Message_
```

### Proforma Invoice
```
📄 *Proforma Invoice*

*Invoice No:* ORD-001
*Date:* 07/12/2025

*Customer:*
ABC Industries
123 Main Street, Mumbai

*Item Details:*
Stel Shots-S330 - 4mm
Quantity: 100 bags
Rate: ₹50/bag
Amount: ₹5,000

*GST (18%):* ₹900
*Total Amount:* ₹5,900

*Bank Details:*
HDFC Bank
A/c: 1234567890
IFSC: HDFC0001234

_STEEFE ERP - Automated Message_
```

### Dispatch Notification
```
🚚 *Dispatch Notification*

*Order No:* ORD-001
*Challan No:* CH-001
*Date:* 07/12/2025

*Item:* Stel Shots-S330
*Quantity Dispatched:* 100 bags

*Transporter:* XYZ Logistics
*Vehicle No:* MH-12-AB-1234
*LR No:* LR-12345

Your order is on the way!

_STEEFE ERP - Automated Message_
```

## Phone Number Format

**Important:** Phone numbers must include country code without `+` sign.

Examples:
- ✅ India: `919876543210` (91 + 10-digit number)
- ✅ USA: `14155552671` (1 + 10-digit number)
- ❌ Wrong: `+919876543210` (don't include +)
- ❌ Wrong: `9876543210` (missing country code)

## Session Management

### Session Storage
- Sessions are stored in `./whatsapp-session/` folder
- This folder is auto-created on first initialization
- Contains authentication credentials (encrypted by WhatsApp)

### Logout
- Click "Logout" button in WhatsApp settings page
- This logs out from WhatsApp Web
- Session files remain but are invalidated
- You'll need to scan QR code again to reconnect

### Destroy Session
- Use if you want to completely remove session
- Deletes all session files
- Fresh start - must scan QR code again

## Troubleshooting

### QR Code Not Appearing
1. Check if server is running
2. Wait 20-30 seconds - it takes time to initialize
3. Check browser console for errors
4. Try refreshing the page

### "WhatsApp client is not ready"
- This means you haven't scanned the QR code yet
- Or your session expired/logged out
- Click "Initialize WhatsApp" and scan QR code again

### Message Not Delivered
1. Check if WhatsApp is ready (green checkmark)
2. Verify phone number format (with country code, no +)
3. Make sure your phone has internet connection
4. Check if the number is on WhatsApp

### Connection Lost
- If your phone goes offline, messages will fail
- If you logout from WhatsApp app, connection will break
- Re-scan QR code to reconnect

## Technical Details

### Dependencies Added
```json
{
  "whatsapp-web.js": "^1.23.0",
  "qrcode-terminal": "^0.12.0",
  "qrcode": "^1.5.3"
}
```

### Architecture
- **Backend Service:** Singleton pattern for WhatsApp client
- **Real-time Updates:** Server-Sent Events (SSE) for QR code and status
- **Authentication:** Local authentication strategy (saves session locally)
- **Message Queue:** None (sends immediately) - can be added if needed

### Security Considerations
- Session files contain encrypted WhatsApp credentials
- Keep `whatsapp-session/` folder secure
- Add to `.gitignore` to avoid committing sessions
- Only authorized users should access WhatsApp settings page

### Performance
- Session initialization: 10-20 seconds
- Message sending: 1-3 seconds
- QR code generation: Instant
- Session persistence: Automatic (no re-login needed)

## Best Practices

1. **Keep Phone Online:** Your phone must have internet for messages to send
2. **Test First:** Always test with your own number before customer messages
3. **Monitor Status:** Check connection status before sending bulk messages
4. **Backup Sessions:** Keep backup of `whatsapp-session/` folder
5. **Rate Limiting:** WhatsApp may block if you send too many messages quickly

## Future Enhancements

Possible additions:
- [ ] Bulk message sending with queue
- [ ] Message templates management
- [ ] Read receipts tracking
- [ ] Media file sending (PDFs, images)
- [ ] Group messaging
- [ ] Scheduled messages
- [ ] Message history/logs
- [ ] WhatsApp Business API integration (for larger scale)

## Support

For issues with:
- **whatsapp-web.js:** Check [GitHub repo](https://github.com/pedroslopez/whatsapp-web.js)
- **Integration issues:** Check server logs and browser console
- **WhatsApp blocking:** Wait 24 hours, reduce message frequency

## Limitations

- Uses WhatsApp Web protocol (not Business API)
- Requires phone to be online
- May have rate limits from WhatsApp
- Cannot send to numbers not on WhatsApp
- No guaranteed delivery (depends on WhatsApp)

---

**Note:** This integration is free and uses your personal/business WhatsApp account. For enterprise-level features, consider WhatsApp Business API.

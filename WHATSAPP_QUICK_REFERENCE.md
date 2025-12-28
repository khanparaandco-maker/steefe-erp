# WhatsApp Integration - Quick Reference

## 🚀 Quick Start (3 Steps)

### 1. Start Server
```bash
npm start
```

### 2. Open Browser & Initialize
- Navigate to: **Settings → WhatsApp Integration**
- Click: **"Initialize WhatsApp"**
- Wait 10-20 seconds for QR code

### 3. Scan QR Code
- Open WhatsApp on phone → **Settings** → **Linked Devices** → **Link a Device**
- Scan the QR code shown in browser
- ✅ Done! WhatsApp is ready

---

## 📱 Phone Number Format

**Always use:** `[country code][number]` (no + sign)

Examples:
- ✅ India: `919876543210`
- ✅ USA: `14155552671`
- ❌ Wrong: `+919876543210` (has +)
- ❌ Wrong: `9876543210` (no country code)

---

## 🎯 How to Send Messages

### From Proforma Invoice Page
1. Open any order → **Proforma Invoice**
2. Click **"Send via WhatsApp"** button
3. Invoice automatically sent to customer's mobile

### From Dispatch Page
- Notification sent **automatically** after dispatch creation
- Only if customer has mobile number in profile
- No action needed - happens in background

### Custom Message (Test)
1. Go to **Settings → WhatsApp Integration**
2. Enter phone number
3. Type custom message (optional)
4. Click **"Send Test Message"** or **"Send Custom Message"**

---

## 📝 API Endpoints Reference

### Check Status
```bash
GET /api/whatsapp/status
```

### Initialize Client
```bash
POST /api/whatsapp/initialize
```

### Send Custom Message
```bash
POST /api/whatsapp/send-message
Body: { "phoneNumber": "919876543210", "message": "Your text" }
```

### Send Proforma Invoice
```bash
POST /api/whatsapp/send-proforma
Body: { "phoneNumber": "919876543210", "invoiceData": {...} }
```

### Send Dispatch Notification
```bash
POST /api/whatsapp/send-dispatch
Body: { "phoneNumber": "919876543210", "dispatchData": {...} }
```

### Send Test Message
```bash
POST /api/whatsapp/test
Body: { "phoneNumber": "919876543210" }
```

### Logout
```bash
POST /api/whatsapp/logout
```

---

## 🧪 Testing Commands

### Check Status
```bash
node scripts/testWhatsAppIntegration.js status
```

### Send Test Message
```bash
node scripts/testWhatsAppIntegration.js 919876543210 1
```

### Send Sample Proforma
```bash
node scripts/testWhatsAppIntegration.js 919876543210 3
```

### Send Sample Dispatch
```bash
node scripts/testWhatsAppIntegration.js 919876543210 4
```

### Run All Tests
```bash
node scripts/testWhatsAppIntegration.js 919876543210 5
```

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| QR code not appearing | Wait 20-30 seconds, refresh page |
| "Client not ready" error | Scan QR code first in Settings page |
| Message not delivered | Check phone number format (country code, no +) |
| Connection lost | Phone went offline - reconnect phone to internet |
| Session expired | Click "Initialize" and scan QR again |

---

## ✅ Status Indicators

| Indicator | Meaning |
|-----------|---------|
| ✅ Client Initialized | WhatsApp client started |
| ✅ WhatsApp Ready | Authenticated & ready to send |
| ❌ Not Ready | Need to scan QR code |
| QR Code shown | Waiting for phone scan |

---

## 📂 Files Created

### Backend
- `services/whatsappService.js` - Core WhatsApp service
- `routes/whatsapp.js` - API endpoints
- `scripts/testWhatsAppIntegration.js` - Testing script

### Frontend
- `frontend/src/pages/settings/WhatsappIntegration.jsx` - Settings page with QR
- Updated: `ProformaInvoice.jsx` - Added WhatsApp button
- Updated: `DispatchDetails.jsx` - Auto-send notification

### Documentation
- `WHATSAPP_INTEGRATION_GUIDE.md` - Complete guide
- `WHATSAPP_QUICK_REFERENCE.md` - This file

### Session Data
- `whatsapp-session/` - Auto-created, stores auth (in .gitignore)

---

## 💡 Pro Tips

1. **Session Persistence**: Once connected, stays logged in even after server restart
2. **Phone Must Be Online**: Your phone needs internet for messages to send
3. **Test First**: Always test with your own number before customer messages
4. **Rate Limiting**: Don't send too many messages quickly (WhatsApp may block)
5. **Customer Mobile Required**: Add mobile numbers to customer profiles for auto-notifications

---

## 🎨 Message Examples

### Test Message
```
🧪 Test Message from STEEFE ERP
WhatsApp integration is working correctly!
Timestamp: 07/12/2025, 10:30:45 AM
```

### Proforma Invoice
```
📄 Proforma Invoice
Invoice No: ORD-001
Date: 07/12/2025
Customer: ABC Industries
Item: Stel Shots-S330 - 4mm
Quantity: 100 bags
Total: ₹5,900
Bank: HDFC Bank (HDFC0001234)
_STEEFE ERP - Automated Message_
```

### Dispatch Notification
```
🚚 Dispatch Notification
Order: ORD-001
Challan: CH-001
Item: Stel Shots-S330
Qty: 100 bags
Transporter: XYZ Logistics
LR No: LR-12345
Your order is on the way!
_STEEFE ERP - Automated Message_
```

---

## 🔐 Security Notes

- Session files are encrypted by WhatsApp
- `whatsapp-session/` folder is in .gitignore
- Only authorized users should access Settings page
- Keep your phone secure (it's the authentication device)

---

## 📞 Support

**Integration Issues:**
- Check server logs in terminal
- Check browser console (F12)
- Verify phone has internet connection
- Try logging out and reconnecting

**WhatsApp Blocking:**
- Reduce message frequency
- Wait 24 hours if blocked
- Use real WhatsApp Business account for higher limits

**Technical Help:**
- WhatsApp Web.js: https://github.com/pedroslopez/whatsapp-web.js
- Complete guide: `WHATSAPP_INTEGRATION_GUIDE.md`

---

**Last Updated:** December 7, 2025  
**Integration:** whatsapp-web.js v1.23.0  
**Status:** ✅ Production Ready

# Quick Start Guide - SteelMelt ERP

## 🚀 5-Minute Setup & Test

### Step 1: Install & Setup (2 minutes)
```powershell
# Navigate to project
cd "d:\STEEFE ERP"

# Install dependencies
npm install

# Copy environment file
Copy-Item .env.example .env

# Edit .env and set your PostgreSQL password
# notepad .env
```

### Step 2: Initialize Database (1 minute)
```powershell
# Create database in PostgreSQL
# Open PostgreSQL command line or pgAdmin and run:
# CREATE DATABASE steelmelt_erp;

# Run initialization script
npm run init-db
```

### Step 3: Start Server (30 seconds)
```powershell
# Start in development mode
npm run dev

# Server will start at http://localhost:3000
# You should see: "SteelMelt ERP Server running on port 3000"
```

### Step 4: Test Authentication (2 minutes)

**Test 1: Login with Admin Account**
```powershell
# Login to get JWT token
$loginBody = @{
    username = "admin"
    password = "Admin@123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $loginResponse.data.token

Write-Host "Login successful! Token: $token"
Write-Host "User: $($loginResponse.data.user.full_name)"
Write-Host "Role: $($loginResponse.data.user.role_name)"
```

**Expected Output:**
- Token: JWT token string
- User: Administrator
- Role: Super Admin

**Test 2: Get Current User Info**
```powershell
# Use token to get current user info
$headers = @{
    "Authorization" = "Bearer $token"
}

$meResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/me" -Method GET -Headers $headers
$meResponse.data | ConvertTo-Json -Depth 3
```

**Expected:** Shows user details with all permissions

### Step 5: Test Basic APIs (2 minutes)

**Test 1: Health Check**
```powershell
curl http://localhost:3000/health
```

**Test 2: Get Categories (Should show 3 sample categories)**
```powershell
curl http://localhost:3000/api/categories
```

**Test 3: Get UOMs (Should show 4 sample UOMs)**
```powershell
curl http://localhost:3000/api/uom
```

**Test 4: Get GST Rates (Should show 3 sample rates)**
```powershell
curl http://localhost:3000/api/gst-rates
```

---

## 📝 Complete Test Workflow (15 minutes)

### Part 1: Create Master Data (5 minutes)

**1. Create Customer (Same State for CGST+SGST)**
```powershell
$body = @{
    name = "ABC Manufacturing Ltd"
    address_line1 = "789 Industrial Area"
    city = "Pune"
    state = "Maharashtra"
    gstn = "27ABCDE5678F1G2"
    contact_person = "Purchase Manager"
    mobile = "9876543210"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/customers" -Method POST -Body $body -ContentType "application/json"
```

**2. Create Customer (Different State for IGST)**
```powershell
$body = @{
    name = "XYZ Industries Pvt Ltd"
    address_line1 = "321 Factory Lane"
    city = "Bangalore"
    state = "Karnataka"
    gstn = "29XYZPQ9876K5L4"
    contact_person = "Procurement Head"
    mobile = "9988776655"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/customers" -Method POST -Body $body -ContentType "application/json"
```

**3. Create Item**
```powershell
$body = @{
    name = "Steel Bar 10mm"
    alias = "SB10"
    category_id = 2
    uom_id = 1
    gst_rate_id = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/items" -Method POST -Body $body -ContentType "application/json"
```

**4. Create Another Item**
```powershell
$body = @{
    name = "Steel Rod 12mm"
    alias = "SR12"
    category_id = 2
    uom_id = 1
    gst_rate_id = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/items" -Method POST -Body $body -ContentType "application/json"
```

**5. Create Transporter**
```powershell
$body = @{
    name = "XYZ Transport Services"
    address_line1 = "456 Transport Road"
    city = "Mumbai"
    state = "Maharashtra"
    gstn = "27XYZAB1234C1D2"
    contact_person = "Transport Manager"
    mobile = "9876543210"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/transporters" -Method POST -Body $body -ContentType "application/json"
```

---

### Part 2: Test Order with GST Calculation (5 minutes)

**6. Create Order (Same State - CGST+SGST)**
```powershell
$body = @{
    customer_id = 1
    order_date = "2024-11-19"
    po_no = "PO-2024-001"
    estimated_delivery_date = "2024-12-01"
    items = @(
        @{
            item_id = 1
            quantity = 1000
            rate = 50.00
        },
        @{
            item_id = 2
            quantity = 500
            rate = 75.00
        }
    )
} | ConvertTo-Json -Depth 3

$order1 = Invoke-RestMethod -Uri "http://localhost:3000/api/orders" -Method POST -Body $body -ContentType "application/json"
$order1 | ConvertTo-Json -Depth 5
```

**Expected:**
- Order number: ORD-202411-00001
- Item 1: quantity=1000, bag_count=40, cgst=4500, sgst=4500, igst=0
- Item 2: quantity=500, bag_count=20, cgst=3375, sgst=3375, igst=0
- Status: Pending

**7. Create Order (Different State - IGST)**
```powershell
$body = @{
    customer_id = 2
    order_date = "2024-11-19"
    po_no = "PO-2024-002"
    estimated_delivery_date = "2024-12-05"
    items = @(
        @{
            item_id = 1
            quantity = 2000
            rate = 52.00
        }
    )
} | ConvertTo-Json -Depth 3

$order2 = Invoke-RestMethod -Uri "http://localhost:3000/api/orders" -Method POST -Body $body -ContentType "application/json"
$order2 | ConvertTo-Json -Depth 5
```

**Expected:**
- Order number: ORD-202411-00002
- Item 1: quantity=2000, bag_count=80, cgst=0, sgst=0, igst=18720
- Status: Pending

**8. View Order Balance**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/orders/1/balance" -Method GET | ConvertTo-Json -Depth 3
```

**Expected:**
- ordered_quantity matches, dispatched_quantity=0, balance_quantity=ordered_quantity

---

### Part 3: Test Dispatch & Status Update (5 minutes)

**9. Create Partial Dispatch**
```powershell
$body = @{
    order_id = 1
    dispatch_date = "2024-11-20"
    transporter_id = 1
    lr_no = "LR-2024-001"
    lr_date = "2024-11-20"
    invoice_no = "INV-2024-001"
    invoice_date = "2024-11-20"
    items = @(
        @{
            order_item_id = 1
            quantity_dispatched = 500
        },
        @{
            order_item_id = 2
            quantity_dispatched = 250
        }
    )
} | ConvertTo-Json -Depth 3

$dispatch1 = Invoke-RestMethod -Uri "http://localhost:3000/api/dispatches" -Method POST -Body $body -ContentType "application/json"
$dispatch1 | ConvertTo-Json -Depth 5
```

**10. Check Order Status (Should still be Pending)**
```powershell
$order = Invoke-RestMethod -Uri "http://localhost:3000/api/orders/1" -Method GET
Write-Host "Order Status: $($order.data.status)"
```

**Expected:** Status = "Pending" (because items still have balance)

**11. Check Updated Balance**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/orders/1/balance" -Method GET | ConvertTo-Json -Depth 3
```

**Expected:**
- Item 1: ordered=1000, dispatched=500, balance=500
- Item 2: ordered=500, dispatched=250, balance=250

**12. Complete Remaining Dispatch**
```powershell
$body = @{
    order_id = 1
    dispatch_date = "2024-11-25"
    transporter_id = 1
    lr_no = "LR-2024-002"
    lr_date = "2024-11-25"
    invoice_no = "INV-2024-002"
    invoice_date = "2024-11-25"
    items = @(
        @{
            order_item_id = 1
            quantity_dispatched = 500
        },
        @{
            order_item_id = 2
            quantity_dispatched = 250
        }
    )
} | ConvertTo-Json -Depth 3

$dispatch2 = Invoke-RestMethod -Uri "http://localhost:3000/api/dispatches" -Method POST -Body $body -ContentType "application/json"
$dispatch2 | ConvertTo-Json -Depth 5
```

**13. Check Order Status (Should now be Completed)**
```powershell
$order = Invoke-RestMethod -Uri "http://localhost:3000/api/orders/1" -Method GET
Write-Host "Order Status: $($order.data.status)"
```

**Expected:** Status = "Completed" (all items fully dispatched)

**14. View Dispatch History**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/dispatches/order/1/history" -Method GET | ConvertTo-Json -Depth 3
```

**Expected:** Shows both dispatch records

---

### Part 4: Test Validation (2 minutes)

**15. Try to Exceed Balance (Should Fail)**
```powershell
$body = @{
    order_id = 2
    dispatch_date = "2024-11-20"
    transporter_id = 1
    lr_no = "LR-TEST"
    items = @(
        @{
            order_item_id = 3
            quantity_dispatched = 99999
        }
    )
} | ConvertTo-Json -Depth 3

try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/dispatches" -Method POST -Body $body -ContentType "application/json"
} catch {
    Write-Host "Expected Error: $($_.Exception.Message)"
}
```

**Expected:** Error message about exceeding balance quantity

---

## ✅ Verification Checklist

After completing the test workflow, verify:

- [ ] Orders created with correct order numbers (ORD-202411-XXXXX)
- [ ] Bag count calculated correctly (quantity / 25)
- [ ] Same-state customer: CGST + SGST populated, IGST = 0
- [ ] Different-state customer: IGST populated, CGST = SGST = 0
- [ ] Order status = "Pending" initially
- [ ] Partial dispatch reduced balance quantities
- [ ] Order status = "Completed" after full dispatch
- [ ] Validation prevents exceeding balance quantity
- [ ] Dispatch history shows all dispatches for an order

---

## 🎯 Key Business Logic Validations

**GST Calculation:**
```
Amount = Quantity × Rate
If customer.state == "Maharashtra" (same as company):
  CGST = (Amount × 18%) / 2 = Amount × 0.09
  SGST = (Amount × 18%) / 2 = Amount × 0.09
  IGST = 0
Else:
  CGST = 0
  SGST = 0
  IGST = Amount × 18% = Amount × 0.18
Total = Amount + CGST + SGST + IGST
```

**Bag Count:**
```
Bag Count = Quantity / 25
Example: 1000 KG / 25 = 40 Bags
```

**Balance Tracking:**
```
Balance = Ordered Quantity - Sum(All Dispatched Quantities)
```

**Order Status:**
```
Status = "Pending" if ANY item has Balance > 0
Status = "Completed" if ALL items have Balance = 0
```

---

## 📱 Using Insomnia (Recommended)

For easier testing, import `insomnia_collection.json`:

1. Open Insomnia
2. Application → Preferences → Data → Import Data
3. Select `insomnia_collection.json`
4. All requests will be organized by module
5. Run requests in sequence for complete workflow

---

## 🐛 Troubleshooting

**Issue: "Database connection failed"**
```powershell
# Check PostgreSQL service
Get-Service postgresql*

# Start if stopped
Start-Service postgresql-x64-14  # Adjust version
```

**Issue: "Port 3000 already in use"**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (use PID from above)
taskkill /PID <PID> /F

# Or change PORT in .env
```

**Issue: "Order status not updating"**
- Check database trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'trigger_update_order_status';`
- Trigger updates automatically, no manual intervention needed

---

## 📊 Sample Data Reference

After `npm run init-db`, you'll have:

**Categories:** (id 1-3)
1. Raw Material (RM)
2. Finished Product (FP)
3. Semi-Finished (SF)

**UOM:** (id 1-4)
1. KG (Kilogram)
2. MT (Metric Ton)
3. PCS (Pieces)
4. BAG (Bag)

**GST Rates:** (id 1-3)
1. HSN 7201 - 18%
2. HSN 7202 - 12%
3. HSN 7203 - 5%

Use these IDs when creating items and orders.

---

**Ready to build! 🎉**

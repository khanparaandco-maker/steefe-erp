# 🚀 Complete Setup Instructions - STEEFEERP

## Prerequisites

Before starting, ensure you have:
- ✅ PostgreSQL 12+ installed
- ✅ Node.js 16+ installed
- ✅ Administrator access to your computer

---

## 📋 Setup Process

### Step 1: Database Setup (Choose One Method)

#### **Method A: Simple Setup (Recommended)**

This uses your existing PostgreSQL installation:

```powershell
# 1. Open PowerShell as Administrator
# 2. Navigate to project
cd "d:\STEEFE ERP"

# 3. Run simple setup
.\setup-database-simple.ps1
```

**What it does:**
- Creates database: `steelmelt_erp`
- Creates user: `steelmelt_user` with password: `steelmelt_password_2024`
- Grants all necessary privileges

#### **Method B: Full Service Setup (Advanced)**

Creates a dedicated PostgreSQL service:

```powershell
# 1. Open PowerShell as Administrator
# 2. Navigate to project
cd "d:\STEEFE ERP"

# 3. Run full setup (creates new service)
.\setup-postgresql-service.ps1
```

**What it does:**
- Creates new PostgreSQL service named "STEEFEERP"
- Runs on port 5433 (different from main PostgreSQL)
- Creates separate data directory
- Creates database and user

#### **Method C: Manual Setup (Using pgAdmin)**

If you prefer GUI:

1. Open pgAdmin
2. Create database: `steelmelt_erp`
3. Create user: `steelmelt_user` with password: `steelmelt_password_2024`
4. Grant privileges (see POSTGRESQL_SETUP.md)

---

### Step 2: Install Dependencies

```powershell
# Make sure you're in the project directory
cd "d:\STEEFE ERP"

# Install all Node.js dependencies
npm install
```

**Expected output:**
```
added 150+ packages
```

---

### Step 3: Initialize Database Schema

```powershell
# Run main database initialization script
npm run init-db

# Initialize user management & authentication schema
$env:PGPASSWORD = 'steelmelt_password_2024'
psql -U steelmelt_user -d steelmelt_erp -h localhost -f database/user_management_schema.sql
```

**What it does:**
- **Main Schema**: Creates 13 tables (suppliers, orders, items, etc.)
- **Views**: order_items_balance, order_status_summary
- **Triggers**: Auto-status updates
- **Sample Data**: UOM, Categories, GST Rates
- **User Management**: 7 authentication tables (users, roles, modules, permissions, etc.)
- **Application Modules**: 35 modules inserted (Dashboard, Orders, Masters, etc.)
- **Default Roles**: 4 roles with permissions (Super Admin, Manager, Operator, View Only)
- **Admin User**: username=`admin`, password=`Admin@123`

**Expected output:**
```
Starting database initialization...
Database connected successfully
Database schema created successfully!
Sample data inserted for UOM, Categories, and GST Rates.
User management schema initialized.
```

---

### Step 4: Start the Server

```powershell
# Start in development mode (with auto-reload)
npm run dev
```

**Expected output:**
```
[nodemon] starting `node server.js`
Database connected successfully
SteelMelt ERP Server running on port 3000
Environment: development
```

---

### Step 5: Verify Installation

#### Test 1: Health Check
```powershell
curl http://localhost:3000/health
```

**Expected response:**
```json
{"status":"OK","timestamp":"2024-11-19T..."}
```

#### Test 2: Get Categories
```powershell
curl http://localhost:3000/api/categories
```

**Expected response:**
```json
{
  "success": true,
  "data": [
    {"id":1,"name":"Raw Material","alias":"RM",...},
    {"id":2,"name":"Finished Product","alias":"FP",...},
    {"id":3,"name":"Semi-Finished","alias":"SF",...}
  ]
}
```

#### Test 3: Get UOMs
```powershell
curl http://localhost:3000/api/uom
```

**Expected response:**
```json
{
  "success": true,
  "data": [
    {"id":1,"short_name":"KG","description":"Kilogram"},
    {"id":2,"short_name":"MT","description":"Metric Ton"},
    {"id":3,"short_name":"PCS","description":"Pieces"},
    {"id":4,"short_name":"BAG","description":"Bag"}
  ]
}
```

---

## 🎯 Quick Test Workflow

Once server is running, test the complete flow:

### 1. Create a Customer
```powershell
$body = @{
    name = "ABC Manufacturing Ltd"
    address_line1 = "789 Industrial Area"
    city = "Pune"
    state = "Maharashtra"
    contact_person = "Purchase Manager"
    mobile = "9876543210"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/customers" -Method POST -Body $body -ContentType "application/json"
```

### 2. Create an Item
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

### 3. Create an Order
```powershell
$body = @{
    customer_id = 1
    order_date = "2024-11-19"
    po_no = "PO-2024-001"
    items = @(
        @{
            item_id = 1
            quantity = 1000
            rate = 50.00
        }
    )
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Uri "http://localhost:3000/api/orders" -Method POST -Body $body -ContentType "application/json"
```

**Verify:**
- Order number auto-generated: ORD-202411-XXXXX
- Bag count calculated: 40 (1000/25)
- GST calculated: CGST + SGST (same state)

---

## 📱 Using Insomnia (Recommended for Testing)

### Setup Insomnia:

1. **Download Insomnia**
   - Visit: https://insomnia.rest/download
   - Install the desktop app

2. **Import Collection**
   - Open Insomnia
   - Click: Application → Preferences → Data → Import Data
   - Select: `insomnia_collection.json` from project folder
   - All 30+ API endpoints will be imported

3. **Start Testing**
   - Collection is organized by module
   - Sample request bodies included
   - Just click "Send" to test

---

## 🔍 Troubleshooting

### Issue: "Cannot execute scripts"

**Error:**
```
.\setup-database-simple.ps1 : File cannot be loaded because running scripts is disabled
```

**Solution:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

### Issue: "Database connection failed"

**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**

1. **Check PostgreSQL is running:**
   ```powershell
   # For default PostgreSQL
   Get-Service postgresql*
   
   # Start if stopped
   Start-Service postgresql-x64-16  # Adjust version
   ```

2. **Verify connection details in .env:**
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=steelmelt_erp
   DB_USER=steelmelt_user
   DB_PASSWORD=steelmelt_password_2024
   ```

3. **Test connection manually:**
   ```powershell
   psql -U steelmelt_user -d steelmelt_erp -h localhost -p 5432
   ```

---

### Issue: "Port 3000 already in use"

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions:**

1. **Find and kill the process:**
   ```powershell
   # Find process
   netstat -ano | findstr :3000
   
   # Kill process (use PID from above)
   taskkill /PID <PID> /F
   ```

2. **Or change port in .env:**
   ```env
   PORT=3001
   ```

---

### Issue: "npm install fails"

**Error:**
```
npm ERR! code ENOENT
```

**Solution:**
```powershell
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# Reinstall
npm install
```

---

### Issue: "Database schema creation fails"

**Error:**
```
ERROR: relation "suppliers" already exists
```

**Solution:**

**Option 1: Drop and recreate database**
```sql
-- Connect to postgres database
psql -U postgres -h localhost

-- Drop existing database
DROP DATABASE steelmelt_erp;

-- Recreate
CREATE DATABASE steelmelt_erp;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE steelmelt_erp TO steelmelt_user;
```

Then run:
```powershell
npm run init-db
```

**Option 2: Manual cleanup**
```sql
-- Connect to steelmelt_erp
\c steelmelt_erp

-- Drop all tables
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO steelmelt_user;
```

Then run:
```powershell
npm run init-db
```

---

### Issue: "Password authentication failed"

**Error:**
```
FATAL: password authentication failed for user "steelmelt_user"
```

**Solution:**

1. **Reset password in PostgreSQL:**
   ```sql
   psql -U postgres
   ALTER USER steelmelt_user WITH PASSWORD 'steelmelt_password_2024';
   ```

2. **Update .env file to match**

---

## 📊 Verify Database Tables

After `npm run init-db`, check tables are created:

```powershell
# Connect to database
psql -U steelmelt_user -d steelmelt_erp -h localhost

# List tables
\dt

# Should show:
# suppliers, categories, uom, gst_rates, items, 
# transporters, customers, orders, order_items,
# dispatches, dispatch_items
```

---

## 🎓 Next Steps After Setup

### 1. Read Documentation
- **QUICKSTART.md** - 15-minute tutorial
- **API_DOCUMENTATION.md** - Complete API reference
- **README.md** - Full project overview

### 2. Import Insomnia Collection
- File: `insomnia_collection.json`
- Contains all API requests ready to use

### 3. Test the System
- Follow QUICKSTART.md for complete test workflow
- Create customers, items, orders, dispatches
- Verify GST calculations and balance tracking

### 4. Customize (if needed)
- Update company state in .env
- Modify GST rates in database
- Adjust bag calculation divisor

---

## 🛠️ Development Commands

```powershell
# Start development server (with auto-reload)
npm run dev

# Start production server
npm start

# Initialize/reinitialize database
npm run init-db

# Install dependencies
npm install

# Clear cache and reinstall
npm cache clean --force
npm install
```

---

## 🔐 Security Notes

**⚠️ IMPORTANT:** The default password is for development only!

**For Production:**

1. **Change database password:**
   ```sql
   ALTER USER steelmelt_user WITH PASSWORD 'your_secure_password_here';
   ```

2. **Update .env:**
   ```env
   DB_PASSWORD=your_secure_password_here
   ```

3. **Set production mode:**
   ```env
   NODE_ENV=production
   ```

4. **Restrict database access** in `pg_hba.conf`

---

## 📞 Need Help?

### Common Resources:
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Node.js Docs:** https://nodejs.org/docs/
- **Express Docs:** https://expressjs.com/

### Check These Files:
- `POSTGRESQL_SETUP.md` - Detailed PostgreSQL setup
- `QUICKSTART.md` - Quick start tutorial
- `API_DOCUMENTATION.md` - API reference
- `PROJECT_SUMMARY.md` - Architecture overview

---

## ✅ Setup Checklist

- [ ] PostgreSQL installed and running
- [ ] Database created (steelmelt_erp)
- [ ] User created (steelmelt_user)
- [ ] Dependencies installed (npm install)
- [ ] Schema initialized (npm run init-db)
- [ ] Server started (npm run dev)
- [ ] Health check passed (curl health endpoint)
- [ ] Sample data verified (curl categories endpoint)
- [ ] Insomnia collection imported
- [ ] Documentation reviewed

---

**🎉 Once all checks pass, your STEEFEERP system is ready to use!**

Start with **QUICKSTART.md** for a guided tutorial, or import **insomnia_collection.json** to start testing APIs immediately.

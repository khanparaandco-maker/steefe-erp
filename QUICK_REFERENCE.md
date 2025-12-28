# 🚀 STEEFEERP - Quick Setup Reference

## ⚡ 3-Step Quick Start

### 1️⃣ Setup Database (1 minute)
```powershell
# Open PowerShell as Administrator
cd "d:\STEEFE ERP"
.\setup-database-simple.ps1
```

### 2️⃣ Initialize System (1 minute)
```powershell
npm install
npm run init-db

# Initialize user management schema
$env:PGPASSWORD = 'steelmelt_password_2024'
psql -U steelmelt_user -d steelmelt_erp -h localhost -f database/user_management_schema.sql
```

### 3️⃣ Start Server (30 seconds)
```powershell
npm run dev
```

✅ **Test:** Open browser → http://localhost:5173  
✅ **Login:** Username: `admin`, Password: `Admin@123`

---

## 📋 Database Connection Details

```
Host:     localhost
Port:     5432
Database: steelmelt_erp
Username: steelmelt_user
Password: steelmelt_password_2024
```

**Connection String:**
```
postgresql://steelmelt_user:steelmelt_password_2024@localhost:5432/steelmelt_erp
```

---

## 🎯 Quick Test Commands

```powershell
# Login to get JWT token
$loginBody = @{username="admin"; password="Admin@123"} | ConvertTo-Json
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $response.data.token

# Health check (no auth required)
curl http://localhost:3000/health

# Get categories (with auth)
curl -H "Authorization: Bearer $token" http://localhost:3000/api/categories

# Get UOMs (with auth)
curl -H "Authorization: Bearer $token" http://localhost:3000/api/uom

# Get GST rates (with auth)
curl -H "Authorization: Bearer $token" http://localhost:3000/api/gst-rates

# Get current user info
curl -H "Authorization: Bearer $token" http://localhost:3000/api/auth/me
```

**Note:** All API endpoints now require authentication (except /health)

---

## 🛠️ Essential Commands

```powershell
# Start development server
npm run dev

# Initialize database
npm run init-db

# Install dependencies
npm install
```

---

## 📚 Documentation Quick Links

| Document | Purpose |
|----------|---------|
| SETUP_INSTRUCTIONS.md | Complete setup guide |
| POSTGRESQL_SETUP.md | Database setup details |
| QUICKSTART.md | 15-min tutorial |
| API_DOCUMENTATION.md | API reference |
| README.md | Project overview |

---

## 🔧 Troubleshooting Quick Fix

### Server won't start?
```powershell
# Check PostgreSQL
Get-Service postgresql*

# Restart if needed
Restart-Service postgresql-x64-16
```

### Port in use?
```powershell
# Find and kill process
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Database connection failed?
```powershell
# Test connection
psql -U steelmelt_user -d steelmelt_erp -h localhost

# Check .env file has correct password
```

---

## 📱 Import Insomnia Collection

1. Download Insomnia: https://insomnia.rest/download
2. Open Insomnia
3. Import → `insomnia_collection.json`
4. Test all 30+ API endpoints

---

## 🎓 Next Steps

1. ✅ Follow **QUICKSTART.md** for full tutorial
2. ✅ Import **insomnia_collection.json** for API testing
3. ✅ Read **API_DOCUMENTATION.md** for endpoint details

---

**Need Help?** See SETUP_INSTRUCTIONS.md for detailed troubleshooting!

# STEEFEERP PostgreSQL Setup Guide

## Option 1: Simple Setup (Recommended)

If you already have PostgreSQL installed, use this method:

### Steps:

1. **Open PowerShell as Administrator**
   - Right-click on PowerShell
   - Select "Run as Administrator"

2. **Navigate to project directory**
   ```powershell
   cd "d:\STEEFE ERP"
   ```

3. **Update the script variables** (if needed)
   - Open `setup-database-simple.ps1`
   - Update `$PostgreSQLPath` to match your PostgreSQL installation
   - Update `$PostgresPassword` to your postgres user password

4. **Run the setup script**
   ```powershell
   # Enable script execution (if needed)
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   
   # Run setup
   .\setup-database-simple.ps1
   ```

5. **Update .env file**
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=steelmelt_erp
   DB_USER=steelmelt_user
   DB_PASSWORD=steelmelt_password_2024
   ```

6. **Initialize database schema**
   ```powershell
   npm run init-db
   ```

7. **Start the server**
   ```powershell
   npm run dev
   ```

---

## Option 2: Full Service Setup (Advanced)

Create a dedicated PostgreSQL service for STEEFEERP:

### Steps:

1. **Open PowerShell as Administrator**

2. **Navigate to project directory**
   ```powershell
   cd "d:\STEEFE ERP"
   ```

3. **Update script configuration** (optional)
   - Open `setup-postgresql-service.ps1`
   - Modify these variables if needed:
     - `$PostgreSQLVersion` - Your PostgreSQL version
     - `$Port` - Service port (default: 5433)
     - `$DataDirectory` - Data storage location

4. **Run the full setup script**
   ```powershell
   .\setup-postgresql-service.ps1
   ```

5. **Update .env file**
   ```env
   DB_HOST=localhost
   DB_PORT=5433
   DB_NAME=steelmelt_erp
   DB_USER=steelmelt_user
   DB_PASSWORD=steelmelt_password_2024
   ```

6. **Initialize database schema**
   ```powershell
   # Initialize main ERP schema
   npm run init-db
   
   # Initialize user management & authentication schema
   $env:PGPASSWORD = 'steelmelt_password_2024'
   psql -U steelmelt_user -d steelmelt_erp -h localhost -f database/user_management_schema.sql
   ```
   
   **What gets created:**
   - Main schema: 13 tables (suppliers, orders, items, etc.)
   - User management: 7 tables (users, roles, modules, permissions, etc.)
   - 35 application modules inserted
   - 4 default roles with permissions
   - Admin user (username: `admin`, password: `Admin@123`)

7. **Start the server**
   ```powershell
   npm run dev
   ```

8. **Login to the application**
   - Navigate to: `http://localhost:5173`
   - Default credentials:
     - Username: `admin`
     - Password: `Admin@123`
   - **Important**: Change default password after first login!

---

## Manual Setup (Alternative)

If you prefer manual setup using pgAdmin or psql:

### 1. Create Database
```sql
CREATE DATABASE steelmelt_erp
    WITH 
    ENCODING = 'UTF8'
    TEMPLATE = template0;
```

### 2. Create User
```sql
CREATE USER steelmelt_user WITH PASSWORD 'steelmelt_password_2024';
```

### 3. Grant Privileges
```sql
-- Grant database privileges
GRANT ALL PRIVILEGES ON DATABASE steelmelt_erp TO steelmelt_user;

-- Connect to database
\c steelmelt_erp

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO steelmelt_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO steelmelt_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO steelmelt_user;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO steelmelt_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO steelmelt_user;
```

### 4. Update .env and initialize
```powershell
# Update .env file with connection details
# Then run:
npm run init-db
npm run dev
```

---

## Verification

After setup, verify the installation:

### 1. Check PostgreSQL Service (Option 2 only)
```powershell
Get-Service -Name STEEFEERP
```

### 2. Test Database Connection
```powershell
# Using psql
psql -U steelmelt_user -d steelmelt_erp -h localhost -p 5432

# Or check with the application
npm run dev
curl http://localhost:3000/health
```

### 3. Verify Tables
```powershell
# After running init-db, check tables:
npm run dev
curl http://localhost:3000/api/categories
```

---

## Troubleshooting

### Issue: "Cannot execute scripts"
**Solution:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue: "psql.exe not found"
**Solution:**
- Update `$PostgreSQLPath` in the script
- Common paths:
  - `C:\Program Files\PostgreSQL\16\bin`
  - `C:\Program Files\PostgreSQL\15\bin`
  - `C:\Program Files\PostgreSQL\14\bin`

### Issue: "Password authentication failed"
**Solution:**
- Update `$PostgresPassword` in the script
- Or manually create database using pgAdmin

### Issue: "Port already in use"
**Solution:**
- Change port in setup script (Option 2)
- Or use Option 1 with existing PostgreSQL service

### Issue: "Service won't start"
**Solution:**
```powershell
# Check service status
Get-Service -Name STEEFEERP

# View logs
Get-EventLog -LogName Application -Source "STEEFEERP" -Newest 10

# Restart service
Restart-Service -Name STEEFEERP
```

---

## Service Management (Option 2)

### Start Service
```powershell
Start-Service -Name STEEFEERP
```

### Stop Service
```powershell
Stop-Service -Name STEEFEERP
```

### Restart Service
```powershell
Restart-Service -Name STEEFEERP
```

### Check Status
```powershell
Get-Service -Name STEEFEERP
```

### Remove Service (if needed)
```powershell
Stop-Service -Name STEEFEERP
sc.exe delete STEEFEERP
```

---

## Connection Details

After successful setup:

### Default Configuration
- **Host:** localhost
- **Port:** 5432 (Option 1) or 5433 (Option 2)
- **Database:** steelmelt_erp
- **Username:** steelmelt_user
- **Password:** steelmelt_password_2024

### Connection String
```
postgresql://steelmelt_user:steelmelt_password_2024@localhost:5432/steelmelt_erp
```

### pgAdmin Connection
1. Right-click "Servers" → Create → Server
2. General Tab:
   - Name: STEEFEERP
3. Connection Tab:
   - Host: localhost
   - Port: 5432 (or 5433)
   - Database: steelmelt_erp
   - Username: steelmelt_user
   - Password: steelmelt_password_2024
4. Save

---

## Next Steps

After database setup:

1. ✅ **Initialize Schema**
   ```powershell
   npm run init-db
   ```

2. ✅ **Start Development Server**
   ```powershell
   npm run dev
   ```

3. ✅ **Test APIs**
   - Import `insomnia_collection.json`
   - Or use curl/PowerShell to test endpoints

4. ✅ **Read Documentation**
   - `QUICKSTART.md` - Quick start guide
   - `API_DOCUMENTATION.md` - API reference
   - `README.md` - Full documentation

---

## Security Notes

⚠️ **Important:** Change the default password in production!

```sql
ALTER USER steelmelt_user WITH PASSWORD 'your_secure_password_here';
```

Update `.env` accordingly.

---

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review PostgreSQL logs
3. Verify connection details in `.env`
4. Ensure PostgreSQL service is running

---

**Quick Start:** Use Option 1 (Simple Setup) for fastest setup! 🚀

# STEEFE ERP - Cloud Deployment Guide (Render.com)

**Deployment Date:** December 28, 2025  
**Platform:** Render.com (Free Tier)  
**Production URL:** https://steefe-erp.onrender.com  
**Repository:** https://github.com/khanparaandco-maker/steefe-erp

---

## Table of Contents
1. [Deployment Overview](#deployment-overview)
2. [Prerequisites](#prerequisites)
3. [Step-by-Step Deployment Process](#step-by-step-deployment-process)
4. [Configuration Files](#configuration-files)
5. [Database Setup](#database-setup)
6. [Troubleshooting Issues](#troubleshooting-issues)
7. [Maintenance & Operations](#maintenance--operations)
8. [Production Credentials](#production-credentials)

---

## Deployment Overview

### What Was Deployed
- **Full-stack ERP Application**
  - Node.js/Express Backend
  - React (Vite) Frontend
  - PostgreSQL Database
  
### Architecture
```
┌─────────────────────────────────────────────┐
│         Render.com Services                 │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────────┐  ┌─────────────────┐ │
│  │   Web Service    │  │   PostgreSQL    │ │
│  │  (steefe-erp)    │──│  (steefe_erp_db)│ │
│  │                  │  │                 │ │
│  │  - Backend API   │  │  - Database     │ │
│  │  - Frontend UI   │  │  - 27 Tables    │ │
│  └──────────────────┘  └─────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

### Key Differences from Local Setup
| Aspect | Local | Production (Render) |
|--------|-------|---------------------|
| Database Host | localhost | dpg-d58jkamuk2gs73dluecg-a.singapore-postgres.render.com |
| Database Connection | Individual params | DATABASE_URL connection string |
| SSL/TLS | Disabled | Required (with rejectUnauthorized: false) |
| Port | 3000 | 10000 (internal) |
| API Base URL | http://localhost:3000 | Dynamic (window.location.origin) |
| Frontend Build | dev server | Static files in dist/ |
| Environment Variables | .env file | Render Dashboard |

---

## Prerequisites

### 1. GitHub Account & Repository
- Created repository: `khanparaandco-maker/steefe-erp`
- Pushed all code to main branch

### 2. Render Account
- Signed up at https://render.com
- Verified email address

### 3. Required Files Modified
- `config/database.js` - Added DATABASE_URL support with SSL
- `server.js` - Updated CORS and Helmet configuration
- `frontend/src/services/api.js` - Dynamic API URL detection
- `frontend/src/utils/constants.js` - Centralized API_BASE_URL
- Multiple frontend files - Fixed hardcoded localhost references

---

## Step-by-Step Deployment Process

### Phase 1: Git & GitHub Setup

1. **Initialize Git Repository**
   ```powershell
   cd "d:\STEEFE ERP"
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create GitHub Repository**
   - Repository name: `steefe-erp`
   - Visibility: Private
   
3. **Push to GitHub**
   ```powershell
   git remote add origin https://github.com/khanparaandco-maker/steefe-erp.git
   git branch -M main
   git push -u origin main
   ```

### Phase 2: Database Setup on Render

1. **Create PostgreSQL Database**
   - Go to Render Dashboard
   - Click "New +" → "PostgreSQL"
   - Configure:
     - Name: `steefe-erp-db`
     - Database: `steefe_erp`
     - User: `steefe_erp_user`
     - Region: Singapore (closest to users)
     - Plan: Free
   - Click "Create Database"

2. **Save Database Credentials**
   ```
   External Database URL:
   postgresql://steefe_erp_user:l93me9lVMYhNk2TD1WGRw1SOJbxgXIu3@dpg-d58jkamuk2gs73dluecg-a.singapore-postgres.render.com/steefe_erp
   ```

### Phase 3: Web Service Setup on Render

1. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect GitHub repository: `steefe-erp`
   - Configure:
     - Name: `steefe-erp`
     - Region: Singapore
     - Branch: `main`
     - Root Directory: (leave empty)
     - Runtime: Node
     - Build Command: `npm install && cd frontend && npm install && npm run build`
     - Start Command: `npm start`
     - Plan: Free

2. **Add Environment Variables**
   - Go to Environment tab
   - Add:
     ```
     DATABASE_URL = postgresql://steefe_erp_user:l93me9lVMYhNk2TD1WGRw1SOJbxgXIu3@dpg-d58jkamuk2gs73dluecg-a.singapore-postgres.render.com/steefe_erp
     NODE_ENV = production
     JWT_SECRET = your-super-secret-jwt-key-change-this
     SESSION_SECRET = your-session-secret-key-change-this
     PORT = 10000
     ```

3. **Deploy**
   - Click "Manual Deploy" → "Deploy latest commit"
   - Wait 3-5 minutes for deployment

### Phase 4: Database Initialization

1. **Run Production Database Setup**
   ```powershell
   cd "d:\STEEFE ERP"
   $env:DATABASE_URL="postgresql://steefe_erp_user:..."
   npm run setup-prod-db
   ```
   
   This script:
   - Creates all tables from schema.sql
   - Creates user management tables
   - Creates admin user (username: admin, password: admin123)
   - Grants Super Admin permissions

2. **Sync Missing Tables**
   ```powershell
   $env:DATABASE_URL="postgresql://steefe_erp_user:..."
   node scripts/syncProductionSchema.js
   ```
   
   This adds:
   - company_settings table
   - bank_accounts table
   - heat_treatment table
   - melting_processes tables
   - scrap_grn tables
   - stock_transactions table
   - All triggers and constraints

### Phase 5: Verification

1. **Compare Schemas**
   ```powershell
   $env:DATABASE_URL="postgresql://steefe_erp_user:..."
   node scripts/compareSchemas.js
   ```
   
   Expected output: 27 tables in both local and production, 0 missing columns

2. **Test Application**
   - Open: https://steefe-erp.onrender.com
   - Login: admin / admin123
   - Verify all modules load correctly

---

## Configuration Files

### 1. config/database.js
```javascript
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' 
          ? { rejectUnauthorized: false } 
          : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
    : {
        // Local configuration
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        // ... other local settings
      }
);
```

### 2. server.js - CORS & Security
```javascript
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: true,
  credentials: true
}));
```

### 3. frontend/src/utils/constants.js
```javascript
export const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000'
  : window.location.origin;
```

### 4. frontend/src/services/api.js
```javascript
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api'
  : '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});
```

### 5. package.json - Scripts
```json
{
  "scripts": {
    "start": "node server.js",
    "build": "cd frontend && npm install && npm run build",
    "setup-prod-db": "node scripts/setupProductionDB.js"
  }
}
```

---

## Database Setup

### Tables Created (27 Total)

**Core Tables:**
1. users - User accounts
2. roles - User roles (Super Admin, Manager, Operator)
3. modules - Application modules
4. permissions - Role-based permissions
5. user_roles - User-role mappings
6. user_sessions - Active sessions
7. audit_logs - Activity logging

**Master Data:**
8. suppliers - Supplier information
9. customers - Customer details
10. transporters - Transporter data
11. categories - Item categories
12. uom - Units of measure
13. gst_rates - GST rate configurations
14. items - Inventory items
15. company_settings - Company profile
16. bank_accounts - Bank account details

**Operations:**
17. orders - Sales orders
18. order_items - Order line items
19. dispatches - Dispatch records
20. dispatch_items - Dispatch line items
21. scrap_grn - Scrap GRN entries
22. scrap_grn_items - GRN line items
23. scrap_grn_uploads - GRN file attachments
24. melting_processes - Melting process records
25. melting_spectro_readings - Spectro test results
26. heat_treatment - Heat treatment records
27. stock_transactions - Inventory movements

### Schema Sync Scripts

**scripts/setupProductionDB.js**
- Runs main schema.sql
- Runs user_management_schema.sql
- Creates admin user with password: admin123
- Assigns Super Admin role

**scripts/syncProductionSchema.js**
- Adds missing columns to existing tables
- Runs company_settings_schema.sql
- Runs heat_treatment_schema.sql
- Runs melting_process_schema.sql
- Runs scrap_grn_schema.sql
- Runs stock_statement_schema.sql
- Applies stock_transaction_triggers.sql

**scripts/compareSchemas.js**
- Compares local vs production database
- Lists missing tables and columns
- Provides detailed comparison report

---

## Troubleshooting Issues

### Issue 1: Frontend Showing "Failed to fetch"
**Symptoms:** Login page loads but API calls fail

**Root Cause:** Hardcoded localhost:3000 in frontend files

**Solution:** Fixed 17 files with hardcoded localhost references:
- AuthContext.jsx - Login/logout API calls
- All settings pages (BankDetails, CompanyInformation, EmailSetup, WhatsappIntegration)
- All order pages (DispatchDetails, ProformaInvoice, ViewOrder)
- All GRN pages (ScrapGRN, EditScrapGRN, PrintScrapGRN)
- Added centralized API_BASE_URL in constants.js

### Issue 2: Database Connection Error - "getaddrinfo ENOTFOUND base"
**Symptoms:** Login fails with database connection error

**Root Cause:** DATABASE_URL environment variable not set in Render

**Solution:** 
1. Go to Render Dashboard → steefe-erp service
2. Environment tab → Add Environment Variable
3. Key: DATABASE_URL
4. Value: (External Database URL from PostgreSQL service)
5. Save Changes (triggers automatic redeploy)

### Issue 3: Login Failed - "Login failed. Please try again"
**Symptoms:** API connection works but credentials rejected

**Root Cause:** 
1. Users table not created (user_management_schema.sql not run)
2. Admin user not seeded or wrong password

**Solution:**
1. Run setupProductionDB.js to create all tables
2. Creates admin user with correct password (admin123)
3. Verify with compareSchemas.js

### Issue 4: Missing Tables in Production
**Symptoms:** Features fail with "table does not exist" errors

**Root Cause:** Additional schema files not run (heat_treatment, scrap_grn, etc.)

**Solution:**
1. Run syncProductionSchema.js
2. This runs all missing schema files
3. Verify with compareSchemas.js showing 27/27 tables

### Issue 5: Browser Cache Showing Old Code
**Symptoms:** Login page shows but console errors reference old localhost

**Root Cause:** Browser caching old JavaScript bundle

**Solution:**
1. Open in Incognito/Private mode (Ctrl+Shift+N)
2. Or hard refresh (Ctrl+Shift+R)
3. Or clear browser cache completely

### Issue 6: SSL/TLS Required Error
**Symptoms:** Local scripts fail to connect to Render database

**Root Cause:** Render PostgreSQL requires SSL connections

**Solution:**
```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
```

---

## Maintenance & Operations

### Updating Code

1. **Make changes locally**
2. **Test locally** - Run server and verify
3. **Commit and push to GitHub**
   ```powershell
   git add .
   git commit -m "Description of changes"
   git push origin main
   ```
4. **Render auto-deploys** from main branch
5. **Wait 2-3 minutes** for deployment
6. **Verify production** at https://steefe-erp.onrender.com

### Database Migrations

1. **Create migration SQL file** in database/ folder
2. **Test locally first**
3. **Run on production:**
   ```powershell
   $env:DATABASE_URL="postgresql://steefe_erp_user:..."
   node scripts/runMigration.js your-migration-file.sql
   ```

### Monitoring

**Check Logs:**
- Go to Render Dashboard → steefe-erp → Logs
- View real-time application logs
- Check for errors or warnings

**Database Status:**
- Go to Render Dashboard → steefe-erp-db → Info
- Shows connection count, storage used
- External URL for direct connection

### Backup Strategy

**Automated (Render):**
- Free tier: No automated backups
- Paid tier: Daily automated backups

**Manual Backup:**
```powershell
$env:DATABASE_URL="postgresql://steefe_erp_user:..."
pg_dump $env:DATABASE_URL > backup-$(Get-Date -Format 'yyyy-MM-dd').sql
```

### Performance Considerations

**Free Tier Limitations:**
- Service sleeps after 15 minutes inactivity
- Cold start: 30-60 seconds on first request
- 750 hours/month free compute
- Database: 1GB storage, 97 concurrent connections

**Optimization Tips:**
1. Keep service active with external uptime monitor
2. Optimize database queries
3. Use indexes on frequently queried columns
4. Consider upgrading to paid tier for production use

---

## Production Credentials

### Application Access
- **URL:** https://steefe-erp.onrender.com
- **Username:** admin
- **Password:** admin123
- **Role:** Super Admin

### Database Access
- **Host:** dpg-d58jkamuk2gs73dluecg-a.singapore-postgres.render.com
- **Port:** 5432
- **Database:** steefe_erp
- **User:** steefe_erp_user
- **Password:** l93me9lVMYhNk2TD1WGRw1SOJbxgXIu3
- **Connection String:**
  ```
  postgresql://steefe_erp_user:l93me9lVMYhNk2TD1WGRw1SOJbxgXIu3@dpg-d58jkamuk2gs73dluecg-a.singapore-postgres.render.com/steefe_erp
  ```

### GitHub Repository
- **URL:** https://github.com/khanparaandco-maker/steefe-erp
- **Branch:** main
- **Visibility:** Private

### Render Services
- **Web Service:** steefe-erp
- **Database Service:** steefe-erp-db
- **Region:** Singapore
- **Plan:** Free

---

## Security Recommendations

### Immediate Actions (Required)
1. ✅ Change admin password after first login
2. ✅ Update JWT_SECRET to a strong random value
3. ✅ Update SESSION_SECRET to a strong random value
4. ✅ Review and restrict user permissions

### Future Improvements
1. Enable HTTPS only (already enabled by default on Render)
2. Implement rate limiting on login endpoint
3. Add IP whitelisting for admin access
4. Set up automated backups (requires paid plan)
5. Enable two-factor authentication
6. Implement session timeout
7. Add audit logging for sensitive operations

---

## Utility Scripts Reference

### Production Setup Scripts

**scripts/setupProductionDB.js**
```powershell
$env:DATABASE_URL="..."
npm run setup-prod-db
```
Creates complete database structure and admin user.

**scripts/syncProductionSchema.js**
```powershell
$env:DATABASE_URL="..."
node scripts/syncProductionSchema.js
```
Syncs missing tables and columns to production.

**scripts/compareSchemas.js**
```powershell
$env:DATABASE_URL="..."
node scripts/compareSchemas.js
```
Compares local and production database schemas.

---

## Deployment Checklist

### Pre-Deployment
- [ ] Code tested locally
- [ ] All environment variables documented
- [ ] Database migrations prepared
- [ ] Backup created (if updating existing deployment)

### During Deployment
- [ ] Code pushed to GitHub
- [ ] Render deployment triggered
- [ ] Environment variables set
- [ ] Database schema updated
- [ ] Initial data seeded

### Post-Deployment
- [ ] Application loads successfully
- [ ] Login functionality works
- [ ] All modules accessible
- [ ] Database connections stable
- [ ] No console errors
- [ ] Schema comparison shows 0 missing items

---

## Support & Resources

### Documentation
- Render Documentation: https://render.com/docs
- PostgreSQL on Render: https://render.com/docs/databases
- Node.js on Render: https://render.com/docs/deploy-node-express-app

### Local Scripts Location
- `d:\STEEFE ERP\scripts\` - All utility scripts
- `d:\STEEFE ERP\database\` - All schema files

### Contact
- GitHub Repository Issues: https://github.com/khanparaandco-maker/steefe-erp/issues

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2025-12-28 | 1.0 | Initial deployment to Render.com |
|  |  | - Full database setup (27 tables) |
|  |  | - Admin user created |
|  |  | - All frontend API URLs fixed |
|  |  | - Production environment configured |

---

**Deployment Status:** ✅ Complete and Operational  
**Last Updated:** December 28, 2025  
**Next Review:** After 30 days of production use

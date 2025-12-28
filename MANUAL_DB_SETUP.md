# Manual Database Setup Guide

Since the automated script requires the postgres password, here's how to set up manually using pgAdmin:

## Option 1: Using pgAdmin (EASIEST)

### Step 1: Open pgAdmin
- Start pgAdmin from your Windows Start menu
- Connect to your PostgreSQL 18 server

### Step 2: Create Database
1. Right-click on "Databases"
2. Select "Create" → "Database"
3. Fill in:
   - Database name: `steelmelt_erp`
   - Encoding: `UTF8`
   - Click "Save"

### Step 3: Create User
1. Right-click on "Login/Group Roles"
2. Select "Create" → "Login/Group Role"
3. General tab:
   - Name: `steelmelt_user`
4. Definition tab:
   - Password: `steelmelt_password_2024`
5. Privileges tab:
   - Enable: "Can login?"
6. Click "Save"

### Step 4: Grant Privileges
1. Right-click on database "steelmelt_erp"
2. Select "Properties"
3. Go to "Security" tab
4. Click the "+" button
5. Select "steelmelt_user"
6. Set Privileges to "ALL"
7. Click "Save"

### Step 5: Grant Schema Privileges
1. Right-click on "steelmelt_erp" database
2. Select "Query Tool"
3. Copy and paste this SQL:

```sql
GRANT ALL ON SCHEMA public TO steelmelt_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO steelmelt_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO steelmelt_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO steelmelt_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO steelmelt_user;
```

4. Click "Execute" (F5)

### Step 6: Initialize Schemas

#### A. Initialize Main Schema

1. Keep the Query Tool open (or open a new one on steelmelt_erp database)
2. Open file: `d:\STEEFE ERP\database\schema.sql`
3. Copy all contents
4. Paste into Query Tool
5. Click "Execute" (F5)
6. Wait for completion (should show "Query returned successfully")

#### B. Initialize User Management Schema

1. Keep the Query Tool open
2. Open file: `d:\STEEFE ERP\database\user_management_schema.sql`
3. Copy all contents
4. Paste into Query Tool
5. Click "Execute" (F5)
6. This creates:
   - 7 authentication tables (users, roles, modules, permissions, user_roles, user_sessions, audit_logs)
   - 35 application modules (Dashboard, Orders, Masters, etc.)
   - 4 default roles with permissions (Super Admin, Manager, Operator, View Only)
   - Admin user credentials:
     - Username: `admin`
     - Password: `Admin@123`

### Step 7: Update .env File

## Option 2: Using SQL File

1. Open pgAdmin
2. Connect to PostgreSQL server
3. Right-click "PostgreSQL 18" → "Query Tool"
4. Open file: `setup-database.sql`
5. Execute the script (F5)

---

## Option 3: Using Command Line (if you know postgres password)

```powershell
# Set password (replace YOUR_PASSWORD with actual password)
$env:PGPASSWORD="YOUR_PASSWORD"

# Create database
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE steelmelt_erp;"

# Create user
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -c "CREATE USER steelmelt_user WITH PASSWORD 'steelmelt_password_2024';"

# Grant privileges
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -c "GRANT ALL PRIVILEGES ON DATABASE steelmelt_erp TO steelmelt_user;"

# Grant schema privileges
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -d steelmelt_erp -c "GRANT ALL ON SCHEMA public TO steelmelt_user;"
```

---

## Verify Setup

After completing any of the above options:

```powershell
# Test connection
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U steelmelt_user -d steelmelt_erp -h localhost

# You should see:
# Password for user steelmelt_user: (enter: steelmelt_password_2024)
# steelmelt_erp=>
```

---

## Next Steps

Once database is created:

```powershell
# 1. Initialize database schema
npm run init-db

# 2. Start the server
npm run dev

# 3. Test
curl http://localhost:3000/health
```

---

## Troubleshooting

### Can't remember postgres password?
- Open pgAdmin
- It should auto-connect (password saved)
- Use GUI method (Option 1)

### pgAdmin not installed?
- Download from: https://www.pgadmin.org/download/
- Or use command line if you know the password

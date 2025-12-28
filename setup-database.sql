-- STEEFEERP Database Setup SQL Script
-- Run this in pgAdmin Query Tool or psql

-- Step 1: Create Database
CREATE DATABASE steelmelt_erp
    WITH 
    ENCODING = 'UTF8'
    LC_COLLATE = 'English_United States.1252'
    LC_CTYPE = 'English_United States.1252'
    TEMPLATE = template0;

-- Step 2: Create User
CREATE USER steelmelt_user WITH PASSWORD 'steelmelt_password_2024';

-- Step 3: Grant Database Privileges
GRANT ALL PRIVILEGES ON DATABASE steelmelt_erp TO steelmelt_user;

-- Step 4: Connect to the new database and grant schema privileges
-- In pgAdmin: Right-click steelmelt_erp → Query Tool, then run:

\c steelmelt_erp

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO steelmelt_user;

-- Grant privileges on all current tables (if any)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO steelmelt_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO steelmelt_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO steelmelt_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO steelmelt_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO steelmelt_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO steelmelt_user;

-- Verify setup
SELECT 'Database setup complete!' as status;

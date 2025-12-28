# Simple PostgreSQL Service Setup for STEEFEERP
# Run this if you already have PostgreSQL installed

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "STEEFEERP Database Setup (Simple)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration - UPDATE THESE VALUES
$PostgreSQLPath = "C:\Program Files\PostgreSQL\18\bin"  # Update version if needed
$Port = 5432  # Use your existing PostgreSQL port
$PostgresPassword = "postgres"  # Your postgres user password

Write-Host "This script will:" -ForegroundColor Yellow
Write-Host "  1. Create database: steelmelt_erp" -ForegroundColor White
Write-Host "  2. Create user: steelmelt_user" -ForegroundColor White
Write-Host "  3. Grant all privileges" -ForegroundColor White
Write-Host ""

# Check if PostgreSQL is accessible
$psqlExe = Join-Path $PostgreSQLPath "psql.exe"

if (-Not (Test-Path $psqlExe)) {
    Write-Host "ERROR: psql.exe not found at: $psqlExe" -ForegroundColor Red
    Write-Host "Please update the PostgreSQLPath variable in this script." -ForegroundColor Red
    exit 1
}

Write-Host "PostgreSQL found!" -ForegroundColor Green
Write-Host ""

# Create SQL script
$sqlScript = @"
-- Drop existing database if it exists (optional)
-- DROP DATABASE IF EXISTS steelmelt_erp;

-- Create database
CREATE DATABASE steelmelt_erp
    WITH 
    ENCODING = 'UTF8'
    LC_COLLATE = 'English_United States.1252'
    LC_CTYPE = 'English_United States.1252'
    TEMPLATE = template0;

-- Drop user if exists
DROP USER IF EXISTS steelmelt_user;

-- Create user
CREATE USER steelmelt_user WITH PASSWORD 'steelmelt_password_2024';

-- Grant privileges to the database
GRANT ALL PRIVILEGES ON DATABASE steelmelt_erp TO steelmelt_user;

-- Connect to database
\c steelmelt_erp

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO steelmelt_user;

-- Grant privileges on all current tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO steelmelt_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO steelmelt_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO steelmelt_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO steelmelt_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO steelmelt_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO steelmelt_user;

-- Confirm
SELECT 'Database setup complete!' as status;
"@

# Save SQL script to temp file
$tempSqlFile = Join-Path $env:TEMP "steelmelt_setup.sql"
$sqlScript | Out-File -FilePath $tempSqlFile -Encoding UTF8

Write-Host "Creating database and user..." -ForegroundColor Yellow
Write-Host ""

# Set password environment variable
$env:PGPASSWORD = $PostgresPassword

# Execute SQL script
try {
    & $psqlExe -U postgres -p $Port -h localhost -f $tempSqlFile
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Setup Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Database Connection Details:" -ForegroundColor Yellow
    Write-Host "  Host: localhost" -ForegroundColor White
    Write-Host "  Port: $Port" -ForegroundColor White
    Write-Host "  Database: steelmelt_erp" -ForegroundColor White
    Write-Host "  Username: steelmelt_user" -ForegroundColor White
    Write-Host "  Password: steelmelt_password_2024" -ForegroundColor White
    Write-Host ""
    Write-Host "Connection String:" -ForegroundColor Yellow
    Write-Host "  postgresql://steelmelt_user:steelmelt_password_2024@localhost:$Port/steelmelt_erp" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Update .env file:" -ForegroundColor White
    Write-Host "     DB_HOST=localhost" -ForegroundColor Cyan
    Write-Host "     DB_PORT=$Port" -ForegroundColor Cyan
    Write-Host "     DB_NAME=steelmelt_erp" -ForegroundColor Cyan
    Write-Host "     DB_USER=steelmelt_user" -ForegroundColor Cyan
    Write-Host "     DB_PASSWORD=steelmelt_password_2024" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  2. Initialize database schema:" -ForegroundColor White
    Write-Host "     npm run init-db" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  3. Start the server:" -ForegroundColor White
    Write-Host "     npm run dev" -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    Write-Host "ERROR: Failed to execute SQL script" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
} finally {
    # Clean up
    Remove-Item $tempSqlFile -ErrorAction SilentlyContinue
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host "You can now connect to the database using pgAdmin or any PostgreSQL client." -ForegroundColor Green
Write-Host ""

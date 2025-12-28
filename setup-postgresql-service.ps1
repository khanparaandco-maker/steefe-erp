# PostgreSQL Service Setup for STEEFEERP
# Run this script in PowerShell with Administrator privileges

# Configuration
$ServiceName = "STEEFEERP"
$PostgreSQLVersion = "16"  # Adjust to your PostgreSQL version
$DataDirectory = "D:\PostgreSQL\$ServiceName\data"
$Port = 5433  # Different port to avoid conflicts
$ServiceUser = "postgres"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "STEEFEERP PostgreSQL Service Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if PostgreSQL is installed
Write-Host "Step 1: Checking PostgreSQL installation..." -ForegroundColor Yellow
$pgBinPath = "C:\Program Files\PostgreSQL\$PostgreSQLVersion\bin"

if (-Not (Test-Path $pgBinPath)) {
    Write-Host "ERROR: PostgreSQL $PostgreSQLVersion not found at $pgBinPath" -ForegroundColor Red
    Write-Host "Please install PostgreSQL first or update the version number." -ForegroundColor Red
    exit 1
}

Write-Host "PostgreSQL found at: $pgBinPath" -ForegroundColor Green
Write-Host ""

# Step 2: Create data directory
Write-Host "Step 2: Creating data directory..." -ForegroundColor Yellow
if (-Not (Test-Path $DataDirectory)) {
    New-Item -ItemType Directory -Path $DataDirectory -Force | Out-Null
    Write-Host "Data directory created: $DataDirectory" -ForegroundColor Green
} else {
    Write-Host "Data directory already exists: $DataDirectory" -ForegroundColor Green
}
Write-Host ""

# Step 3: Initialize database cluster
Write-Host "Step 3: Initializing database cluster..." -ForegroundColor Yellow
$initdbExe = Join-Path $pgBinPath "initdb.exe"

if ((Get-ChildItem $DataDirectory | Measure-Object).Count -eq 0) {
    $initCommand = "& `"$initdbExe`" -D `"$DataDirectory`" -U postgres -E UTF8 --locale=C"
    Write-Host "Running: $initCommand" -ForegroundColor Cyan
    Invoke-Expression $initCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database cluster initialized successfully!" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Failed to initialize database cluster" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Database cluster already initialized." -ForegroundColor Green
}
Write-Host ""

# Step 4: Update postgresql.conf
Write-Host "Step 4: Configuring PostgreSQL..." -ForegroundColor Yellow
$postgresqlConf = Join-Path $DataDirectory "postgresql.conf"

if (Test-Path $postgresqlConf) {
    # Backup original config
    Copy-Item $postgresqlConf "$postgresqlConf.backup" -Force
    
    # Update port
    (Get-Content $postgresqlConf) -replace "#port = 5432", "port = $Port" | Set-Content $postgresqlConf
    (Get-Content $postgresqlConf) -replace "port = 5432", "port = $Port" | Set-Content $postgresqlConf
    
    # Update listen_addresses
    (Get-Content $postgresqlConf) -replace "#listen_addresses = 'localhost'", "listen_addresses = '*'" | Set-Content $postgresqlConf
    
    # Update logging
    (Get-Content $postgresqlConf) -replace "#logging_collector = off", "logging_collector = on" | Set-Content $postgresqlConf
    
    Write-Host "PostgreSQL configuration updated:" -ForegroundColor Green
    Write-Host "  - Port: $Port" -ForegroundColor Green
    Write-Host "  - Listen addresses: *" -ForegroundColor Green
    Write-Host "  - Logging: enabled" -ForegroundColor Green
} else {
    Write-Host "WARNING: postgresql.conf not found" -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Update pg_hba.conf for authentication
Write-Host "Step 5: Configuring authentication..." -ForegroundColor Yellow
$pgHbaConf = Join-Path $DataDirectory "pg_hba.conf"

if (Test-Path $pgHbaConf) {
    # Backup original config
    Copy-Item $pgHbaConf "$pgHbaConf.backup" -Force
    
    # Add trust authentication for local connections (for initial setup)
    $hbaContent = @"
# TYPE  DATABASE        USER            ADDRESS                 METHOD
# IPv4 local connections:
host    all             all             127.0.0.1/32            md5
host    all             all             0.0.0.0/0               md5
# IPv6 local connections:
host    all             all             ::1/128                 md5
# Local connections
local   all             all                                     trust
host    all             all             localhost               trust
"@
    
    Set-Content -Path $pgHbaConf -Value $hbaContent
    Write-Host "Authentication configured (md5 for remote, trust for local)" -ForegroundColor Green
} else {
    Write-Host "WARNING: pg_hba.conf not found" -ForegroundColor Yellow
}
Write-Host ""

# Step 6: Register Windows Service
Write-Host "Step 6: Registering Windows Service..." -ForegroundColor Yellow
$pgCtlExe = Join-Path $pgBinPath "pg_ctl.exe"

# Check if service already exists
$existingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue

if ($existingService) {
    Write-Host "Service '$ServiceName' already exists. Stopping and removing..." -ForegroundColor Yellow
    Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
    & sc.exe delete $ServiceName
    Start-Sleep -Seconds 2
}

# Register the service
$registerCommand = "& `"$pgCtlExe`" register -N `"$ServiceName`" -D `"$DataDirectory`" -o `"-p $Port`""
Write-Host "Running: $registerCommand" -ForegroundColor Cyan
Invoke-Expression $registerCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host "Service registered successfully!" -ForegroundColor Green
} else {
    Write-Host "ERROR: Failed to register service" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 7: Start the service
Write-Host "Step 7: Starting PostgreSQL service..." -ForegroundColor Yellow
Start-Service -Name $ServiceName

Start-Sleep -Seconds 3

$service = Get-Service -Name $ServiceName
if ($service.Status -eq "Running") {
    Write-Host "Service started successfully!" -ForegroundColor Green
} else {
    Write-Host "WARNING: Service status is $($service.Status)" -ForegroundColor Yellow
}
Write-Host ""

# Step 8: Set service to start automatically
Write-Host "Step 8: Configuring service startup..." -ForegroundColor Yellow
Set-Service -Name $ServiceName -StartupType Automatic
Write-Host "Service set to start automatically" -ForegroundColor Green
Write-Host ""

# Step 9: Create database and user
Write-Host "Step 9: Creating database and user..." -ForegroundColor Yellow
$psqlExe = Join-Path $pgBinPath "psql.exe"

# Wait for service to be fully ready
Start-Sleep -Seconds 5

$sqlCommands = @"
-- Create database
CREATE DATABASE steelmelt_erp ENCODING 'UTF8';

-- Create application user
CREATE USER steelmelt_user WITH PASSWORD 'steelmelt_password_2024';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE steelmelt_erp TO steelmelt_user;

-- Connect to the database and grant schema privileges
\c steelmelt_erp
GRANT ALL ON SCHEMA public TO steelmelt_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO steelmelt_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO steelmelt_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO steelmelt_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO steelmelt_user;
"@

$sqlCommands | & $psqlExe -U postgres -p $Port -h localhost

Write-Host "Database 'steelmelt_erp' created successfully!" -ForegroundColor Green
Write-Host "User 'steelmelt_user' created with password 'steelmelt_password_2024'" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "PostgreSQL Service Details:" -ForegroundColor Yellow
Write-Host "  Service Name: $ServiceName" -ForegroundColor White
Write-Host "  Port: $Port" -ForegroundColor White
Write-Host "  Data Directory: $DataDirectory" -ForegroundColor White
Write-Host "  Status: $($(Get-Service -Name $ServiceName).Status)" -ForegroundColor White
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
Write-Host "  1. Update .env file with the new connection details" -ForegroundColor White
Write-Host "  2. Run: npm run init-db" -ForegroundColor White
Write-Host "  3. Start the application: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Service Management Commands:" -ForegroundColor Yellow
Write-Host "  Start:   Start-Service -Name $ServiceName" -ForegroundColor White
Write-Host "  Stop:    Stop-Service -Name $ServiceName" -ForegroundColor White
Write-Host "  Restart: Restart-Service -Name $ServiceName" -ForegroundColor White
Write-Host "  Status:  Get-Service -Name $ServiceName" -ForegroundColor White
Write-Host ""

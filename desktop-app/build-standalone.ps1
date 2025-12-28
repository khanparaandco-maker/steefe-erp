# Build Standalone Desktop App
# This creates a complete package with all dependencies

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Building Standalone STEEFE ERP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$ErrorActionPreference = "Continue"

# Step 1: Build frontend
Write-Host "`nStep 1: Building frontend..." -ForegroundColor Yellow
cd "..\frontend"
if (-not (Test-Path "dist")) {
    npm run build
}
Write-Host "✓ Frontend ready" -ForegroundColor Green

# Step 2: Package Electron app
Write-Host "`nStep 2: Packaging Electron app..." -ForegroundColor Yellow
cd "..\desktop-app"
Copy-Item "main-standalone.js" "main.js" -Force
npm run package

# Step 3: Copy backend files
Write-Host "`nStep 3: Copying backend files..." -ForegroundColor Yellow
$appDir = "dist\STEEFE ERP-win32-x64\resources"
$backendDir = "$appDir\backend"

New-Item -ItemType Directory -Path $backendDir -Force | Out-Null

# Copy all backend files
Copy-Item "..\server.js" "$backendDir\" -Force
Copy-Item "..\package.json" "$backendDir\" -Force
Copy-Item "..\config" "$backendDir\config" -Recurse -Force
Copy-Item "..\routes" "$backendDir\routes" -Recurse -Force
Copy-Item "..\middleware" "$backendDir\middleware" -Recurse -Force
Copy-Item "..\services" "$backendDir\services" -Recurse -Force
Copy-Item "..\utils" "$backendDir\utils" -Recurse -Force
Copy-Item "..\database" "$backendDir\database" -Recurse -Force

# Create uploads directory
New-Item -ItemType Directory -Path "$backendDir\uploads" -Force | Out-Null

# Copy frontend build
Copy-Item "..\frontend\dist" "$backendDir\frontend\dist" -Recurse -Force

Write-Host "✓ Backend files copied" -ForegroundColor Green

# Step 4: Install backend dependencies
Write-Host "`nStep 4: Installing backend dependencies..." -ForegroundColor Yellow
cd "$backendDir"
npm install --production
cd "..\..\..\..\"

Write-Host "✓ Dependencies installed" -ForegroundColor Green

# Step 5: Copy Node.js portable
Write-Host "`nStep 5: Bundling Node.js..." -ForegroundColor Yellow
$nodeDir = "$appDir\node"
New-Item -ItemType Directory -Path $nodeDir -Force | Out-Null

# Copy Node.js executable from system
$nodePath = (Get-Command node).Source
Copy-Item $nodePath "$nodeDir\node.exe" -Force

Write-Host "✓ Node.js bundled" -ForegroundColor Green

# Step 6: Create README
$readme = @"
STEEFE ERP - Standalone Desktop Application

INSTALLATION:
1. Extract this folder anywhere
2. Double-click "STEEFE ERP.exe"

FIRST RUN:
- May take 10-20 seconds to start
- Server initializes automatically
- App opens when ready

REQUIREMENTS:
- Windows 10 or later (64-bit)
- PostgreSQL must be installed and running
- Database must be configured

DATABASE SETUP:
1. Install PostgreSQL
2. Create database: steefe_erp
3. Run schema from: resources\backend\database\schema.sql
4. Update connection in: resources\backend\config\database.js

NO INTERNET REQUIRED after installation!

Version: 1.0.0
"@

$readme | Out-File "$appDir\..\README.txt" -Encoding UTF8

# Final summary
$size = (Get-ChildItem "dist\STEEFE ERP-win32-x64" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  Build Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nLocation: dist\STEEFE ERP-win32-x64\" -ForegroundColor Cyan
Write-Host "EXE: STEEFE ERP.exe" -ForegroundColor Cyan
Write-Host "Size: $([math]::Round($size, 2)) MB" -ForegroundColor Cyan
Write-Host "`nIncludes:" -ForegroundColor Yellow
Write-Host "  ✓ Node.js runtime" -ForegroundColor Green
Write-Host "  ✓ Backend server" -ForegroundColor Green
Write-Host "  ✓ Frontend app" -ForegroundColor Green
Write-Host "  ✓ All dependencies" -ForegroundColor Green
Write-Host "`nUsers need:" -ForegroundColor Yellow
Write-Host "  - PostgreSQL installed" -ForegroundColor White
Write-Host "  - Database configured" -ForegroundColor White
Write-Host "`nJust click the EXE to run!" -ForegroundColor Green

explorer "dist\STEEFE ERP-win32-x64"

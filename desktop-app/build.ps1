Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Building Standalone STEEFE ERP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Step 1: Build frontend
Write-Host "`nStep 1: Building frontend..." -ForegroundColor Yellow
cd "..\frontend"
npm run build
cd "..\desktop-app"
Write-Host "✓ Frontend ready" -ForegroundColor Green

# Step 2: Package Electron app
Write-Host "`nStep 2: Packaging Electron app..." -ForegroundColor Yellow
Copy-Item main-standalone.js main.js -Force
npm run package
Write-Host "✓ Electron packaged" -ForegroundColor Green

# Step 3: Copy backend files
Write-Host "`nStep 3: Copying backend files..." -ForegroundColor Yellow
$parentDir = Split-Path -Parent (Get-Location)
$appDir = Join-Path (Get-Location) "dist\STEEFE ERP-win32-x64\resources"
$backendDir = Join-Path $appDir "backend"

# Create backend directory
New-Item -ItemType Directory -Path $backendDir -Force | Out-Null

# Copy all backend files using absolute paths
Copy-Item (Join-Path $parentDir "server.js") $backendDir\ -Force
Copy-Item (Join-Path $parentDir "package.json") $backendDir\ -Force
Copy-Item (Join-Path $parentDir "config") (Join-Path $backendDir "config") -Recurse -Force
Copy-Item (Join-Path $parentDir "routes") (Join-Path $backendDir "routes") -Recurse -Force
Copy-Item (Join-Path $parentDir "middleware") (Join-Path $backendDir "middleware") -Recurse -Force
Copy-Item (Join-Path $parentDir "services") (Join-Path $backendDir "services") -Recurse -Force
Copy-Item (Join-Path $parentDir "utils") (Join-Path $backendDir "utils") -Recurse -Force
Copy-Item (Join-Path $parentDir "database") (Join-Path $backendDir "database") -Recurse -Force

# Create uploads directory
New-Item -ItemType Directory -Path (Join-Path $backendDir "uploads") -Force | Out-Null

# Copy frontend build
$frontendDist = Join-Path $parentDir "frontend\dist"
$targetFrontend = Join-Path $backendDir "frontend\dist"
New-Item -ItemType Directory -Path (Join-Path $backendDir "frontend") -Force | Out-Null
Copy-Item $frontendDist $targetFrontend -Recurse -Force

Write-Host "✓ Backend files copied" -ForegroundColor Green

# Step 4: Install backend dependencies
Write-Host "`nStep 4: Installing backend dependencies..." -ForegroundColor Yellow
Push-Location $backendDir
npm install --omit=dev
Pop-Location
Write-Host "✓ Dependencies installed" -ForegroundColor Green

# Step 5: Copy Node.js portable
Write-Host "`nStep 5: Bundling Node.js..." -ForegroundColor Yellow
$nodeDir = Join-Path $appDir "node"
New-Item -ItemType Directory -Path $nodeDir -Force | Out-Null

# Copy Node.js executable from system
$nodePath = (Get-Command node).Source
Copy-Item $nodePath (Join-Path $nodeDir "node.exe") -Force

Write-Host "✓ Node.js bundled" -ForegroundColor Green

# Calculate size
$distPath = "dist\STEEFE ERP-win32-x64"
$sizeMB = [math]::Round((Get-ChildItem $distPath -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB, 2)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Build Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nLocation: $distPath" -ForegroundColor White
Write-Host "EXE: STEEFE ERP.exe" -ForegroundColor White
Write-Host "Size: $sizeMB MB" -ForegroundColor White
Write-Host "`nIncludes:" -ForegroundColor Yellow
Write-Host "  * Node.js runtime" -ForegroundColor Green
Write-Host "  * Backend server" -ForegroundColor Green
Write-Host "  * Frontend app" -ForegroundColor Green
Write-Host "  * All dependencies" -ForegroundColor Green
Write-Host "`nUsers need:" -ForegroundColor Yellow
Write-Host "  * PostgreSQL installed" -ForegroundColor White
Write-Host "  * Database configured" -ForegroundColor White
Write-Host "`nJust click the EXE to run!" -ForegroundColor Cyan

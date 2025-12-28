# Kill any existing node processes
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Start the server
Write-Host "Starting SteelMelt ERP Server..." -ForegroundColor Green
Set-Location "d:\STEEFE ERP"
node server.js

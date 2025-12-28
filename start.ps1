# SteelMelt ERP - Quick Start Script
Write-Host "Starting SteelMelt ERP..." -ForegroundColor Green
Write-Host ""

# Start Backend
Write-Host "Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\STEEFE ERP'; node server.js" -WindowStyle Normal

Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting Frontend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\STEEFE ERP\frontend'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "Both servers are starting..." -ForegroundColor Green
Write-Host "Backend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Frontend: http://127.0.0.1:5173" -ForegroundColor Cyan
Write-Host ""

Start-Sleep -Seconds 5
Start-Process "http://127.0.0.1:5173"

Write-Host "Application launched! Press any key to close this window..." -ForegroundColor Green
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

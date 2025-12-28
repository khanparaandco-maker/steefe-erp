@echo off
echo Starting SteelMelt ERP...
echo.
echo Starting Backend Server...
start "Backend Server" cmd /k "cd /d "%~dp0" && node server.js"
timeout /t 3 /nobreak >nul
echo.
echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd /d "%~dp0frontend" && npm run dev"
echo.
echo Both servers are starting...
echo Backend will run on http://localhost:3000
echo Frontend will run on http://127.0.0.1:5173
echo.
timeout /t 5 /nobreak >nul
start http://127.0.0.1:5173

# SteelMelt ERP - API Verification Script
# This script tests all master module APIs to verify they're working correctly

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "SteelMelt ERP - API Verification" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"

# Function to test API endpoint
function Test-ApiEndpoint {
    param(
        [string]$Name,
        [string]$Url
    )
    
    try {
        Write-Host "Testing $Name..." -NoNewline
        $response = Invoke-RestMethod -Uri "$baseUrl$Url" -Method Get -ErrorAction Stop
        
        if ($response.success) {
            $count = ($response.data | Measure-Object).Count
            Write-Host " ✓ SUCCESS ($count records)" -ForegroundColor Green
            return $true
        } else {
            Write-Host " ✗ FAILED: $($response.message)" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host " ✗ ERROR: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Wait for server to be ready
Write-Host "Checking if backend server is running..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✓ Backend server is running!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "✗ Backend server is not running!" -ForegroundColor Red
    Write-Host "Please start the backend server first:" -ForegroundColor Yellow
    Write-Host "  cd 'd:\STEEFE ERP'" -ForegroundColor Cyan
    Write-Host "  node server.js" -ForegroundColor Cyan
    exit 1
}

# Test all master module APIs
Write-Host "Testing Master Module APIs:" -ForegroundColor Cyan
Write-Host "-----------------------------------" -ForegroundColor Cyan

$results = @{
    "Suppliers"    = Test-ApiEndpoint "Suppliers API" "/api/suppliers"
    "Categories"   = Test-ApiEndpoint "Categories API" "/api/categories"
    "UOM"          = Test-ApiEndpoint "UOM API" "/api/uom"
    "GST Rates"    = Test-ApiEndpoint "GST Rates API" "/api/gst-rates"
    "Items"        = Test-ApiEndpoint "Items API" "/api/items"
    "Transporters" = Test-ApiEndpoint "Transporters API" "/api/transporters"
    "Customers"    = Test-ApiEndpoint "Customers API" "/api/customers"
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

$passed = ($results.Values | Where-Object { $_ -eq $true }).Count
$total = $results.Count

Write-Host "Passed: $passed / $total" -ForegroundColor $(if ($passed -eq $total) { "Green" } else { "Yellow" })

if ($passed -eq $total) {
    Write-Host ""
    Write-Host "✓ All APIs are working correctly!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now start the frontend:" -ForegroundColor Yellow
    Write-Host "  cd 'd:\STEEFE ERP\frontend'" -ForegroundColor Cyan
    Write-Host "  npm run dev" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "⚠ Some APIs failed. Please check the errors above." -ForegroundColor Yellow
}

Write-Host ""

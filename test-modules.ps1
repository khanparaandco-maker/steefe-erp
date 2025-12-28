# SteelMelt ERP - Module Testing Script
# This script tests all API endpoints with dummy data

$apiBase = "http://localhost:3000/api"
$headers = @{ "Content-Type" = "application/json" }

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  STEELMELT ERP - MODULE TESTING" -ForegroundColor Green
Write-Host "============================================`n" -ForegroundColor Cyan

# Test 1: Category Master
Write-Host "1. Testing CATEGORY MASTER..." -ForegroundColor Yellow
try {
    $category = @{
        category_name = "Raw Materials"
        alias = "RM"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$apiBase/categories" -Method Post -Body $category -ContentType "application/json"
    Write-Host "   ✓ Category created: $($response.data.category_name)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: UOM Master
Write-Host "`n2. Testing UOM MASTER..." -ForegroundColor Yellow
try {
    $uom = @{
        uom_short_name = "KG"
        uom_description = "Kilogram"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$apiBase/uom" -Method Post -Body $uom -ContentType "application/json"
    Write-Host "   ✓ UOM created: $($response.data.uom_short_name)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: GST Rate Master
Write-Host "`n3. Testing GST RATE MASTER..." -ForegroundColor Yellow
try {
    $gst = @{
        gst_details = "GST 18%"
        hsn_code = "7326"
        gst_rate = 18
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$apiBase/gstrates" -Method Post -Body $gst -ContentType "application/json"
    Write-Host "   ✓ GST Rate created: $($response.data.gst_details)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Supplier Master
Write-Host "`n4. Testing SUPPLIER MASTER..." -ForegroundColor Yellow
try {
    $supplier = @{
        supplier_name = "ABC Steel Suppliers"
        address_line1 = "123 Industrial Area"
        address_line2 = "Phase 1"
        city = "Mumbai"
        state = "Maharashtra"
        gstn = "27AABCU9603R1ZM"
        contact_person1 = "Rajesh Kumar"
        mobile_no = "9876543210"
        contact_person2 = "Amit Shah"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$apiBase/suppliers" -Method Post -Body $supplier -ContentType "application/json"
    Write-Host "   ✓ Supplier created: $($response.data.supplier_name)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Customer Master
Write-Host "`n5. Testing CUSTOMER MASTER..." -ForegroundColor Yellow
try {
    $customer = @{
        customer_name = "XYZ Manufacturing Ltd"
        address_line1 = "456 Business Park"
        address_line2 = "Sector 5"
        city = "Pune"
        state = "Maharashtra"
        gstn = "27AACCA1234E1ZL"
        contact_person1 = "Suresh Patil"
        mobile_no = "9123456789"
        contact_person2 = "Prakash Joshi"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$apiBase/customers" -Method Post -Body $customer -ContentType "application/json"
    Write-Host "   ✓ Customer created: $($response.data.customer_name)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Transporter Master
Write-Host "`n6. Testing TRANSPORTER MASTER..." -ForegroundColor Yellow
try {
    $transporter = @{
        transporter_name = "Fast Logistics Pvt Ltd"
        address_line1 = "789 Transport Nagar"
        address_line2 = "Near Highway"
        city = "Nashik"
        state = "Maharashtra"
        gstn = "27AABCT1234F1Z5"
        contact_person1 = "Vikram Singh"
        mobile_no = "9988776655"
        contact_person2 = "Ravi Sharma"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$apiBase/transporters" -Method Post -Body $transporter -ContentType "application/json"
    Write-Host "   ✓ Transporter created: $($response.data.transporter_name)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 7: Item Master
Write-Host "`n7. Testing ITEM MASTER..." -ForegroundColor Yellow
try {
    $item = @{
        item_name = "Steel Rod 10mm"
        alias = "SR10"
        category_id = 1
        uom_id = 1
        gst_rate_id = 1
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$apiBase/items" -Method Post -Body $item -ContentType "application/json"
    Write-Host "   ✓ Item created: $($response.data.item_name)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 8: Order Management
Write-Host "`n8. Testing ORDER MANAGEMENT..." -ForegroundColor Yellow
try {
    $order = @{
        customer_id = 1
        order_date = (Get-Date -Format "yyyy-MM-dd")
        po_no = "PO-2025-001"
        estimated_delivery_date = (Get-Date).AddDays(30).ToString("yyyy-MM-dd")
        items = @(
            @{
                item_id = 1
                quantity = 1000
                rate = 50
            }
        )
    } | ConvertTo-Json -Depth 10
    
    $response = Invoke-RestMethod -Uri "$apiBase/orders" -Method Post -Body $order -ContentType "application/json"
    Write-Host "   ✓ Order created: $($response.data.order_no)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Display Summary
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  TESTING SUMMARY" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan

Write-Host "`nFetching all data..." -ForegroundColor Yellow

# Get counts
try {
    $categories = Invoke-RestMethod -Uri "$apiBase/categories" -Method Get
    $uoms = Invoke-RestMethod -Uri "$apiBase/uom" -Method Get
    $gstrates = Invoke-RestMethod -Uri "$apiBase/gstrates" -Method Get
    $suppliers = Invoke-RestMethod -Uri "$apiBase/suppliers" -Method Get
    $customers = Invoke-RestMethod -Uri "$apiBase/customers" -Method Get
    $transporters = Invoke-RestMethod -Uri "$apiBase/transporters" -Method Get
    $items = Invoke-RestMethod -Uri "$apiBase/items" -Method Get
    $orders = Invoke-RestMethod -Uri "$apiBase/orders" -Method Get

    Write-Host "`n✓ Categories: $($categories.data.Count)" -ForegroundColor Green
    Write-Host "✓ UOM: $($uoms.data.Count)" -ForegroundColor Green
    Write-Host "✓ GST Rates: $($gstrates.data.Count)" -ForegroundColor Green
    Write-Host "✓ Suppliers: $($suppliers.data.Count)" -ForegroundColor Green
    Write-Host "✓ Customers: $($customers.data.Count)" -ForegroundColor Green
    Write-Host "✓ Transporters: $($transporters.data.Count)" -ForegroundColor Green
    Write-Host "✓ Items: $($items.data.Count)" -ForegroundColor Green
    Write-Host "✓ Orders: $($orders.data.Count)" -ForegroundColor Green
} catch {
    Write-Host "`n✗ Error fetching summary: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  ALL MODULES TESTED!" -ForegroundColor Green
Write-Host "============================================`n" -ForegroundColor Cyan

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Refresh your browser at http://localhost:5173" -ForegroundColor White
Write-Host "2. Navigate to each module in the sidebar" -ForegroundColor White
Write-Host "3. You should see the dummy data created above`n" -ForegroundColor White

# Order Management Testing Guide

## Create Order Form - Testing Instructions

### Access the Form
1. Navigate to: http://localhost:5173
2. Click on "Orders" in the sidebar
3. Click on "Create Order"

---

## Test Scenario 1: Same State Customer (CGST + SGST)

### Setup:
1. Select a customer from Maharashtra state
2. Company state is also Maharashtra

### Expected GST Calculation:
- CGST = (Amount × GST Rate) ÷ 2
- SGST = (Amount × GST Rate) ÷ 2
- IGST = 0

### Example:
- Item: Steel Product with 18% GST
- Quantity: 100
- Rate: 50
- Amount: 100 × 50 = 5000
- **CGST: 5000 × 18% ÷ 2 = 450**
- **SGST: 5000 × 18% ÷ 2 = 450**
- **IGST: 0**
- **Total: 5000 + 450 + 450 + 0 = 5900**

---

## Test Scenario 2: Different State Customer (IGST)

### Setup:
1. Select a customer from Karnataka (or any state other than Maharashtra)

### Expected GST Calculation:
- CGST = 0
- SGST = 0
- IGST = Amount × GST Rate

### Example:
- Item: Steel Product with 18% GST
- Quantity: 100
- Rate: 50
- Amount: 100 × 50 = 5000
- **CGST: 0**
- **SGST: 0**
- **IGST: 5000 × 18% = 900**
- **Total: 5000 + 0 + 0 + 900 = 5900**

---

## Test Scenario 3: Multiple Items

### Add multiple line items:
1. Click "Add Item" button
2. Add 3-4 different items with varying quantities
3. Verify totals row shows sum of all columns

### Expected Behavior:
- Each row calculates independently
- Totals row shows:
  - Sum of all quantities
  - Sum of all bags
  - Sum of all amounts
  - Sum of all CGST
  - Sum of all SGST
  - Sum of all IGST
  - Sum of all totals

---

## Test Scenario 4: Bag Calculation

### Verify automatic bag calculation:
- Enter Quantity: 100
- **Expected Bag Count: 100 ÷ 25 = 4.000**

- Enter Quantity: 50
- **Expected Bag Count: 50 ÷ 25 = 2.000**

- Enter Quantity: 37.5
- **Expected Bag Count: 37.5 ÷ 25 = 1.500**

---

## Test Scenario 5: Item Selection Auto-Population

### When selecting an item:
1. Choose an item from dropdown
2. Verify the following auto-populate:
   - ✅ Rate (from item master)
   - ✅ GST Rate (from item's GST rate)

### Then:
3. Enter quantity
4. Verify calculations trigger automatically:
   - ✅ Bag count
   - ✅ Amount
   - ✅ CGST/SGST/IGST
   - ✅ Total

---

## Test Scenario 6: Customer Change Recalculation

### Test GST recalculation when customer changes:
1. Select a Maharashtra customer
2. Add items (observe CGST + SGST)
3. Change customer to Karnataka
4. **Verify**: All items recalculate to show IGST instead

---

## Test Scenario 7: Form Validation

### Required Fields:
- Customer Name (should show error if not selected)
- Order Date (should show error if empty)
- At least one valid item with quantity and rate

### Test:
1. Try to submit without customer → Should show error
2. Try to submit without order date → Should show error
3. Try to submit with empty items → Should show error
4. Add valid data → Should save successfully

---

## Test Scenario 8: File Upload

### Test PO Copy Upload:
1. Click "Choose File" under Upload PO Copy
2. Select a PDF or image file
3. Verify filename appears next to button
4. Submit form and check if file is processed

---

## Test Scenario 9: Remove Items

### Test removing line items:
1. Add 3 items
2. Click delete icon on middle item
3. Verify item is removed
4. Verify totals recalculate correctly
5. Try to remove last item → Should show error "At least one item is required"

---

## Test Scenario 10: Order Number Generation

### Verify auto-generation:
1. Before save: Shows "Auto Generate"
2. After save: Should generate unique order number (e.g., ORD-0001, ORD-0002)
3. Create another order → Should increment (ORD-0003)

---

## Expected Database Records

### After successful order creation, verify in database:

#### orders table:
```sql
SELECT * FROM orders ORDER BY id DESC LIMIT 1;
```
Should show:
- order_no (e.g., ORD-0001)
- customer_id
- order_date
- po_no (if provided)
- estimated_delivery_date (if provided)
- status = 'Pending'

#### order_items table:
```sql
SELECT * FROM order_items WHERE order_id = [last_order_id];
```
Should show for each item:
- item_id
- quantity
- bag_count (quantity ÷ 25)
- rate
- amount (quantity × rate)
- cgst, sgst, igst (based on customer state)
- total_amount (amount + cgst + sgst + igst)

---

## Common Issues to Check

### ✅ If GST not calculating:
- Check customer has state set in Customer Master
- Check item has GST rate set in Item Master

### ✅ If bag count not calculating:
- Verify quantity is entered as number
- Check calculation: qty ÷ 25

### ✅ If dropdown not loading:
- Check backend server is running (port 3000)
- Check API calls in browser console
- Verify master data exists (customers, items)

### ✅ If form not submitting:
- Check browser console for errors
- Verify all required fields filled
- Check backend logs for server errors

---

## Success Indicators

### Form should show:
- ✅ Green success toast: "Order created successfully"
- ✅ Form resets to empty state
- ✅ Order number resets to "Auto Generate"
- ✅ Line items reset to single empty row

### Database should have:
- ✅ New order record in orders table
- ✅ Corresponding order_items records
- ✅ Correct GST calculations stored
- ✅ Bag counts stored correctly

---

## Browser Console Commands for Testing

### Check API calls:
```javascript
// In browser console at http://localhost:5173

// Fetch customers
fetch('http://localhost:3000/api/customers').then(r => r.json()).then(console.log)

// Fetch items
fetch('http://localhost:3000/api/items').then(r => r.json()).then(console.log)

// Check orders
fetch('http://localhost:3000/api/orders').then(r => r.json()).then(console.log)
```

---

## Notes

1. **Company State** is set to "Maharashtra" in constants.js
2. **Bags Per Quantity** is set to 25 (configurable in constants.js)
3. **GST Calculation** happens on both frontend (for display) and backend (for data integrity)
4. **All calculations** use 2 decimal places for amounts, 3 for quantities/bags
5. **File upload** feature implemented but may need backend storage configuration

---

## Next Steps After Testing

1. ✅ Test order creation with sample data
2. ✅ Verify GST calculations for both same/different state
3. ✅ Check database records are correct
4. ⬜ Implement Order List view to see created orders
5. ⬜ Implement Order Edit functionality
6. ⬜ Implement Dispatch Management
7. ⬜ Add order status tracking
8. ⬜ Generate invoice/delivery challan

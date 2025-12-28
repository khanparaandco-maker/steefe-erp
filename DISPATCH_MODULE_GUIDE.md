# Dispatch Details Module Guide

## Overview
The Dispatch Details module allows partial order dispatch until the order item is fulfilled. Multiple dispatch entries are allowed and stored separately for each order.

## Features

### 1. Order Selection
- **Order No Dropdown**: Shows only pending orders (orders with remaining balance quantities)
- **Auto-populate**: Customer name is automatically filled from selected order
- **Dispatch Date**: User input field for dispatch date

### 2. Order Items Table
The table displays all items from the selected order with:

| Column | Description |
|--------|-------------|
| Sr No | Serial number |
| Item | Item name from order |
| QTY Ordered | Original quantity ordered |
| QTY Dispatched | Total quantity dispatched so far (sum of all previous dispatches) |
| Balance Qty | Remaining quantity to be dispatched (Ordered - Dispatched) |
| New Dispatched | User input for current dispatch quantity |

**Validation Rules:**
- New dispatch quantity cannot exceed balance quantity
- At least one item must have a dispatch quantity > 0
- Only items with balance > 0 are shown

### 3. Dispatch Details
Required Fields:
- **Transporter Name**: Selected from Transporter Master
- **LR No**: User input
- **LR Date**: User input  
- **Invoice No**: Required field
- **Invoice Date**: Required field
- **Upload**: LR Copy file upload

### 4. Order Status Logic

#### Pending Order Definition
An order is considered "pending" when:
- Item Ordered > Item Dispatched (for any item in the order)
- Not all ordered items have been fully dispatched

#### Order Completion
An order is marked as "completed" when:
- All items in the order are fully dispatched
- For each item: Ordered Quantity = Total Dispatched Quantity

### 5. Multiple Dispatch Entries
- Multiple dispatch entries are allowed for the same order
- Each dispatch is stored separately with:
  - Unique dispatch ID
  - Dispatch date
  - Dispatch items with quantities
  - Transport and invoice details
- Balance quantities are automatically recalculated using the `order_items_balance` view

## Database Structure

### Tables Used
1. **dispatches**: Stores dispatch header information
2. **dispatch_items**: Stores individual item dispatch quantities
3. **order_items_balance**: VIEW that automatically calculates balance quantities

### View: order_items_balance
Automatically calculates:
```sql
ordered_quantity = order_items.quantity
dispatched_quantity = SUM(dispatch_items.quantity_dispatched)
balance_quantity = ordered_quantity - dispatched_quantity
```

## API Endpoints

### Create Dispatch
```
POST /api/dispatches
Body: {
  order_id: number,
  dispatch_date: date,
  transporter_id: number (optional),
  lr_no: string (optional),
  lr_date: date (optional),
  invoice_no: string (required),
  invoice_date: date (required),
  items: [{
    order_item_id: number,
    quantity_dispatched: number
  }]
}
```

### Get Pending Orders
```
GET /api/orders?status=pending
```
Returns orders that have items with balance quantity > 0

### Get Dispatch History
```
GET /api/dispatches/order/:order_id/history
```
Returns all dispatch entries for a specific order

## Validation Rules

1. **Order Level**:
   - Order must exist and be in pending status
   - At least one item must have balance quantity > 0

2. **Item Level**:
   - Each dispatch quantity must be > 0
   - Dispatch quantity cannot exceed balance quantity
   - Order item must exist and belong to the selected order

3. **Dispatch Level**:
   - Invoice number is mandatory
   - Invoice date is mandatory
   - Dispatch date is mandatory
   - Multiple dispatches allowed until order is complete

## Usage Flow

1. **Select Order**: Choose from pending orders dropdown
2. **View Balance**: System shows current balance for all items
3. **Enter Quantities**: Input dispatch quantities (≤ balance)
4. **Fill Details**: Enter transport and invoice information
5. **Save**: System validates and creates dispatch entry
6. **Auto-Update**: Order status auto-updates to "completed" when all items dispatched

## Notes

- Pending orders are filtered automatically to show only orders with remaining balance
- The system prevents over-dispatching (quantity > balance)
- Each dispatch is independent and tracked separately
- Order completion is automatic when all items are fully dispatched
- The order_items_balance view ensures accurate balance calculations

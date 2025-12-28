# SteelMelt ERP - API Documentation

## Overview
Backend API for SteelMelt ERP - Manufacturing ERP System for Steel Product Company (Melting Furnace/Heat Treatment)

**Base URL:** `http://localhost:3000/api`

**Tech Stack:** Node.js, Express, PostgreSQL

**Date Format:** YYYY-MM-DD (ISO 8601)

**Response Format:** All endpoints return JSON with the following structure:
```json
{
  "success": true|false,
  "message": "Optional message",
  "data": { ... }
}
```

## Table of Contents
1. [Authentication APIs](#authentication-apis)
   - [Login](#login)
   - [Logout](#logout)
   - [Current User](#current-user)
   - [Change Password](#change-password)
2. [User Management APIs](#user-management-apis)
   - [Users CRUD](#users-crud)
   - [User Permissions](#user-permissions)
   - [Roles & Modules](#roles--modules)
3. [Master Data APIs](#master-data-apis)
   - [Suppliers](#suppliers)
   - [Categories](#categories)
   - [UOM (Units of Measure)](#uom)
   - [GST Rates](#gst-rates)
   - [Items](#items)
   - [Transporters](#transporters)
   - [Customers](#customers)
2. [Transaction APIs](#transaction-apis)
   - [Orders](#orders)
   - [Dispatches](#dispatches)
3. [GRN APIs](#grn-apis)
   - [Scrap GRN](#scrap-grn)
4. [Manufacturing APIs](#manufacturing-apis)
   - [Melting Processes](#melting-processes)

---

## Authentication APIs

### Login

**Authenticate user and get JWT token**

```
POST /api/auth/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "admin",
  "password": "Admin@123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@steelmelt.com",
      "full_name": "Administrator",
      "is_active": true,
      "role_id": 1,
      "role_name": "Super Admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "permissions": [
      {
        "module_name": "Dashboard",
        "can_view": true,
        "can_create": true,
        "can_edit": true,
        "can_delete": true
      }
    ]
  }
}
```

**Response (Failed):**
```json
{
  "success": false,
  "error": "Invalid username or password"
}
```

**Account Lockout:**
- After 5 failed attempts, account is locked for 30 minutes
- Response: `"Account is locked. Try again after <time>"`

---

### Logout

**Invalidate current JWT session**

```
POST /api/auth/logout
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Current User

**Get current authenticated user info with permissions**

```
GET /api/auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@steelmelt.com",
    "full_name": "Administrator",
    "is_active": true,
    "role_id": 1,
    "role_name": "Super Admin",
    "permissions": [
      {
        "module_name": "Orders",
        "can_view": true,
        "can_create": true,
        "can_edit": true,
        "can_delete": true
      }
    ]
  }
}
```

---

### Change Password

**Change current user's password**

```
POST /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "current_password": "Admin@123",
  "new_password": "NewSecure@456"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Response (Success):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Response (Failed):**
```json
{
  "success": false,
  "error": "Current password is incorrect"
}
```

---

## User Management APIs

### Users CRUD

**All user management endpoints require authentication and 'User Management' permission.**

#### Get All Users

```
GET /api/users
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@steelmelt.com",
      "full_name": "Administrator",
      "is_active": true,
      "failed_login_attempts": 0,
      "locked_until": null,
      "last_login": "2024-11-20T10:00:00.000Z",
      "roles": [
        {
          "role_id": 1,
          "role_name": "Super Admin"
        }
      ]
    }
  ]
}
```

#### Get User by ID

```
GET /api/users/:id
Authorization: Bearer <token>
```

#### Create User

```
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "Secure@123",
  "full_name": "John Doe",
  "role_ids": [2]
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": { "id": 2 }
}
```

#### Update User

```
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "newemail@example.com",
  "full_name": "John Updated",
  "is_active": true,
  "role_ids": [2, 3]
}
```

#### Delete User

```
DELETE /api/users/:id
Authorization: Bearer <token>
```

**Note:** Cannot delete yourself or the last Super Admin.

---

### User Permissions

#### Get User Permissions

```
GET /api/users/:id/permissions
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "module_id": 1,
      "module_name": "Dashboard",
      "can_view": true,
      "can_create": true,
      "can_edit": true,
      "can_delete": true
    }
  ]
}
```

#### Update User Permissions

```
PUT /api/users/:id/permissions
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "role_ids": [2]
}
```

**Note:** Permissions are managed through roles. Updating role_ids will automatically update all permissions.

---

### Roles & Modules

#### Get All Roles

```
GET /api/users/roles/all
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "role_name": "Super Admin",
      "description": "Full system access"
    },
    {
      "id": 2,
      "role_name": "Manager",
      "description": "Management level access"
    }
  ]
}
```

#### Get All Modules

```
GET /api/users/modules/all
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "module_name": "Dashboard",
      "parent_module_id": null
    },
    {
      "id": 2,
      "module_name": "Orders",
      "parent_module_id": null
    },
    {
      "id": 10,
      "module_name": "Suppliers",
      "parent_module_id": 3
    }
  ]
}
```

**Total Modules:** 35 (8 main menus + 27 submenus)

---

## Authentication Flow

### Using JWT Token in Requests

**All protected endpoints require JWT token in Authorization header:**

```bash
# Step 1: Login to get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123"}'

# Response: {"success":true,"data":{"token":"eyJhbGc..."}}

# Step 2: Use token in subsequent requests
curl -H "Authorization: Bearer eyJhbGc..." \
  http://localhost:3000/api/orders
```

### Token Expiration

- **Expiry Time:** 8 hours
- **After Expiration:** 401 Unauthorized error
- **Action Required:** Login again to get new token

### Permission Errors

**403 Forbidden:**
```json
{
  "success": false,
  "error": "Access denied. You don't have permission to perform this action."
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "Authentication required"
}
```

---

## Master Data APIs

**Note: All master data endpoints now require authentication.**

### Suppliers

#### Get All Suppliers
```
GET /api/suppliers
```

**Query Parameters:**
- `name` (optional): Filter by name (partial match)
- `city` (optional): Filter by city
- `state` (optional): Filter by state

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "ABC Steel Suppliers",
      "address_line1": "123 Main St",
      "address_line2": "Building A",
      "city": "Mumbai",
      "state": "Maharashtra",
      "gstn": "27ABCDE1234F1Z5",
      "contact_person1": "John Doe",
      "mobile": "9876543210",
      "contact_person2": "Jane Smith",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Get Supplier by ID
```
GET /api/suppliers/:id
```

#### Create Supplier
```
POST /api/suppliers
Content-Type: application/json

{
  "name": "ABC Steel Suppliers",
  "address_line1": "123 Main St",
  "address_line2": "Building A",
  "city": "Mumbai",
  "state": "Maharashtra",
  "gstn": "27ABCDE1234F1Z5",
  "contact_person1": "John Doe",
  "mobile": "9876543210",
  "contact_person2": "Jane Smith"
}
```

#### Update Supplier
```
PUT /api/suppliers/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "city": "Pune"
}
```

#### Delete Supplier
```
DELETE /api/suppliers/:id
```

---

### Categories

#### Get All Categories
```
GET /api/categories
```

#### Get Category by ID
```
GET /api/categories/:id
```

#### Create Category
```
POST /api/categories
Content-Type: application/json

{
  "name": "Finished Product",
  "alias": "FP"
}
```

#### Update Category
```
PUT /api/categories/:id
```

#### Delete Category
```
DELETE /api/categories/:id
```

---

### UOM

#### Get All UOMs
```
GET /api/uom
```

#### Get UOM by ID
```
GET /api/uom/:id
```

#### Create UOM
```
POST /api/uom
Content-Type: application/json

{
  "short_name": "KG",
  "description": "Kilogram"
}
```

#### Update UOM
```
PUT /api/uom/:id
```

#### Delete UOM
```
DELETE /api/uom/:id
```

---

### GST Rates

#### Get All GST Rates
```
GET /api/gst-rates
```

**Query Parameters:**
- `hsn_code` (optional): Filter by HSN code
- `is_active` (optional): Filter by active status (true/false)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "hsn_code": "7201",
      "rate_percentage": 18.00,
      "effective_date": "2023-01-01",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Get Active GST Rate by HSN Code
```
GET /api/gst-rates/hsn/:hsn_code
```

#### Create GST Rate
```
POST /api/gst-rates
Content-Type: application/json

{
  "hsn_code": "7201",
  "rate_percentage": 18.00,
  "effective_date": "2023-01-01",
  "is_active": true
}
```

#### Update GST Rate
```
PUT /api/gst-rates/:id
```

#### Delete GST Rate
```
DELETE /api/gst-rates/:id
```

---

### Items

#### Get All Items
```
GET /api/items
```

**Query Parameters:**
- `name` (optional): Filter by name (partial match)
- `category_id` (optional): Filter by category

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Steel Bar 10mm",
      "alias": "SB10",
      "category_id": 1,
      "category_name": "Finished Product",
      "uom_id": 1,
      "uom_name": "KG",
      "gst_rate_id": 1,
      "hsn_code": "7201",
      "gst_rate": 18.00,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Get Item by ID
```
GET /api/items/:id
```

#### Create Item
```
POST /api/items
Content-Type: application/json

{
  "name": "Steel Bar 10mm",
  "alias": "SB10",
  "category_id": 1,
  "uom_id": 1,
  "gst_rate_id": 1
}
```

#### Update Item
```
PUT /api/items/:id
```

#### Delete Item
```
DELETE /api/items/:id
```

---

### Transporters

Same CRUD structure as Suppliers:
```
GET    /api/transporters
GET    /api/transporters/:id
POST   /api/transporters
PUT    /api/transporters/:id
DELETE /api/transporters/:id
```

**Create Request Body:**
```json
{
  "name": "XYZ Transport",
  "address_line1": "456 Transport Rd",
  "city": "Mumbai",
  "state": "Maharashtra",
  "gstn": "27XYZAB1234C1D2",
  "contact_person": "Transport Manager",
  "mobile": "9876543210"
}
```

---

### Customers

#### Get All Customers
```
GET /api/customers
```

**Query Parameters:**
- `name` (optional): Filter by name (partial match)
- `city` (optional): Filter by city
- `state` (optional): Filter by state

#### Create Customer
```
POST /api/customers
Content-Type: application/json

{
  "name": "ABC Manufacturing Ltd",
  "address_line1": "789 Industrial Area",
  "city": "Pune",
  "state": "Maharashtra",
  "gstn": "27ABCDE5678F1G2",
  "contact_person": "Purchase Manager",
  "mobile": "9876543210"
}
```

**Note:** `state` field is **required** as it's used for GST calculations.

---

## Transaction APIs

### Orders

#### Get All Orders
```
GET /api/orders
```

**Query Parameters:**
- `status` (optional): Filter by status (Pending/Completed)
- `customer_id` (optional): Filter by customer
- `from_date` (optional): Filter from date (YYYY-MM-DD)
- `to_date` (optional): Filter to date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "order_no": "ORD-202411-00001",
      "customer_id": 1,
      "customer_name": "ABC Manufacturing Ltd",
      "customer_state": "Maharashtra",
      "order_date": "2024-11-01",
      "po_no": "PO-2024-001",
      "estimated_delivery_date": "2024-11-15",
      "status": "Pending",
      "total_items": 3,
      "order_total": 125000.00,
      "created_at": "2024-11-01T10:00:00.000Z",
      "updated_at": "2024-11-01T10:00:00.000Z"
    }
  ]
}
```

#### Get Order by ID (with items)
```
GET /api/orders/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "order_no": "ORD-202411-00001",
    "customer_id": 1,
    "customer_name": "ABC Manufacturing Ltd",
    "customer_state": "Maharashtra",
    "order_date": "2024-11-01",
    "po_no": "PO-2024-001",
    "estimated_delivery_date": "2024-11-15",
    "status": "Pending",
    "items": [
      {
        "id": 1,
        "order_id": 1,
        "item_id": 1,
        "item_name": "Steel Bar 10mm",
        "item_alias": "SB10",
        "uom": "KG",
        "quantity": 1000.000,
        "bag_count": 40.000,
        "rate": 50.00,
        "amount": 50000.00,
        "cgst": 4500.00,
        "sgst": 4500.00,
        "igst": 0.00,
        "total_amount": 59000.00,
        "dispatched_quantity": 500.000,
        "balance_quantity": 500.000
      }
    ]
  }
}
```

#### Create Order
```
POST /api/orders
Content-Type: application/json

{
  "customer_id": 1,
  "order_date": "2024-11-01",
  "po_no": "PO-2024-001",
  "estimated_delivery_date": "2024-11-15",
  "items": [
    {
      "item_id": 1,
      "quantity": 1000,
      "rate": 50.00
    },
    {
      "item_id": 2,
      "quantity": 500,
      "rate": 75.00
    }
  ]
}
```

**Business Logic Applied:**
1. **Order Number:** Auto-generated as `ORD-YYYYMM-XXXXX`
2. **Bag Count:** Auto-calculated as `quantity / 25`
3. **GST Calculation:**
   - If customer state == company state (from .env): `CGST + SGST`
   - If different states: `IGST`
4. **Status:** Initially set to "Pending"

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order": { ... },
    "items": [ ... ]
  }
}
```

#### Update Order (Header Only)
```
PUT /api/orders/:id
Content-Type: application/json

{
  "po_no": "PO-2024-001-REV",
  "estimated_delivery_date": "2024-11-20"
}
```

#### Get Pending Orders (for dispatch)
```
GET /api/orders/status/pending
```

Returns orders with status "Pending" that have items with balance > 0.

#### Get Order Items Balance
```
GET /api/orders/:id/balance
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "order_item_id": 1,
      "item_id": 1,
      "item_name": "Steel Bar 10mm",
      "item_alias": "SB10",
      "uom": "KG",
      "ordered_quantity": 1000.000,
      "dispatched_quantity": 500.000,
      "balance_quantity": 500.000,
      "rate": 50.00,
      "ordered_bag_count": 40.000
    }
  ]
}
```

#### Delete Order
```
DELETE /api/orders/:id
```

**Note:** Cannot delete orders that have dispatches.

---

### Dispatches

#### Get All Dispatches
```
GET /api/dispatches
```

**Query Parameters:**
- `order_id` (optional): Filter by order
- `from_date` (optional): Filter from date
- `to_date` (optional): Filter to date

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "order_id": 1,
      "order_no": "ORD-202411-00001",
      "customer_id": 1,
      "customer_name": "ABC Manufacturing Ltd",
      "dispatch_date": "2024-11-05",
      "transporter_id": 1,
      "transporter_name": "XYZ Transport",
      "lr_no": "LR-12345",
      "lr_date": "2024-11-05",
      "invoice_no": "INV-2024-001",
      "invoice_date": "2024-11-05",
      "upload_path": "/uploads/invoice_001.pdf",
      "total_items": 2,
      "total_quantity": 500.000,
      "created_at": "2024-11-05T10:00:00.000Z",
      "updated_at": "2024-11-05T10:00:00.000Z"
    }
  ]
}
```

#### Get Dispatch by ID (with items)
```
GET /api/dispatches/:id
```

#### Create Dispatch
```
POST /api/dispatches
Content-Type: application/json

{
  "order_id": 1,
  "dispatch_date": "2024-11-05",
  "transporter_id": 1,
  "lr_no": "LR-12345",
  "lr_date": "2024-11-05",
  "invoice_no": "INV-2024-001",
  "invoice_date": "2024-11-05",
  "upload_path": "/uploads/invoice_001.pdf",
  "items": [
    {
      "order_item_id": 1,
      "quantity_dispatched": 500
    },
    {
      "order_item_id": 2,
      "quantity_dispatched": 250
    }
  ]
}
```

**Business Logic Applied:**
1. **Balance Validation:** Dispatch quantity cannot exceed balance quantity
2. **Order Status Update:** 
   - Automatically set to "Completed" when all items have balance = 0
   - Remains "Pending" if any item has balance > 0
3. **Trigger-based:** Status update happens automatically via database trigger

**Validation Errors:**
```json
{
  "success": false,
  "error": "Dispatch quantity 600 exceeds balance quantity 500 for order item 1"
}
```

#### Update Dispatch (Header Only)
```
PUT /api/dispatches/:id
Content-Type: application/json

{
  "lr_no": "LR-12345-REV",
  "invoice_no": "INV-2024-001-REV"
}
```

#### Delete Dispatch
```
DELETE /api/dispatches/:id
```

**Note:** Deleting a dispatch will trigger order status recalculation.

#### Get Dispatch History for Order
```
GET /api/dispatches/order/:order_id/history
```

Returns all dispatches made for a specific order.

---

## Error Responses

All error responses follow this structure:

```json
{
  "success": false,
  "error": "Error message",
  "details": { }
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error, business logic violation)
- `404` - Not Found
- `500` - Internal Server Error

### Common Errors

**Validation Error:**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "name",
      "message": "Name is required"
    }
  ]
}
```

**Duplicate Entry:**
```json
{
  "success": false,
  "error": "Duplicate entry. A record with this value already exists.",
  "details": {
    "constraint": "unique_supplier_name"
  }
}
```

**Foreign Key Violation:**
```json
{
  "success": false,
  "error": "Invalid reference. The referenced record does not exist.",
  "details": {
    "constraint": "fk_item_category"
  }
}
```

---

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and update:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=steelmelt_erp
DB_USER=postgres
DB_PASSWORD=your_password
COMPANY_STATE=Maharashtra
```

### 3. Initialize Database
```bash
npm run init-db
```

This will create all tables, views, functions, and sample data.

### 4. Start Server
```bash
# Development (with nodemon)
npm run dev

# Production
npm start
```

Server will start on: `http://localhost:3000`

### 5. Health Check
```
GET http://localhost:3000/health
```

---

## Business Rules Summary

### GST Calculation
- **Same State:** CGST = (Amount × Rate%) / 2, SGST = (Amount × Rate%) / 2, IGST = 0
- **Different State:** CGST = 0, SGST = 0, IGST = Amount × Rate%
- Company state is defined in `.env` as `COMPANY_STATE`

### Bag Count Calculation
- Formula: `Bag Count = Quantity / 25`
- Configurable via `BAGS_PER_QUANTITY` in `.env`

### Order Status
- **Pending:** At least one item has balance > 0
- **Completed:** All items have balance = 0
- Status updates automatically when dispatches are created/deleted

### Dispatch Validation
- Dispatch quantity must be > 0
- Dispatch quantity cannot exceed balance quantity
- Order must exist and be valid

---

## Database Views

### order_items_balance
Shows real-time balance for each order item:
```sql
SELECT * FROM order_items_balance WHERE order_id = 1;
```

### order_status_summary
Shows order summary with totals:
```sql
SELECT * FROM order_status_summary WHERE status = 'Pending';
```

---

## GRN APIs

### Scrap GRN

#### Get All Scrap GRNs
```
GET /api/scrap-grn
```

**Query Parameters:**
- `from_date` (optional): Start date (YYYY-MM-DD)
- `to_date` (optional): End date (YYYY-MM-DD)
- `supplier_id` (optional): Filter by supplier ID
- `status` (optional): Filter by status (Pending, Approved, Rejected)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "grn_date": "2025-01-15",
      "grn_no": "GRN-001",
      "supplier_id": 5,
      "supplier_name": "ABC Scrap Dealers",
      "weight": 5000.00,
      "rate": 45.50,
      "amount": 227500.00,
      "remarks": "High quality scrap",
      "file_path": "/uploads/grn/grn_001.pdf",
      "status": "Approved",
      "created_at": "2025-01-15T10:00:00.000Z"
    }
  ]
}
```

#### Create Scrap GRN
```
POST /api/scrap-grn
Content-Type: multipart/form-data
```

**Body Parameters:**
- `grn_date` (required): GRN date (YYYY-MM-DD)
- `grn_no` (required): GRN number (unique)
- `supplier_id` (required): Supplier ID (foreign key)
- `weight` (required): Weight in kg (decimal)
- `rate` (required): Rate per kg (decimal)
- `remarks` (optional): Additional notes
- `file` (optional): File upload (PDF, JPG, PNG)

**Response:**
```json
{
  "success": true,
  "message": "Scrap GRN created successfully",
  "data": { "id": 1 }
}
```

#### Update Scrap GRN
```
PUT /api/scrap-grn/:id
Content-Type: multipart/form-data
```

**Body Parameters:** Same as Create

#### Delete Scrap GRN
```
DELETE /api/scrap-grn/:id
```

---

## Manufacturing APIs

### Melting Processes

#### Get All Melting Processes
```
GET /api/melting-processes
```

**Query Parameters:**
- `from_date` (optional): Start date (YYYY-MM-DD)
- `to_date` (optional): End date (YYYY-MM-DD)
- `heat_no` (optional): Filter by heat number (1-10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "melting_date": "2025-01-15",
      "heat_no": 1,
      "scrap_weight": "100+200+250",
      "scrap_total": 550.00,
      "time_in": "08:00:00",
      "time_out": "10:30:00",
      "carbon": 0.45,
      "manganese": 0.75,
      "silicon": 0.30,
      "aluminium": 0.02,
      "calcium": 0.01,
      "temperature": 1650,
      "spectro_count": 3,
      "created_at": "2025-01-15T08:00:00.000Z"
    }
  ]
}
```

#### Get Melting Process by ID
```
GET /api/melting-processes/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "melting_date": "2025-01-15",
    "heat_no": 1,
    "scrap_weight": "100+200+250",
    "scrap_total": 550.00,
    "time_in": "08:00:00",
    "time_out": "10:30:00",
    "carbon": 0.45,
    "manganese": 0.75,
    "silicon": 0.30,
    "aluminium": 0.02,
    "calcium": 0.01,
    "temperature": 1650,
    "spectro_readings": [
      {
        "id": 1,
        "carbon": 0.45,
        "silicon": 0.28,
        "manganese": 0.74,
        "phosphorus": 0.03,
        "sulphur": 0.02,
        "chrome": 0.15,
        "reading_sequence": 1
      },
      {
        "id": 2,
        "carbon": 0.46,
        "silicon": 0.29,
        "manganese": 0.76,
        "phosphorus": 0.03,
        "sulphur": 0.02,
        "chrome": 0.16,
        "reading_sequence": 2
      }
    ],
    "created_at": "2025-01-15T08:00:00.000Z"
  }
}
```

#### Create Melting Process
```
POST /api/melting-processes
Content-Type: application/json
```

**Body Parameters:**
```json
{
  "melting_date": "2025-01-15",
  "heat_no": 1,
  "scrap_weight": "100+200+250",
  "time_in": "08:00",
  "time_out": "10:30",
  "carbon": 0.45,
  "manganese": 0.75,
  "silicon": 0.30,
  "aluminium": 0.02,
  "calcium": 0.01,
  "temperature": 1650,
  "spectro_readings": [
    {
      "carbon": 0.45,
      "silicon": 0.28,
      "manganese": 0.74,
      "phosphorus": 0.03,
      "sulphur": 0.02,
      "chrome": 0.15
    }
  ]
}
```

**Validation Rules:**
- `heat_no`: Must be between 1 and 10
- `scrap_weight`: Mathematical expression (e.g., "100+200+250")
- `time_out`: Must be after `time_in`
- `(melting_date, heat_no)`: Must be unique combination
- `spectro_readings`: Array of spectro test results (1 or more)

**Response:**
```json
{
  "success": true,
  "message": "Melting process created successfully",
  "data": { "id": 1 }
}
```

#### Update Melting Process
```
PUT /api/melting-processes/:id
Content-Type: application/json
```

**Body Parameters:** Same as Create

**Response:**
```json
{
  "success": true,
  "message": "Melting process updated successfully",
  "data": { "id": 1 }
}
```

#### Delete Melting Process
```
DELETE /api/melting-processes/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Melting process deleted successfully"
}
```

**Note:** Deleting a melting process will cascade delete all associated spectro readings.

---

## Support
For issues or questions, contact the development team.

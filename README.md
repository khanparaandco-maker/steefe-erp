# SteelMelt ERP - Backend System

> **Manufacturing ERP System for Steel Product Company (Melting Furnace/Heat Treatment)**

A comprehensive Node.js/Express backend with PostgreSQL database for managing manufacturing operations, orders, and dispatches for a steel products company.

## 🚀 Features

### Master Data Management
- **Suppliers** - Manage supplier information with contact details
- **Categories** - Organize items by categories (Raw Materials, Finished Products, etc.)
- **UOM (Units of Measure)** - Define measurement units (KG, MT, PCS, BAG)
- **GST Rates** - Track GST rates by HSN code with historical changes
- **Items** - Product catalog with category, UOM, and GST associations
- **Transporters** - Maintain transporter database with contact info
- **Customers** - Customer management with state-based GST calculation

### User Management & Security 🔐
- **Role-Based Access Control (RBAC)** - 4 default roles (Super Admin, Manager, Operator, View Only)
- **User Authentication** - Secure JWT-based login with bcrypt password hashing
- **Permission Management** - Granular module-level permissions (view, edit, delete, export)
- **Session Management** - Token-based session tracking with expiration
- **Account Security** - Account lockout after 5 failed login attempts (30 min lockout)
- **Audit Logging** - Complete activity tracking for compliance
- **Dynamic UI** - Menu items shown/hidden based on user permissions
- **Default Admin** - Username: `admin`, Password: `Admin@123`

### Transaction Management
- **Orders** - Complete order processing with automatic calculations
  - Auto-generated order numbers (ORD-YYYYMM-XXXXX)
  - Automatic bag count calculation (Quantity / 25)
  - State-based GST calculation (CGST+SGST or IGST)
  - Order status tracking (Pending/Completed)
  
- **Dispatches** - Advanced dispatch management
  - Balance quantity tracking per order item
  - Validation against available balance
  - Automatic order status updates
  - Multiple dispatches per order support
  - LR and Invoice tracking

### GRN Management
- **Scrap GRN** - Goods Receipt Note for scrap purchases
  - Supplier linkage and tracking
  - Weight and rate management
  - Automatic amount calculation
  - File upload support (documents/images)
  - Status tracking (Pending, Approved, Rejected)
  - Date-based filtering and reports

### Manufacturing Management
- **Melting Process** - Steel melting operations tracking
  - Heat number management (1-10 per day)
  - Scrap weight calculator with expression support
  - Time tracking (Time-In, Time-Out)
  - Mineral additions tracking (C, Mn, Si, Al, Ca)
  - Temperature monitoring
  - Multiple spectro test readings per heat
  - Print-friendly process reports
  - Date and heat number filtering

### Business Logic
- ✅ **Automatic GST Calculation** - Same state (CGST+SGST) vs Different state (IGST)
- ✅ **Bag Count Calculation** - Auto-computed based on quantity
- ✅ **Balance Tracking** - Real-time balance for each order item
- ✅ **Status Management** - Orders auto-complete when all items dispatched
- ✅ **Validation** - Dispatch qty cannot exceed balance qty
- ✅ **Scrap Calculator** - Safe expression evaluation for scrap weight
- ✅ **Heat Number Validation** - Unique date+heat combination, range 1-10
- ✅ **Transaction Safety** - Multi-table operations with rollback support

## 📋 Prerequisites

- **Node.js** >= 16.x
- **PostgreSQL** >= 12.x
- **npm** or **yarn**

## 🛠️ Installation

### 1. Clone or Extract the Project
```bash
cd "d:\STEEFE ERP"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
Copy `.env.example` to `.env` and configure:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=steelmelt_erp
DB_USER=steelmelt_user
DB_PASSWORD=steelmelt_password_2024

# Company Configuration (for GST calculation)
COMPANY_STATE=Maharashtra

# Application Settings
BAGS_PER_QUANTITY=25

# Authentication & Security
JWT_SECRET=steelmelt_erp_secret_key_change_in_production_32chars_minimum
JWT_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=10
MAX_LOGIN_ATTEMPTS=5
LOCK_TIME=30
```

### 4. Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE steelmelt_erp;

# Exit
\q
```

### 5. Initialize Database Schema
```bash
npm run init-db
```

This will:
- Create all tables with relationships
- Set up views and functions
- Create triggers for auto-status updates
- Insert sample data for UOM, Categories, and GST Rates

### 5.1 Initialize User Management Schema
```bash
# Run user management schema
psql -U steelmelt_user -d steelmelt_erp -h localhost -f database/user_management_schema.sql
```

This will:
- Create 7 user management tables (users, roles, modules, permissions, user_roles, user_sessions, audit_logs)
- Insert 35 modules (all menus and submenus)
- Create 4 default roles with permissions
- Create default admin user (username: `admin`, password: `Admin@123`)

### 6. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server will start at: **http://localhost:3000**

### 7. Verify Installation
```bash
# Health check
curl http://localhost:3000/health
```

## 📚 API Documentation

Comprehensive API documentation is available in `API_DOCUMENTATION.md`.

**Quick Links:**
- Base URL: `http://localhost:3000/api`
- All responses in JSON format
- Date format: `YYYY-MM-DD`

### API Endpoints Overview

#### Master Data
```
GET/POST/PUT/DELETE  /api/suppliers
GET/POST/PUT/DELETE  /api/categories
GET/POST/PUT/DELETE  /api/uom
GET/POST/PUT/DELETE  /api/gst-rates
GET/POST/PUT/DELETE  /api/items
GET/POST/PUT/DELETE  /api/transporters
GET/POST/PUT/DELETE  /api/customers
```

#### Transactions
```
GET/POST/PUT/DELETE  /api/orders
GET                  /api/orders/status/pending
GET                  /api/orders/:id/balance

GET/POST/PUT/DELETE  /api/dispatches
GET                  /api/dispatches/order/:order_id/history
```

#### GRN
```
GET/POST/PUT/DELETE  /api/scrap-grn
```

#### Manufacturing
```
GET/POST/PUT/DELETE  /api/melting-processes
GET                  /api/melting-processes/:id
```

#### Authentication & Users
```
POST                 /api/auth/login
POST                 /api/auth/logout
GET                  /api/auth/me
POST                 /api/auth/change-password

GET/POST/PUT/DELETE  /api/users
GET                  /api/users/:id
GET                  /api/users/:id/permissions
PUT                  /api/users/:id/permissions
GET                  /api/users/roles/all
GET                  /api/users/modules/all
```

## 🔐 Authentication & Authorization

All API endpoints (except `/api/auth/login`) require authentication via JWT token.

### Login & Session Management

**Login:**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "Admin@123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@steelmelt.com",
      "firstName": "System",
      "lastName": "Administrator"
    },
    "permissions": {
      "Dashboard": { "can_view": true, "can_edit": false, ... },
      "Suppliers": { "can_view": true, "can_edit": true, ... },
      "User Management": { "can_view": true, "can_edit": true, ... }
    }
  }
}
```

**Using the token:**
```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

### Permission System

**4 Pre-configured Roles:**
- **Super Admin** - Full access to all modules including User Management
- **Manager** - Access to business modules, view-only for some operations
- **Operator** - Limited access for daily operations
- **View Only** - Read-only access to reports and data

**Permission Features:**
- ✅ **Role-based Defaults**: Each role has pre-configured permissions for 35 modules
- ✅ **User-specific Overrides**: Super Admin can assign custom permissions to individual users
- ✅ **Permission Hierarchy**: User-specific permissions override role-based defaults
- ✅ **Granular Control**: 4 action types per module (View, Edit, Delete, Export)
- ✅ **Access Control**: User Management restricted to Super Admin only
- ✅ **Dynamic UI**: Frontend menus filter based on user permissions
- ✅ **Session Updates**: Users must logout/login to see updated permissions

**Managing User Permissions (Super Admin Only):**
1. Navigate to User Management page
2. Click the Key icon next to any user
3. Select/deselect permissions for each module
4. Click parent module checkbox to toggle all submodules
5. Save changes
6. User will see updated permissions on next login

### User Management APIs (Super Admin Only)

**List Users:**
```bash
GET /api/users
Authorization: Bearer {admin_token}
```

**Create User:**
```bash
POST /api/users
Authorization: Bearer {admin_token}

{
  "username": "newuser",
  "email": "user@company.com",
  "password": "SecurePass@123",
  "firstName": "John",
  "lastName": "Doe",
  "mobileNo": "+919876543210",
  "roleId": 2
}
```

**Update User Permissions:**
```bash
PUT /api/users/:id/permissions
Authorization: Bearer {admin_token}

{
  "permissions": [
    { "module_id": 1, "can_view": true, "can_edit": false, "can_delete": false },
    { "module_id": 2, "can_view": true, "can_edit": true, "can_delete": false }
  ]
}
```

**Change Password:**
```bash
POST /api/auth/change-password
Authorization: Bearer {token}

{
  "currentPassword": "OldPass@123",
  "newPassword": "NewPass@123"
}
```

**Logout:**
```bash
POST /api/auth/logout
Authorization: Bearer {token}
```

## 🧪 Testing with Insomnia

Import the provided `insomnia_collection.json` into Insomnia REST client:

1. Open Insomnia
2. Go to Application → Preferences → Data → Import Data
3. Select `insomnia_collection.json`
4. Collection will be imported with all API requests organized by module

### Test Workflow

**Step 1: Create Master Data**
```bash
1. Create Categories (Finished Product, Raw Material)
2. Create UOM (already has sample data)
3. Create GST Rates (already has sample data)
4. Create Items (link to category, uom, gst_rate)
5. Create Customers (one same state, one different state)
6. Create Transporters
```

**Step 2: Create Orders**
```bash
1. Create order with same-state customer → Verify CGST+SGST
2. Create order with different-state customer → Verify IGST
3. Verify bag count calculation
4. Check order status = "Pending"
```

**Step 3: Create Dispatches**
```bash
1. Get order balance (/orders/:id/balance)
2. Create partial dispatch
3. Verify order still "Pending"
4. Create dispatch for remaining quantity
5. Verify order status = "Completed"
```

**Step 4: Test Validations**
```bash
1. Try dispatch with qty > balance → Should fail
2. Try creating order with invalid customer → Should fail
3. Try creating item with invalid category → Should fail
```

## 🗄️ Database Schema

### Master Tables
- `suppliers` - Supplier information
- `categories` - Item categories
- `uom` - Units of measure
- `gst_rates` - GST rate master (with history)
- `items` - Product catalog
- `transporters` - Transporter details
- `customers` - Customer master

### User Management Tables
- `users` - User accounts with encrypted passwords
- `roles` - User roles (Super Admin, Manager, Operator, View Only)
- `modules` - Application modules (35 total)
- `permissions` - Role-module permissions with user-specific overrides
- `user_roles` - User-role assignments
- `user_sessions` - Active JWT sessions
- `audit_logs` - Complete activity tracking

### Transaction Tables
- `orders` - Order headers
- `order_items` - Order line items
- `dispatches` - Dispatch headers
- `scrap_grn` - Scrap goods receipt notes

### Manufacturing Tables
- `melting_processes` - Melting process headers
- `melting_spectro_readings` - Spectro test results

### Views & Functions
- `order_items_balance` - Real-time balance calculation
- `order_status_summary` - Order summary with totals
- `get_user_permissions()` - Merges role-based and custom permissions

### Key Features
- ✅ Foreign key constraints
- ✅ Check constraints for data validation
- ✅ Indexes for performance
- ✅ Triggers for automatic status updates
- ✅ Functions for order number generation and permissions
- ✅ Transaction support for multi-table operations
- ✅ Password hashing with bcrypt
- ✅ Session management with JWT

## 📊 Business Logic Details

### GST Calculation
```javascript
If (Customer State == Company State):
  CGST = (Amount × GST Rate%) / 2
  SGST = (Amount × GST Rate%) / 2
  IGST = 0
Else:
  CGST = 0
  SGST = 0
  IGST = Amount × GST Rate%
```

### Bag Count Calculation
```javascript
Bag Count = Quantity / 25
// Configurable via BAGS_PER_QUANTITY in .env
```

### Order Status Logic
```javascript
Status = "Pending" → If any item has Balance > 0
Status = "Completed" → If all items have Balance = 0
// Auto-updated by database trigger
```

### Dispatch Validation
```javascript
// Before creating dispatch:
1. Verify order exists
2. Check: Dispatch Qty <= Balance Qty (for each item)
3. If validation passes → Create dispatch
4. Trigger auto-updates order status
```

## 🏗️ Project Structure

```
STEEFE ERP/
├── config/
│   └── database.js          # PostgreSQL connection & CRUD helpers
├── database/
│   ├── schema.sql           # Complete database schema
│   └── melting_process_schema.sql  # Manufacturing schema
├── middleware/
│   ├── errorHandler.js      # Global error handling
│   └── validation.js        # Request validation rules
├── routes/
│   ├── suppliers.js         # Supplier CRUD
│   ├── categories.js        # Category CRUD
│   ├── uom.js               # UOM CRUD
│   ├── gstRates.js          # GST Rate CRUD
│   ├── items.js             # Item CRUD with joins
│   ├── transporters.js      # Transporter CRUD
│   ├── customers.js         # Customer CRUD
│   ├── orders.js            # Order management with GST logic
│   ├── dispatches.js        # Dispatch with balance validation
│   ├── scrapGrn.js          # Scrap GRN with file uploads
│   └── meltingProcesses.js  # Melting process with spectro readings
├── scripts/
│   └── initDatabase.js      # Database initialization script
├── utils/
│   └── helpers.js           # GST calc, bag calc, etc.
├── .env.example             # Environment template
├── .gitignore
├── package.json
├── server.js                # Express server entry point
├── API_DOCUMENTATION.md     # Complete API docs
├── insomnia_collection.json # Insomnia REST client collection
└── README.md                # This file
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |
| `DB_HOST` | PostgreSQL host | localhost |
| `DB_PORT` | PostgreSQL port | 5432 |
| `DB_NAME` | Database name | steelmelt_erp |
| `DB_USER` | Database user | postgres |
| `DB_PASSWORD` | Database password | - |
| `COMPANY_STATE` | Company state for GST | Maharashtra |
| `BAGS_PER_QUANTITY` | Bag calculation divisor | 25 |

## 📝 Sample API Requests

### Create Order (Same State - CGST+SGST)
```bash
POST http://localhost:3000/api/orders
Content-Type: application/json

{
  "customer_id": 1,
  "order_date": "2024-11-19",
  "po_no": "PO-2024-001",
  "estimated_delivery_date": "2024-12-01",
  "items": [
    {
      "item_id": 1,
      "quantity": 1000,
      "rate": 50.00
    }
  ]
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order": {
      "id": 1,
      "order_no": "ORD-202411-00001",
      "status": "Pending",
      ...
    },
    "items": [
      {
        "quantity": 1000.000,
        "bag_count": 40.000,
        "amount": 50000.00,
        "cgst": 4500.00,
        "sgst": 4500.00,
        "igst": 0.00,
        "total_amount": 59000.00
      }
    ]
  }
}
```

### Create Dispatch
```bash
POST http://localhost:3000/api/dispatches
Content-Type: application/json

{
  "order_id": 1,
  "dispatch_date": "2024-11-20",
  "transporter_id": 1,
  "lr_no": "LR-2024-001",
  "lr_date": "2024-11-20",
  "invoice_no": "INV-2024-001",
  "invoice_date": "2024-11-20",
  "items": [
    {
      "order_item_id": 1,
      "quantity_dispatched": 500
    }
  ]
}
```

## 🐛 Error Handling

All errors return JSON with:
```json
{
  "success": false,
  "error": "Error message",
  "details": { }
}
```

### Common Error Codes
- `400` - Bad Request (validation, business logic violation)
- `404` - Not Found
- `500` - Internal Server Error

## 🔍 Database Queries

### View Order Balance
```sql
SELECT * FROM order_items_balance WHERE order_id = 1;
```

### Check Order Status
```sql
SELECT * FROM order_status_summary WHERE order_no = 'ORD-202411-00001';
```

### Manual Status Update (if needed)
```sql
-- Usually handled by triggers, but can be done manually:
UPDATE orders 
SET status = 'Completed' 
WHERE id = 1 
AND NOT EXISTS (
  SELECT 1 FROM order_items_balance 
  WHERE order_id = 1 AND balance_quantity > 0
);
```

## 📈 Performance Considerations

- Database indexes on foreign keys and frequently filtered columns
- Connection pooling (max 20 connections)
- Efficient JOIN queries for related data
- Views for complex calculations (cached by PostgreSQL)
- Transaction support for multi-step operations

## 🔐 Security Features

- Helmet.js for HTTP security headers
- CORS enabled (configurable)
- SQL injection protection via parameterized queries
- Environment variable for sensitive data
- Error details hidden in production

## 🤝 Development Guidelines

### Adding New Master Table
1. Add table to `database/schema.sql`
2. Create route file in `routes/`
3. Add route to `server.js`
4. Update API documentation
5. Add requests to Insomnia collection

### Adding New Business Logic
1. Create function in `utils/helpers.js`
2. Use in route handlers
3. Add validation in `middleware/validation.js`
4. Document in API_DOCUMENTATION.md

## 📞 Support & Troubleshooting

### Common Issues

**Database connection failed:**
- Check PostgreSQL is running
- Verify credentials in `.env`
- Ensure database exists

**Port already in use:**
- Change `PORT` in `.env`
- Or stop other service on port 3000

**Schema initialization fails:**
- Drop database and recreate
- Check PostgreSQL version >= 12

**GST not calculating correctly:**
- Verify `COMPANY_STATE` matches customer state format
- Check customer state field is populated

## 📄 License

ISC

## 👨‍💻 Developer Notes

**Tech Stack:**
- Node.js v16+ with Express 4.x
- PostgreSQL 12+ with advanced features (views, triggers, functions)
- Pure SQL approach (no ORM) for maximum control
- RESTful API design principles
- Transaction management for data consistency

**Key Design Decisions:**
- **No ORM:** Direct SQL for transparency and performance
- **View-based balance:** Real-time calculation without cron jobs
- **Trigger-based status:** Automatic order completion
- **Helper utilities:** Reusable business logic functions
- **Comprehensive validation:** Both at API and database level

---

**Built with ❤️ for Steel Manufacturing Industry**

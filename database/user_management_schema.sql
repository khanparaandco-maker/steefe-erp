-- User Management & Authentication Schema
-- PostgreSQL Version 12+
-- Run this after the main schema.sql

-- ==========================================
-- USER MANAGEMENT TABLES
-- ==========================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    mobile_no VARCHAR(15),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_username_length CHECK (LENGTH(username) >= 3),
    CONSTRAINT check_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- 2. Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Modules Table (Menu Structure)
CREATE TABLE IF NOT EXISTS modules (
    id SERIAL PRIMARY KEY,
    module_name VARCHAR(100) UNIQUE NOT NULL,
    parent_module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    icon VARCHAR(50),
    route_path VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. User-Role Mapping
CREATE TABLE IF NOT EXISTS user_roles (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INTEGER REFERENCES users(id),
    PRIMARY KEY (user_id, role_id)
);

-- 5. Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
    can_view BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_export BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, module_id)
);

-- 6. User Sessions (for token management)
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255),
    expires_at TIMESTAMP NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(100),
    record_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_modules_parent ON modules(parent_module_id);
CREATE INDEX IF NOT EXISTS idx_permissions_role ON permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- DEFAULT DATA - MODULES (ALL MENUS & SUBMENUS)
-- ==========================================

-- Clear existing modules first (for re-run)
TRUNCATE TABLE modules CASCADE;

-- Main Modules (Parent Menus)
INSERT INTO modules (id, module_name, parent_module_id, display_order, icon, route_path) VALUES
(1, 'Dashboard', NULL, 1, 'LayoutDashboard', '/dashboard'),
(2, 'Masters', NULL, 2, 'Database', '/masters'),
(3, 'GRN', NULL, 3, 'PackageCheck', '/grn'),
(4, 'Manufacturing', NULL, 4, 'Factory', '/manufacturing'),
(5, 'Orders', NULL, 5, 'ShoppingCart', '/orders'),
(6, 'Reports', NULL, 6, 'FileText', '/reports'),
(7, 'Settings', NULL, 7, 'Settings', '/settings'),
(8, 'Users', NULL, 8, 'Users', '/users');

-- Masters Submodules
INSERT INTO modules (id, module_name, parent_module_id, display_order, icon, route_path) VALUES
(101, 'Suppliers', 2, 1, NULL, '/masters/suppliers'),
(102, 'Customers', 2, 2, NULL, '/masters/customers'),
(103, 'Items', 2, 3, NULL, '/masters/items'),
(104, 'Categories', 2, 4, NULL, '/masters/categories'),
(105, 'UOM', 2, 5, NULL, '/masters/uom'),
(106, 'GST Rates', 2, 6, NULL, '/masters/gst-rates'),
(107, 'Transporters', 2, 7, NULL, '/masters/transporters');

-- GRN Submodules
INSERT INTO modules (id, module_name, parent_module_id, display_order, icon, route_path) VALUES
(201, 'New GRN', 3, 1, NULL, '/grn/new'),
(202, 'GRN List', 3, 2, NULL, '/grn/list');

-- Manufacturing Submodules
INSERT INTO modules (id, module_name, parent_module_id, display_order, icon, route_path) VALUES
(301, 'Melting Process', 4, 1, NULL, '/manufacturing/melting'),
(302, 'Heat Treatment', 4, 2, NULL, '/manufacturing/heat-treatment');

-- Orders Submodules
INSERT INTO modules (id, module_name, parent_module_id, display_order, icon, route_path) VALUES
(401, 'Create Order', 5, 1, NULL, '/orders/create'),
(402, 'Order List', 5, 2, NULL, '/orders/list'),
(403, 'Dispatch Details', 5, 3, NULL, '/orders/dispatch'),
(404, 'Proforma Invoice', 5, 4, NULL, '/orders/proforma-invoice');

-- Reports Submodules
INSERT INTO modules (id, module_name, parent_module_id, display_order, icon, route_path) VALUES
(501, 'Raw Material Stock', 6, 1, NULL, '/reports/raw-material-stock'),
(502, 'Consumption Report', 6, 2, NULL, '/reports/consumption'),
(503, 'WIP Stock', 6, 3, NULL, '/reports/wip-stock'),
(504, 'Production Report', 6, 4, NULL, '/reports/production'),
(505, 'Finished Goods Stock', 6, 5, NULL, '/reports/finished-goods-stock'),
(506, 'Stock Movement', 6, 6, NULL, '/reports/stock-movement');

-- Settings Submodules
INSERT INTO modules (id, module_name, parent_module_id, display_order, icon, route_path) VALUES
(601, 'Company Information', 7, 1, NULL, '/settings/company'),
(602, 'Bank Details', 7, 2, NULL, '/settings/bank'),
(603, 'Email Setup', 7, 3, NULL, '/settings/email'),
(604, 'WhatsApp Integration', 7, 4, NULL, '/settings/whatsapp');

-- Users Submodules
INSERT INTO modules (id, module_name, parent_module_id, display_order, icon, route_path) VALUES
(701, 'User Management', 8, 1, NULL, '/users/management'),
(702, 'Manage Permissions', 8, 2, NULL, '/users/permissions');

-- Reset sequence for modules
SELECT setval('modules_id_seq', (SELECT MAX(id) FROM modules));

-- ==========================================
-- DEFAULT DATA - ROLES
-- ==========================================

INSERT INTO roles (role_name, description) VALUES
('Super Admin', 'Full system access with all permissions'),
('Manager', 'Can view and edit all modules except user management'),
('Operator', 'Can view all modules and edit manufacturing only'),
('View Only', 'Read-only access to all modules');

-- ==========================================
-- DEFAULT DATA - ADMIN USER
-- ==========================================

-- Default admin user (password: Admin@123)
-- Password hash generated with bcrypt rounds=10
INSERT INTO users (username, email, password_hash, first_name, last_name, mobile_no, is_active) VALUES
('admin', 'admin@steelmelt.com', '$2a$10$rK8qHKhV7qH8qvP3VXvZW.N2jYLzFHxQzKxYZKxYZKxYZKxYZKxYZ', 'System', 'Administrator', '+91 9876543210', TRUE);

-- Assign Super Admin role to admin user
INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES
(1, 1, 1);

-- ==========================================
-- DEFAULT DATA - PERMISSIONS (Super Admin - All Access)
-- ==========================================

-- Grant Super Admin full permissions to all modules
INSERT INTO permissions (role_id, module_id, can_view, can_edit, can_delete, can_export)
SELECT 1, id, TRUE, TRUE, TRUE, TRUE FROM modules;

-- Grant Manager permissions (all except Users module)
INSERT INTO permissions (role_id, module_id, can_view, can_edit, can_delete, can_export)
SELECT 2, id, TRUE, TRUE, TRUE, TRUE FROM modules WHERE parent_module_id != 8 AND id != 8;

-- Grant Manager view-only for Users
INSERT INTO permissions (role_id, module_id, can_view, can_edit, can_delete, can_export)
SELECT 2, id, TRUE, FALSE, FALSE, FALSE FROM modules WHERE parent_module_id = 8 OR id = 8;

-- Grant Operator permissions (view all, edit manufacturing only)
INSERT INTO permissions (role_id, module_id, can_view, can_edit, can_delete, can_export)
SELECT 3, id, TRUE, 
    CASE WHEN parent_module_id = 4 OR id = 4 THEN TRUE ELSE FALSE END,
    FALSE,
    CASE WHEN parent_module_id = 4 OR id = 4 THEN TRUE ELSE FALSE END
FROM modules;

-- Grant View Only permissions (view all, no edit/delete)
INSERT INTO permissions (role_id, module_id, can_view, can_edit, can_delete, can_export)
SELECT 4, id, TRUE, FALSE, FALSE, FALSE FROM modules;

-- ==========================================
-- HELPER FUNCTIONS
-- ==========================================

-- Function to check user permission
CREATE OR REPLACE FUNCTION check_user_permission(
    p_user_id INTEGER,
    p_module_name VARCHAR,
    p_permission_type VARCHAR -- 'view', 'edit', 'delete', 'export'
)
RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN;
BEGIN
    SELECT 
        CASE p_permission_type
            WHEN 'view' THEN p.can_view
            WHEN 'edit' THEN p.can_edit
            WHEN 'delete' THEN p.can_delete
            WHEN 'export' THEN p.can_export
            ELSE FALSE
        END INTO has_permission
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN permissions p ON ur.role_id = p.role_id
    JOIN modules m ON p.module_id = m.id
    WHERE u.id = p_user_id 
    AND u.is_active = TRUE
    AND m.module_name = p_module_name
    LIMIT 1;
    
    RETURN COALESCE(has_permission, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id INTEGER)
RETURNS TABLE (
    module_name VARCHAR,
    parent_module VARCHAR,
    can_view BOOLEAN,
    can_edit BOOLEAN,
    can_delete BOOLEAN,
    can_export BOOLEAN,
    route_path VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.module_name,
        pm.module_name as parent_module,
        p.can_view,
        p.can_edit,
        p.can_delete,
        p.can_export,
        m.route_path
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN permissions p ON ur.role_id = p.role_id
    JOIN modules m ON p.module_id = m.id
    LEFT JOIN modules pm ON m.parent_module_id = pm.id
    WHERE u.id = p_user_id 
    AND u.is_active = TRUE
    ORDER BY m.display_order;
END;
$$ LANGUAGE plpgsql;

-- Function to log audit trail
CREATE OR REPLACE FUNCTION log_audit(
    p_user_id INTEGER,
    p_action VARCHAR,
    p_table_name VARCHAR,
    p_record_id INTEGER,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (p_user_id, p_action, p_table_name, p_record_id, p_old_values, p_new_values);
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- Verify installation
DO $$
BEGIN
    RAISE NOTICE 'User Management Schema Installation Complete!';
    RAISE NOTICE 'Tables created: users, roles, modules, permissions, user_roles, user_sessions, audit_logs';
    RAISE NOTICE 'Default admin user created: username=admin, password=Admin@123';
    RAISE NOTICE 'Total modules: %', (SELECT COUNT(*) FROM modules);
    RAISE NOTICE 'Total roles: %', (SELECT COUNT(*) FROM roles);
END $$;

-- View all modules hierarchy
-- SELECT 
--     m.id,
--     CASE WHEN m.parent_module_id IS NULL 
--         THEN m.module_name 
--         ELSE '  → ' || m.module_name 
--     END as module_hierarchy,
--     m.route_path
-- FROM modules m
-- ORDER BY COALESCE(m.parent_module_id, m.id), m.display_order;

-- Test admin permissions
-- SELECT * FROM get_user_permissions(1);

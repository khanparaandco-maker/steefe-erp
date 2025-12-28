-- SteelMelt ERP Database Schema
-- PostgreSQL Version 12+

-- Drop existing tables and sequences if they exist (for clean reinstall)
DROP TABLE IF EXISTS dispatch_items CASCADE;
DROP TABLE IF EXISTS dispatches CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS gst_rates CASCADE;
DROP TABLE IF EXISTS uom CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS transporters CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;

-- Drop sequences
DROP SEQUENCE IF EXISTS order_no_seq CASCADE;
DROP SEQUENCE IF EXISTS dispatch_no_seq CASCADE;

-- ==========================================
-- MASTER TABLES
-- ==========================================

-- 1. Suppliers Table
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    supplier_name VARCHAR(255) NOT NULL,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    gstn VARCHAR(15),
    contact_person1 VARCHAR(100),
    mobile_no VARCHAR(15),
    contact_person2 VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_supplier_name UNIQUE(supplier_name)
);

-- 2. Categories Table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    alias VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_category_name UNIQUE(category_name)
);

-- 3. UOM (Units of Measure) Table
CREATE TABLE uom (
    id SERIAL PRIMARY KEY,
    uom_short_name VARCHAR(20) NOT NULL,
    uom_description VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_uom_short_name UNIQUE(uom_short_name)
);

-- 4. GST_Rates Table (Handles rate changes over time)
CREATE TABLE gst_rates (
    id SERIAL PRIMARY KEY,
    gst_details VARCHAR(255) NOT NULL,
    hsn_code VARCHAR(20) NOT NULL,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    gst_rate DECIMAL(5,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_gst_rate CHECK (gst_rate >= 0 AND gst_rate <= 100)
);

-- Index for efficient lookup of active GST rates by HSN code
CREATE INDEX idx_gst_rates_hsn_active ON gst_rates(hsn_code, is_active, effective_date DESC);

-- 5. Items Table
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    alias VARCHAR(100),
    category_id INTEGER NOT NULL,
    uom_id INTEGER NOT NULL,
    gst_rate_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_item_category FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT fk_item_uom FOREIGN KEY (uom_id) REFERENCES uom(id),
    CONSTRAINT fk_item_gst_rate FOREIGN KEY (gst_rate_id) REFERENCES gst_rates(id),
    CONSTRAINT unique_item_name UNIQUE(item_name)
);

-- Indexes for foreign key lookups
CREATE INDEX idx_items_category ON items(category_id);
CREATE INDEX idx_items_uom ON items(uom_id);
CREATE INDEX idx_items_gst_rate ON items(gst_rate_id);

-- 6. Transporters Table
CREATE TABLE transporters (
    id SERIAL PRIMARY KEY,
    transporter_name VARCHAR(255) NOT NULL,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    gstn VARCHAR(15),
    contact_person1 VARCHAR(100),
    mobile_no VARCHAR(15),
    contact_person2 VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_transporter_name UNIQUE(transporter_name)
);

-- 7. Customers Table
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100) NOT NULL,
    gstn VARCHAR(15),
    contact_person1 VARCHAR(100),
    mobile_no VARCHAR(15),
    contact_person2 VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_customer_name UNIQUE(customer_name)
);

-- Index for filtering customers by state (for GST calculations)
CREATE INDEX idx_customers_state ON customers(state);

-- ==========================================
-- TRANSACTION TABLES
-- ==========================================

-- 8. Orders Table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_no VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL,
    order_date DATE NOT NULL,
    po_no VARCHAR(100),
    estimated_delivery_date DATE,
    preferred_transporter_id INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_order_transporter FOREIGN KEY (preferred_transporter_id) REFERENCES transporters(id),
    CONSTRAINT check_order_status CHECK (status IN ('Pending', 'Completed'))
);

-- Sequence for auto-generating order numbers
CREATE SEQUENCE order_no_seq START WITH 1;

-- Index for filtering orders by status and customer
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_date ON orders(order_date DESC);

-- 9. Order_Items Table
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    quantity DECIMAL(15,3) NOT NULL,
    bag_count DECIMAL(15,3),
    rate DECIMAL(15,2) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    cgst DECIMAL(15,2) DEFAULT 0,
    sgst DECIMAL(15,2) DEFAULT 0,
    igst DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_item_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_item_item FOREIGN KEY (item_id) REFERENCES items(id),
    CONSTRAINT check_quantity_positive CHECK (quantity > 0),
    CONSTRAINT check_rate_positive CHECK (rate >= 0),
    CONSTRAINT check_amount_positive CHECK (amount >= 0),
    CONSTRAINT check_total_amount_positive CHECK (total_amount >= 0)
);

-- Index for efficient order item lookups
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_item ON order_items(item_id);

-- 10. Dispatches Table
CREATE TABLE dispatches (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    dispatch_date DATE NOT NULL,
    transporter_id INTEGER,
    lr_no VARCHAR(100),
    lr_date DATE,
    invoice_no VARCHAR(100),
    invoice_date DATE,
    upload_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dispatch_order FOREIGN KEY (order_id) REFERENCES orders(id),
    CONSTRAINT fk_dispatch_transporter FOREIGN KEY (transporter_id) REFERENCES transporters(id)
);

-- Index for filtering dispatches by order and date
CREATE INDEX idx_dispatches_order ON dispatches(order_id);
CREATE INDEX idx_dispatches_date ON dispatches(dispatch_date DESC);

-- 11. Dispatch_Items Table
CREATE TABLE dispatch_items (
    id SERIAL PRIMARY KEY,
    dispatch_id INTEGER NOT NULL,
    order_item_id INTEGER NOT NULL,
    quantity_dispatched DECIMAL(15,3) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dispatch_item_dispatch FOREIGN KEY (dispatch_id) REFERENCES dispatches(id) ON DELETE CASCADE,
    CONSTRAINT fk_dispatch_item_order_item FOREIGN KEY (order_item_id) REFERENCES order_items(id),
    CONSTRAINT check_dispatched_quantity_positive CHECK (quantity_dispatched > 0)
);

-- Index for efficient dispatch item lookups
CREATE INDEX idx_dispatch_items_dispatch ON dispatch_items(dispatch_id);
CREATE INDEX idx_dispatch_items_order_item ON dispatch_items(order_item_id);

-- ==========================================
-- VIEWS FOR BUSINESS LOGIC
-- ==========================================

-- View to calculate balance quantities for order items
CREATE OR REPLACE VIEW order_items_balance AS
SELECT 
    oi.id AS order_item_id,
    oi.order_id,
    oi.item_id,
    i.item_name AS item_name,
    oi.quantity AS ordered_quantity,
    COALESCE(SUM(di.quantity_dispatched), 0) AS dispatched_quantity,
    (oi.quantity - COALESCE(SUM(di.quantity_dispatched), 0)) AS balance_quantity
FROM 
    order_items oi
    LEFT JOIN dispatch_items di ON oi.id = di.order_item_id
    JOIN items i ON oi.item_id = i.id
GROUP BY 
    oi.id, oi.order_id, oi.item_id, i.item_name, oi.quantity;

-- View for order status summary
CREATE OR REPLACE VIEW order_status_summary AS
SELECT 
    o.id AS order_id,
    o.order_no,
    o.customer_id,
    c.customer_name AS customer_name,
    o.order_date,
    o.status,
    COUNT(oi.id) AS total_items,
    SUM(CASE WHEN oib.balance_quantity > 0 THEN 1 ELSE 0 END) AS pending_items,
    SUM(oi.total_amount) AS order_total
FROM 
    orders o
    JOIN customers c ON o.customer_id = c.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN order_items_balance oib ON oi.id = oib.order_item_id
GROUP BY 
    o.id, o.order_no, o.customer_id, c.customer_name, o.order_date, o.status;

-- ==========================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- ==========================================

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_no()
RETURNS VARCHAR(50) AS $$
DECLARE
    next_num INTEGER;
    order_num VARCHAR(50);
BEGIN
    next_num := nextval('order_no_seq');
    order_num := 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-' || LPAD(next_num::TEXT, 5, '0');
    RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Function to update order status based on dispatch balance
CREATE OR REPLACE FUNCTION update_order_status()
RETURNS TRIGGER AS $$
DECLARE
    pending_count INTEGER;
    v_order_id INTEGER;
BEGIN
    -- Get order_id from the dispatch
    IF TG_OP = 'DELETE' THEN
        SELECT order_id INTO v_order_id FROM dispatches WHERE id = OLD.dispatch_id;
    ELSE
        SELECT order_id INTO v_order_id FROM dispatches WHERE id = NEW.dispatch_id;
    END IF;
    
    -- Count how many items in this order still have balance > 0
    SELECT COUNT(*) INTO pending_count
    FROM order_items_balance
    WHERE order_id = v_order_id AND balance_quantity > 0;
    
    -- Update order status
    IF pending_count = 0 THEN
        UPDATE orders SET status = 'Completed', updated_at = CURRENT_TIMESTAMP
        WHERE id = v_order_id;
    ELSE
        UPDATE orders SET status = 'Pending', updated_at = CURRENT_TIMESTAMP
        WHERE id = v_order_id;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update order status when dispatch items are inserted
CREATE TRIGGER trigger_update_order_status
AFTER INSERT OR UPDATE OR DELETE ON dispatch_items
FOR EACH ROW
EXECUTE FUNCTION update_order_status();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update timestamp trigger to all relevant tables
CREATE TRIGGER update_suppliers_timestamp BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_timestamp BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_uom_timestamp BEFORE UPDATE ON uom
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gst_rates_timestamp BEFORE UPDATE ON gst_rates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_timestamp BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transporters_timestamp BEFORE UPDATE ON transporters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_timestamp BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_timestamp BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_items_timestamp BEFORE UPDATE ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dispatches_timestamp BEFORE UPDATE ON dispatches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- SAMPLE DATA (Optional - for testing)
-- ==========================================

-- Insert sample UOM
INSERT INTO uom (uom_short_name, uom_description) VALUES
('KG', 'Kilogram'),
('MT', 'Metric Ton'),
('PCS', 'Pieces'),
('BAG', 'Bag');

-- Insert sample categories
INSERT INTO categories (category_name, alias) VALUES
('Raw Material', 'RM'),
('Finished Product', 'FP'),
('Semi-Finished', 'SF');

-- Insert sample GST rates
INSERT INTO gst_rates (gst_details, hsn_code, gst_rate, effective_date) VALUES
('GST 18% on Iron & Steel', '7201', 18.00, '2023-01-01'),
('GST 12% on Steel Products', '7202', 12.00, '2023-01-01'),
('GST 5% on Iron Ore', '7203', 5.00, '2023-01-01');

-- Insert default item: MS Scrap
-- This item will be used for tracking scrap inward from GRN and scrap issue for Melting Process
INSERT INTO items (item_name, alias, category_id, uom_id, gst_rate_id) VALUES
('MS Scrap', 'MS-SCRAP', 
    (SELECT id FROM categories WHERE category_name = 'Raw Material' LIMIT 1),
    (SELECT id FROM uom WHERE uom_short_name = 'KG' LIMIT 1),
    (SELECT id FROM gst_rates WHERE hsn_code = '7201' LIMIT 1)
);

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;

-- End of schema

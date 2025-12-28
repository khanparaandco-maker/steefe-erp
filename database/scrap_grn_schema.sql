-- Scrap GRN Tables

-- Main scrap GRN table
CREATE TABLE IF NOT EXISTS scrap_grn (
  id SERIAL PRIMARY KEY,
  grn_no VARCHAR(50) UNIQUE NOT NULL,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
  invoice_no VARCHAR(100) NOT NULL,
  invoice_date DATE NOT NULL,
  vehicle_no VARCHAR(50),
  packing_forwarding DECIMAL(12, 2) DEFAULT 0,
  total_amount DECIMAL(15, 2) NOT NULL,
  cgst DECIMAL(15, 2) DEFAULT 0,
  sgst DECIMAL(15, 2) DEFAULT 0,
  igst DECIMAL(15, 2) DEFAULT 0,
  invoice_total DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scrap GRN items table
CREATE TABLE IF NOT EXISTS scrap_grn_items (
  id SERIAL PRIMARY KEY,
  grn_id INTEGER NOT NULL REFERENCES scrap_grn(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES items(id),
  quantity DECIMAL(12, 3) NOT NULL,
  rate DECIMAL(12, 2) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  gst_rate DECIMAL(5, 2) DEFAULT 0,
  gst_amount DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scrap GRN file uploads table
CREATE TABLE IF NOT EXISTS scrap_grn_uploads (
  id SERIAL PRIMARY KEY,
  grn_id INTEGER NOT NULL REFERENCES scrap_grn(id) ON DELETE CASCADE,
  file_type VARCHAR(50) NOT NULL, -- 'invoice_copy', 'weight_bridge', 'materials_photos', 'other_documents'
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scrap_grn_supplier ON scrap_grn(supplier_id);
CREATE INDEX IF NOT EXISTS idx_scrap_grn_date ON scrap_grn(invoice_date);
CREATE INDEX IF NOT EXISTS idx_scrap_grn_items_grn ON scrap_grn_items(grn_id);
CREATE INDEX IF NOT EXISTS idx_scrap_grn_items_item ON scrap_grn_items(item_id);
CREATE INDEX IF NOT EXISTS idx_scrap_grn_uploads_grn ON scrap_grn_uploads(grn_id);

-- Function to generate GRN number
CREATE OR REPLACE FUNCTION generate_grn_no() RETURNS VARCHAR AS $$
DECLARE
  next_no INTEGER;
  grn_no VARCHAR(50);
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(grn_no FROM 8) AS INTEGER)), 0) + 1 
  INTO next_no 
  FROM scrap_grn 
  WHERE grn_no LIKE 'SGRN-%';
  
  grn_no := 'SGRN-' || TO_CHAR(CURRENT_DATE, 'YY') || LPAD(next_no::TEXT, 4, '0');
  RETURN grn_no;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_scrap_grn_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER scrap_grn_update_timestamp
BEFORE UPDATE ON scrap_grn
FOR EACH ROW
EXECUTE FUNCTION update_scrap_grn_timestamp();

COMMENT ON TABLE scrap_grn IS 'Scrap GRN (Goods Receipt Note) header table';
COMMENT ON TABLE scrap_grn_items IS 'Scrap GRN line items';
COMMENT ON TABLE scrap_grn_uploads IS 'File uploads related to Scrap GRN';

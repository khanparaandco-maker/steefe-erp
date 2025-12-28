-- Company Settings Table
-- Stores company information, bank details, and integration settings

DROP TABLE IF EXISTS company_settings CASCADE;
DROP TABLE IF EXISTS bank_accounts CASCADE;

-- Company Settings Table (Single Row - Config Table)
CREATE TABLE company_settings (
    id SERIAL PRIMARY KEY,
    -- Company Details
    company_name VARCHAR(255) NOT NULL,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10),
    gstn VARCHAR(15),
    pan VARCHAR(10),
    
    -- Contact Details
    contact_person VARCHAR(255),
    mobile VARCHAR(15),
    email VARCHAR(255),
    website VARCHAR(255),
    
    -- Logo
    logo_url TEXT,
    logo_filename VARCHAR(255),
    
    -- WhatsApp Integration
    whatsapp_enabled BOOLEAN DEFAULT false,
    whatsapp_api_key TEXT,
    whatsapp_phone_number VARCHAR(20),
    whatsapp_instance_id VARCHAR(100),
    
    -- Email Integration
    email_enabled BOOLEAN DEFAULT false,
    smtp_host VARCHAR(255),
    smtp_port INTEGER DEFAULT 587,
    smtp_user VARCHAR(255),
    smtp_password TEXT,
    from_email VARCHAR(255),
    from_name VARCHAR(255),
    use_ssl BOOLEAN DEFAULT true,
    
    -- Audit Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bank Accounts Table (Multiple banks possible)
CREATE TABLE bank_accounts (
    id SERIAL PRIMARY KEY,
    bank_name VARCHAR(255) NOT NULL,
    account_holder_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    ifsc_code VARCHAR(11) NOT NULL,
    branch_name VARCHAR(255),
    account_type VARCHAR(20) CHECK (account_type IN ('Savings', 'Current', 'Cash Credit', 'Overdraft')),
    
    -- UPI Details
    upi_id VARCHAR(100),
    
    -- Additional Details
    swift_code VARCHAR(20),
    micr_code VARCHAR(20),
    
    -- Primary Bank Flag
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Audit Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default company settings row (will be updated via UI)
INSERT INTO company_settings (company_name, state) 
VALUES ('Your Company Name', 'Gujarat');

-- Create indexes
CREATE INDEX idx_bank_accounts_active ON bank_accounts(is_active);
CREATE INDEX idx_bank_accounts_primary ON bank_accounts(is_primary);

-- Add comments
COMMENT ON TABLE company_settings IS 'Stores company information and integration settings';
COMMENT ON TABLE bank_accounts IS 'Stores multiple bank account details for the company';
COMMENT ON COLUMN bank_accounts.is_primary IS 'Marks the primary bank account for transactions';

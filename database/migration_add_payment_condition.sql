-- Migration: Add payment_condition to orders table
-- Created: 2025-11-23
-- Purpose: Add payment terms/conditions field to orders

-- Add payment_condition column to orders table
ALTER TABLE orders 
ADD COLUMN payment_condition TEXT;

-- Add comment
COMMENT ON COLUMN orders.payment_condition IS 'Payment terms and conditions for the order (e.g., 30 days credit, Advance payment, etc.)';

-- Update existing orders with default value if needed
UPDATE orders 
SET payment_condition = 'As per agreement' 
WHERE payment_condition IS NULL;

-- Verification query
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders' AND column_name = 'payment_condition';

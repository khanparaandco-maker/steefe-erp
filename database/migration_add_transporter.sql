-- Migration: Add preferred_transporter_id to orders table
-- Date: 2024-11-19

-- Add column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'preferred_transporter_id'
    ) THEN
        ALTER TABLE orders 
        ADD COLUMN preferred_transporter_id INTEGER 
        REFERENCES transporters(id);
        
        RAISE NOTICE 'Column preferred_transporter_id added to orders table';
    ELSE
        RAISE NOTICE 'Column preferred_transporter_id already exists';
    END IF;
END $$;

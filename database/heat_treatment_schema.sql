-- Heat Treatment Process Schema
-- For tracking heat treatment operations in steel manufacturing

-- Drop table if exists (for clean reinstall)
DROP TABLE IF EXISTS heat_treatment CASCADE;

-- Create heat_treatment table
CREATE TABLE heat_treatment (
    id SERIAL PRIMARY KEY,
    treatment_date DATE NOT NULL,
    furnace_no INTEGER NOT NULL,
    size_item_id INTEGER NOT NULL,
    time_in TIME NOT NULL,
    time_out TIME NOT NULL,
    temperature INTEGER NOT NULL,
    bags_produced INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key to items table (only finished goods)
    CONSTRAINT fk_heat_treatment_item FOREIGN KEY (size_item_id) REFERENCES items(id),
    
    -- Constraints
    CONSTRAINT check_furnace_no CHECK (furnace_no BETWEEN 1 AND 6),
    CONSTRAINT check_time_sequence CHECK (time_out > time_in),
    CONSTRAINT check_temperature CHECK (temperature > 0),
    CONSTRAINT check_bags_produced CHECK (bags_produced > 0)
);

-- Indexes for performance
CREATE INDEX idx_heat_treatment_date ON heat_treatment(treatment_date);
CREATE INDEX idx_heat_treatment_furnace ON heat_treatment(furnace_no);
CREATE INDEX idx_heat_treatment_item ON heat_treatment(size_item_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_heat_treatment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_heat_treatment_updated_at
    BEFORE UPDATE ON heat_treatment
    FOR EACH ROW
    EXECUTE FUNCTION update_heat_treatment_updated_at();

-- Comments
COMMENT ON TABLE heat_treatment IS 'Heat treatment operations for finished goods production';
COMMENT ON COLUMN heat_treatment.treatment_date IS 'Date of heat treatment';
COMMENT ON COLUMN heat_treatment.furnace_no IS 'Furnace number (1-6)';
COMMENT ON COLUMN heat_treatment.size_item_id IS 'Foreign key to items table (finished goods only)';
COMMENT ON COLUMN heat_treatment.time_in IS 'Time when material entered furnace';
COMMENT ON COLUMN heat_treatment.time_out IS 'Time when material exited furnace';
COMMENT ON COLUMN heat_treatment.temperature IS 'Treatment temperature in degrees';
COMMENT ON COLUMN heat_treatment.bags_produced IS 'Number of bags produced';

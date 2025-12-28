-- Melting Process Module Schema
-- SteelMelt ERP - Manufacturing Module

-- Drop existing tables if they exist
DROP TABLE IF EXISTS melting_spectro_readings CASCADE;
DROP TABLE IF EXISTS melting_processes CASCADE;

-- ==========================================
-- MELTING PROCESSES TABLE
-- ==========================================

CREATE TABLE melting_processes (
    id SERIAL PRIMARY KEY,
    melting_date DATE NOT NULL,
    heat_no INTEGER NOT NULL CHECK (heat_no BETWEEN 1 AND 10),
    scrap_weight TEXT NOT NULL,  -- Stores calculator-like input: "100+200+250"
    scrap_total DECIMAL(15,3) NOT NULL,  -- Auto-calculated total in Kgs
    time_in TIME NOT NULL,  -- 24-hour format
    time_out TIME NOT NULL,  -- 24-hour format
    carbon DECIMAL(10,3),  -- Carbon added in Kgs
    manganese DECIMAL(10,3),  -- Manganese added in Kgs
    silicon DECIMAL(10,3),  -- Silicon added in Kgs
    aluminium DECIMAL(10,3),  -- Aluminium added in Kgs
    calcium DECIMAL(10,3),  -- Calcium added in Kgs
    temperature DECIMAL(10,2),  -- Final pouring temperature in Celsius
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_melting_date_heat UNIQUE(melting_date, heat_no),
    CONSTRAINT check_time_sequence CHECK (time_out > time_in),
    CONSTRAINT check_scrap_total_positive CHECK (scrap_total > 0)
);

-- Indexes for performance
CREATE INDEX idx_melting_date ON melting_processes(melting_date DESC);
CREATE INDEX idx_melting_heat_no ON melting_processes(heat_no);
CREATE INDEX idx_melting_date_heat ON melting_processes(melting_date, heat_no);

-- ==========================================
-- SPECTRO READINGS TABLE
-- ==========================================

CREATE TABLE melting_spectro_readings (
    id SERIAL PRIMARY KEY,
    melting_process_id INTEGER NOT NULL,
    carbon DECIMAL(10,4),  -- Carbon percentage (4 decimals for precision)
    silicon DECIMAL(10,4),  -- Silicon percentage
    manganese DECIMAL(10,4),  -- Manganese percentage
    phosphorus DECIMAL(10,4),  -- Phosphorus percentage
    sulphur DECIMAL(10,4),  -- Sulphur percentage
    chrome DECIMAL(10,4),  -- Chrome percentage
    reading_sequence INTEGER NOT NULL,  -- Order of readings (1, 2, 3...)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_spectro_melting FOREIGN KEY (melting_process_id) 
        REFERENCES melting_processes(id) ON DELETE CASCADE,
    CONSTRAINT check_reading_sequence_positive CHECK (reading_sequence > 0)
);

-- Index for spectro readings lookup
CREATE INDEX idx_spectro_melting ON melting_spectro_readings(melting_process_id, reading_sequence);

-- ==========================================
-- TRIGGER FOR UPDATED_AT
-- ==========================================

-- Update timestamp trigger for melting_processes
CREATE TRIGGER update_melting_processes_timestamp 
BEFORE UPDATE ON melting_processes
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- COMMENTS FOR DOCUMENTATION
-- ==========================================

COMMENT ON TABLE melting_processes IS 'Stores melting process records with heat details and mineral additions';
COMMENT ON TABLE melting_spectro_readings IS 'Stores multiple spectro test readings per melting process';

COMMENT ON COLUMN melting_processes.scrap_weight IS 'Calculator expression like "100+200+250"';
COMMENT ON COLUMN melting_processes.scrap_total IS 'Calculated total from scrap_weight expression in Kgs';
COMMENT ON COLUMN melting_processes.heat_no IS 'Heat number between 1 and 10';

COMMENT ON COLUMN melting_spectro_readings.reading_sequence IS 'Sequence number for multiple readings per heat';

-- End of melting process schema

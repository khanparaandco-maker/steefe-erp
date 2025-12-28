-- Stock Statement Report Schema
-- Implements FIFO (First-In-First-Out) inventory valuation

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_stock_statement_fifo(INTEGER, DATE, DATE);
DROP FUNCTION IF EXISTS get_stock_statement_report(DATE, DATE, INTEGER);

-- Create stock transactions table to track all inventory movements
CREATE TABLE IF NOT EXISTS stock_transactions (
    id SERIAL PRIMARY KEY,
    transaction_date DATE NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('OPENING', 'RECEIPT', 'ISSUE')),
    item_id INTEGER NOT NULL REFERENCES items(id),
    quantity DECIMAL(15,3) NOT NULL,
    rate DECIMAL(15,2) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    reference_type VARCHAR(50), -- 'GRN', 'ORDER', 'DISPATCH', 'ADJUSTMENT', etc.
    reference_id INTEGER,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_stock_trans_date ON stock_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_stock_trans_item ON stock_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_trans_type ON stock_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_stock_trans_date_item ON stock_transactions(transaction_date, item_id);

-- Function to calculate FIFO stock valuation for a specific item and date range
CREATE OR REPLACE FUNCTION get_stock_statement_fifo(
    p_item_id INTEGER,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    item_id INTEGER,
    item_name VARCHAR,
    category_name VARCHAR,
    uom_short_name VARCHAR,
    opening_qty DECIMAL,
    opening_rate DECIMAL,
    opening_amount DECIMAL,
    receipt_qty DECIMAL,
    receipt_rate DECIMAL,
    receipt_amount DECIMAL,
    issue_qty DECIMAL,
    issue_rate DECIMAL,
    issue_amount DECIMAL,
    closing_qty DECIMAL,
    closing_rate DECIMAL,
    closing_amount DECIMAL
) AS $$
DECLARE
    v_opening_qty DECIMAL := 0;
    v_opening_amount DECIMAL := 0;
    v_opening_rate DECIMAL := 0;
    v_receipt_qty DECIMAL := 0;
    v_receipt_amount DECIMAL := 0;
    v_receipt_rate DECIMAL := 0;
    v_issue_qty DECIMAL := 0;
    v_issue_amount DECIMAL := 0;
    v_issue_rate DECIMAL := 0;
    v_closing_qty DECIMAL := 0;
    v_closing_amount DECIMAL := 0;
    v_closing_rate DECIMAL := 0;
BEGIN
    -- Calculate opening stock (all transactions before start date)
    SELECT 
        COALESCE(SUM(CASE WHEN transaction_type IN ('OPENING', 'RECEIPT') THEN quantity ELSE -quantity END), 0),
        COALESCE(SUM(CASE WHEN transaction_type IN ('OPENING', 'RECEIPT') THEN amount ELSE -amount END), 0)
    INTO v_opening_qty, v_opening_amount
    FROM stock_transactions
    WHERE item_id = p_item_id
    AND transaction_date < p_start_date;
    
    -- Calculate opening rate
    IF v_opening_qty > 0 THEN
        v_opening_rate := v_opening_amount / v_opening_qty;
    END IF;
    
    -- Calculate receipts in period
    SELECT 
        COALESCE(SUM(quantity), 0),
        COALESCE(SUM(amount), 0)
    INTO v_receipt_qty, v_receipt_amount
    FROM stock_transactions
    WHERE item_id = p_item_id
    AND transaction_type = 'RECEIPT'
    AND transaction_date BETWEEN p_start_date AND p_end_date;
    
    -- Calculate receipt average rate
    IF v_receipt_qty > 0 THEN
        v_receipt_rate := v_receipt_amount / v_receipt_qty;
    END IF;
    
    -- Calculate issues in period
    SELECT 
        COALESCE(SUM(quantity), 0),
        COALESCE(SUM(amount), 0)
    INTO v_issue_qty, v_issue_amount
    FROM stock_transactions
    WHERE item_id = p_item_id
    AND transaction_type = 'ISSUE'
    AND transaction_date BETWEEN p_start_date AND p_end_date;
    
    -- Calculate issue average rate
    IF v_issue_qty > 0 THEN
        v_issue_rate := v_issue_amount / v_issue_qty;
    END IF;
    
    -- Calculate closing stock
    v_closing_qty := v_opening_qty + v_receipt_qty - v_issue_qty;
    v_closing_amount := v_opening_amount + v_receipt_amount - v_issue_amount;
    
    -- Calculate closing rate
    IF v_closing_qty > 0 THEN
        v_closing_rate := v_closing_amount / v_closing_qty;
    END IF;
    
    -- Return the result
    RETURN QUERY
    SELECT 
        p_item_id,
        i.item_name,
        c.category_name,
        u.uom_short_name,
        v_opening_qty,
        v_opening_rate,
        v_opening_amount,
        v_receipt_qty,
        v_receipt_rate,
        v_receipt_amount,
        v_issue_qty,
        v_issue_rate,
        v_issue_amount,
        v_closing_qty,
        v_closing_rate,
        v_closing_amount
    FROM items i
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN uom u ON i.uom_id = u.id
    WHERE i.id = p_item_id;
    
END;
$$ LANGUAGE plpgsql;

-- Function to get stock statement for all items or by category
CREATE OR REPLACE FUNCTION get_stock_statement_report(
    p_start_date DATE,
    p_end_date DATE,
    p_category_id INTEGER DEFAULT NULL
)
RETURNS TABLE (
    item_id INTEGER,
    item_name VARCHAR,
    category_name VARCHAR,
    uom_short_name VARCHAR,
    opening_qty DECIMAL,
    opening_rate DECIMAL,
    opening_amount DECIMAL,
    receipt_qty DECIMAL,
    receipt_rate DECIMAL,
    receipt_amount DECIMAL,
    issue_qty DECIMAL,
    issue_rate DECIMAL,
    issue_amount DECIMAL,
    closing_qty DECIMAL,
    closing_rate DECIMAL,
    closing_amount DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.item_name,
        c.category_name,
        u.uom_short_name,
        COALESCE(
            (SELECT SUM(CASE WHEN transaction_type IN ('OPENING', 'RECEIPT') THEN quantity ELSE -quantity END)
             FROM stock_transactions st
             WHERE st.item_id = i.id AND st.transaction_date < p_start_date), 0
        )::DECIMAL(15,3) as opening_qty,
        CASE 
            WHEN COALESCE(
                (SELECT SUM(CASE WHEN transaction_type IN ('OPENING', 'RECEIPT') THEN quantity ELSE -quantity END)
                 FROM stock_transactions st
                 WHERE st.item_id = i.id AND st.transaction_date < p_start_date), 0
            ) > 0 
            THEN (
                COALESCE(
                    (SELECT SUM(CASE WHEN transaction_type IN ('OPENING', 'RECEIPT') THEN amount ELSE -amount END)
                     FROM stock_transactions st
                     WHERE st.item_id = i.id AND st.transaction_date < p_start_date), 0
                ) / 
                COALESCE(
                    (SELECT SUM(CASE WHEN transaction_type IN ('OPENING', 'RECEIPT') THEN quantity ELSE -quantity END)
                     FROM stock_transactions st
                     WHERE st.item_id = i.id AND st.transaction_date < p_start_date), 0
                )
            )
            ELSE 0
        END::DECIMAL(15,2) as opening_rate,
        COALESCE(
            (SELECT SUM(CASE WHEN transaction_type IN ('OPENING', 'RECEIPT') THEN amount ELSE -amount END)
             FROM stock_transactions st
             WHERE st.item_id = i.id AND st.transaction_date < p_start_date), 0
        )::DECIMAL(15,2) as opening_amount,
        COALESCE(
            (SELECT SUM(quantity)
             FROM stock_transactions st
             WHERE st.item_id = i.id 
             AND st.transaction_type = 'RECEIPT'
             AND st.transaction_date BETWEEN p_start_date AND p_end_date), 0
        )::DECIMAL(15,3) as receipt_qty,
        CASE 
            WHEN COALESCE(
                (SELECT SUM(quantity)
                 FROM stock_transactions st
                 WHERE st.item_id = i.id 
                 AND st.transaction_type = 'RECEIPT'
                 AND st.transaction_date BETWEEN p_start_date AND p_end_date), 0
            ) > 0 
            THEN (
                COALESCE(
                    (SELECT SUM(amount)
                     FROM stock_transactions st
                     WHERE st.item_id = i.id 
                     AND st.transaction_type = 'RECEIPT'
                     AND st.transaction_date BETWEEN p_start_date AND p_end_date), 0
                ) / 
                COALESCE(
                    (SELECT SUM(quantity)
                     FROM stock_transactions st
                     WHERE st.item_id = i.id 
                     AND st.transaction_type = 'RECEIPT'
                     AND st.transaction_date BETWEEN p_start_date AND p_end_date), 0
                )
            )
            ELSE 0
        END::DECIMAL(15,2) as receipt_rate,
        COALESCE(
            (SELECT SUM(amount)
             FROM stock_transactions st
             WHERE st.item_id = i.id 
             AND st.transaction_type = 'RECEIPT'
             AND st.transaction_date BETWEEN p_start_date AND p_end_date), 0
        )::DECIMAL(15,2) as receipt_amount,
        COALESCE(
            (SELECT SUM(quantity)
             FROM stock_transactions st
             WHERE st.item_id = i.id 
             AND st.transaction_type = 'ISSUE'
             AND st.transaction_date BETWEEN p_start_date AND p_end_date), 0
        )::DECIMAL(15,3) as issue_qty,
        CASE 
            WHEN COALESCE(
                (SELECT SUM(quantity)
                 FROM stock_transactions st
                 WHERE st.item_id = i.id 
                 AND st.transaction_type = 'ISSUE'
                 AND st.transaction_date BETWEEN p_start_date AND p_end_date), 0
            ) > 0 
            THEN (
                COALESCE(
                    (SELECT SUM(amount)
                     FROM stock_transactions st
                     WHERE st.item_id = i.id 
                     AND st.transaction_type = 'ISSUE'
                     AND st.transaction_date BETWEEN p_start_date AND p_end_date), 0
                ) / 
                COALESCE(
                    (SELECT SUM(quantity)
                     FROM stock_transactions st
                     WHERE st.item_id = i.id 
                     AND st.transaction_type = 'ISSUE'
                     AND st.transaction_date BETWEEN p_start_date AND p_end_date), 0
                )
            )
            ELSE 0
        END::DECIMAL(15,2) as issue_rate,
        COALESCE(
            (SELECT SUM(amount)
             FROM stock_transactions st
             WHERE st.item_id = i.id 
             AND st.transaction_type = 'ISSUE'
             AND st.transaction_date BETWEEN p_start_date AND p_end_date), 0
        )::DECIMAL(15,2) as issue_amount,
        -- Closing Stock = Opening + Receipt - Issue (as per inventory conservation equation)
        (
            COALESCE(
                (SELECT SUM(CASE WHEN transaction_type IN ('OPENING', 'RECEIPT') THEN quantity ELSE -quantity END)
                 FROM stock_transactions st
                 WHERE st.item_id = i.id AND st.transaction_date < p_start_date), 0
            ) +
            COALESCE(
                (SELECT SUM(quantity)
                 FROM stock_transactions st
                 WHERE st.item_id = i.id 
                 AND st.transaction_type = 'RECEIPT'
                 AND st.transaction_date BETWEEN p_start_date AND p_end_date), 0
            ) -
            COALESCE(
                (SELECT SUM(quantity)
                 FROM stock_transactions st
                 WHERE st.item_id = i.id 
                 AND st.transaction_type = 'ISSUE'
                 AND st.transaction_date BETWEEN p_start_date AND p_end_date), 0
            )
        )::DECIMAL(15,3) as closing_qty,
        CASE 
            WHEN (
                COALESCE(
                    (SELECT SUM(CASE WHEN transaction_type IN ('OPENING', 'RECEIPT') THEN quantity ELSE -quantity END)
                     FROM stock_transactions st
                     WHERE st.item_id = i.id AND st.transaction_date < p_start_date), 0
                ) +
                COALESCE(
                    (SELECT SUM(quantity)
                     FROM stock_transactions st
                     WHERE st.item_id = i.id 
                     AND st.transaction_type = 'RECEIPT'
                     AND st.transaction_date BETWEEN p_start_date AND p_end_date), 0
                ) -
                COALESCE(
                    (SELECT SUM(quantity)
                     FROM stock_transactions st
                     WHERE st.item_id = i.id 
                     AND st.transaction_type = 'ISSUE'
                     AND st.transaction_date BETWEEN p_start_date AND p_end_date), 0
                )
            ) > 0 
            THEN (
                (
                    COALESCE(
                        (SELECT SUM(CASE WHEN transaction_type IN ('OPENING', 'RECEIPT') THEN amount ELSE -amount END)
                         FROM stock_transactions st
                         WHERE st.item_id = i.id AND st.transaction_date < p_start_date), 0
                    ) +
                    COALESCE(
                        (SELECT SUM(amount)
                         FROM stock_transactions st
                         WHERE st.item_id = i.id 
                         AND st.transaction_type = 'RECEIPT'
                         AND st.transaction_date BETWEEN p_start_date AND p_end_date), 0
                    ) -
                    COALESCE(
                        (SELECT SUM(amount)
                         FROM stock_transactions st
                         WHERE st.item_id = i.id 
                         AND st.transaction_type = 'ISSUE'
                         AND st.transaction_date BETWEEN p_start_date AND p_end_date), 0
                    )
                ) / 
                (
                    COALESCE(
                        (SELECT SUM(CASE WHEN transaction_type IN ('OPENING', 'RECEIPT') THEN quantity ELSE -quantity END)
                         FROM stock_transactions st
                         WHERE st.item_id = i.id AND st.transaction_date < p_start_date), 0
                    ) +
                    COALESCE(
                        (SELECT SUM(quantity)
                         FROM stock_transactions st
                         WHERE st.item_id = i.id 
                         AND st.transaction_type = 'RECEIPT'
                         AND st.transaction_date BETWEEN p_start_date AND p_end_date), 0
                    ) -
                    COALESCE(
                        (SELECT SUM(quantity)
                         FROM stock_transactions st
                         WHERE st.item_id = i.id 
                         AND st.transaction_type = 'ISSUE'
                         AND st.transaction_date BETWEEN p_start_date AND p_end_date), 0
                    )
                )
            )
            ELSE 0
        END::DECIMAL(15,2) as closing_rate,
        (
            COALESCE(
                (SELECT SUM(CASE WHEN transaction_type IN ('OPENING', 'RECEIPT') THEN amount ELSE -amount END)
                 FROM stock_transactions st
                 WHERE st.item_id = i.id AND st.transaction_date < p_start_date), 0
            ) +
            COALESCE(
                (SELECT SUM(amount)
                 FROM stock_transactions st
                 WHERE st.item_id = i.id 
                 AND st.transaction_type = 'RECEIPT'
                 AND st.transaction_date BETWEEN p_start_date AND p_end_date), 0
            ) -
            COALESCE(
                (SELECT SUM(amount)
                 FROM stock_transactions st
                 WHERE st.item_id = i.id 
                 AND st.transaction_type = 'ISSUE'
                 AND st.transaction_date BETWEEN p_start_date AND p_end_date), 0
            )
        )::DECIMAL(15,2) as closing_amount
    FROM items i
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN uom u ON i.uom_id = u.id
    WHERE (p_category_id IS NULL OR i.category_id = p_category_id)
    -- Show all items, not just those with transactions
    ORDER BY c.category_name, i.item_name;
END;
$$ LANGUAGE plpgsql;

-- Insert sample opening stock (for demonstration)
-- This should be run during initial setup
COMMENT ON TABLE stock_transactions IS 'Tracks all inventory movements for FIFO-based stock valuation';
COMMENT ON FUNCTION get_stock_statement_report IS 'Generates stock statement report with FIFO valuation for date range and optional category filter';

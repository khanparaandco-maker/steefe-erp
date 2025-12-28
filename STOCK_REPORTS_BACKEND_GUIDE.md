# Stock Reports Backend Implementation Guide

## Overview
This document outlines the backend API endpoints needed for the Stock Reports module based on the manufacturing process flow:
1. GRN (Raw Material Receipt)
2. Melting Process (Material Consumption & WIP Creation)
3. Heat Treatment (Production)
4. Dispatch (Finished Goods Issue)

## Required Backend Route: routes/stockReports.js

### 1. Raw Material Stock Report
**Endpoint:** `GET /api/stock-reports/raw-material`

**Query Parameters:**
- `category` (optional): Filter by category (MS Scrap, Mineral, Raw Material)
- `item_name` (optional): Search by item name

**SQL Logic:**
```sql
SELECT 
  i.id,
  i.item_name,
  c.category_name,
  u.uom_name,
  COALESCE(SUM(grn.total_weight), 0) as total_received,
  COALESCE(SUM(melting.consumed_weight), 0) as total_consumed,
  COALESCE(SUM(grn.total_weight), 0) - COALESCE(SUM(melting.consumed_weight), 0) as current_stock
FROM items i
LEFT JOIN categories c ON i.category_id = c.id
LEFT JOIN uom u ON i.uom_id = u.id
LEFT JOIN (
  SELECT item_id, SUM(net_weight) as total_weight
  FROM scrap_grn_items
  GROUP BY item_id
) grn ON i.id = grn.item_id
LEFT JOIN (
  -- Sum from MS Scrap in melting process scrap_weight column
  SELECT item_id, SUM(weight) as consumed_weight
  FROM melting_process_scrap
  GROUP BY item_id
  UNION ALL
  -- Sum from spectro readings (minerals)
  SELECT item_id, SUM(total_weight) as consumed_weight  
  FROM melting_process_spectro_readings
  GROUP BY item_id
) melting ON i.id = melting.item_id
WHERE c.category_name IN ('MS Scrap', 'Mineral', 'Raw Material')
GROUP BY i.id, i.item_name, c.category_name, u.uom_name
ORDER BY i.item_name
```

---

### 2. Material Consumption Report
**Endpoint:** `GET /api/stock-reports/consumption`

**Query Parameters:**
- `from_date` (optional)
- `to_date` (optional)
- `heat_no` (optional)

**SQL Logic:**
```sql
-- MS Scrap consumption
SELECT 
  mp.melting_date as movement_date,
  mp.heat_no,
  i.item_name,
  c.category_name,
  mps.weight as total_weight,
  'Melting' as process_type
FROM melting_processes mp
JOIN melting_process_scrap mps ON mp.id = mps.melting_process_id
JOIN items i ON mps.item_id = i.id
JOIN categories c ON i.category_id = c.id
WHERE ($1 IS NULL OR mp.melting_date >= $1)
  AND ($2 IS NULL OR mp.melting_date <= $2)
  AND ($3 IS NULL OR mp.heat_no = $3)

UNION ALL

-- Mineral consumption
SELECT 
  mp.melting_date as movement_date,
  mp.heat_no,
  i.item_name,
  c.category_name,
  mpsr.total_weight,
  'Melting' as process_type
FROM melting_processes mp
JOIN melting_process_spectro_readings mpsr ON mp.id = mpsr.melting_process_id
JOIN items i ON mpsr.item_id = i.id
JOIN categories c ON i.category_id = c.id
WHERE ($1 IS NULL OR mp.melting_date >= $1)
  AND ($2 IS NULL OR mp.melting_date <= $2)
  AND ($3 IS NULL OR mp.heat_no = $3)
ORDER BY movement_date DESC, heat_no
```

---

### 3. WIP Stock Report
**Endpoint:** `GET /api/stock-reports/wip`

**Query Parameters:**
- `from_date` (optional)
- `to_date` (optional)

**SQL Logic:**
```sql
SELECT 
  mp.id,
  mp.melting_date,
  mp.heat_no,
  mp.scrap_total,
  COALESCE(SUM(ht.bags_produced * 25), 0) as used_in_heat_treatment,
  mp.scrap_total - COALESCE(SUM(ht.bags_produced * 25), 0) as wip_stock
FROM melting_processes mp
LEFT JOIN heat_treatment ht ON DATE(mp.melting_date) = DATE(ht.treatment_date)
WHERE ($1 IS NULL OR mp.melting_date >= $1)
  AND ($2 IS NULL OR mp.melting_date <= $2)
GROUP BY mp.id, mp.melting_date, mp.heat_no, mp.scrap_total
ORDER BY mp.melting_date DESC
```

**Note:** This assumes WIP is calculated based on melting date correlation. You may need to adjust based on actual process tracking.

---

### 4. Production Report
**Endpoint:** `GET /api/stock-reports/production`

**Query Parameters:**
- `from_date` (optional)
- `to_date` (optional)
- `furnace_no` (optional)

**SQL Logic:**
```sql
SELECT 
  ht.id,
  ht.treatment_date,
  ht.furnace_no,
  i.item_name as size_name,
  ht.temperature,
  ht.bags_produced
FROM heat_treatment ht
JOIN items i ON ht.size_item_id = i.id
WHERE ($1 IS NULL OR ht.treatment_date >= $1)
  AND ($2 IS NULL OR ht.treatment_date <= $2)
  AND ($3 IS NULL OR ht.furnace_no = $3)
ORDER BY ht.treatment_date DESC
```

---

### 5. Finished Goods Stock Report
**Endpoint:** `GET /api/stock-reports/finished-goods`

**Query Parameters:**
- `item_name` (optional)

**SQL Logic:**
```sql
SELECT 
  i.id,
  i.item_name,
  COALESCE(SUM(ht.bags_produced), 0) as total_produced,
  COALESCE(SUM(dispatched.bags), 0) as total_dispatched,
  COALESCE(SUM(ht.bags_produced), 0) - COALESCE(SUM(dispatched.bags), 0) as current_stock_bags,
  (COALESCE(SUM(ht.bags_produced), 0) - COALESCE(SUM(dispatched.bags), 0)) * 25 as current_stock_kg
FROM items i
LEFT JOIN heat_treatment ht ON i.id = ht.size_item_id
LEFT JOIN (
  -- Get dispatched quantities from dispatch_items
  SELECT item_id, SUM(quantity / 25) as bags
  FROM dispatch_items
  GROUP BY item_id
) dispatched ON i.id = dispatched.item_id
WHERE i.category_id IN (SELECT id FROM categories WHERE category_name = 'Finished Product')
  AND ($1 IS NULL OR i.item_name ILIKE '%' || $1 || '%')
GROUP BY i.id, i.item_name
ORDER BY i.item_name
```

---

### 6. Stock Movement Report
**Endpoint:** `GET /api/stock-reports/movement`

**Query Parameters:**
- `from_date` (optional)
- `to_date` (optional)
- `item_name` (optional)
- `movement_type` (optional): GRN, Melting, Heat Treatment, Dispatch

**SQL Logic:**
```sql
-- GRN (Inward)
SELECT 
  sg.grn_date as movement_date,
  'GRN' as movement_type,
  i.item_name,
  c.category_name,
  sgi.net_weight as in_qty,
  NULL as out_qty,
  'GRN-' || sg.id as reference
FROM scrap_grn sg
JOIN scrap_grn_items sgi ON sg.id = sgi.grn_id
JOIN items i ON sgi.item_id = i.id
JOIN categories c ON i.category_id = c.id

UNION ALL

-- Melting (Outward - MS Scrap)
SELECT 
  mp.melting_date as movement_date,
  'Melting' as movement_type,
  i.item_name,
  c.category_name,
  NULL as in_qty,
  mps.weight as out_qty,
  'MP-' || mp.id || '-H' || mp.heat_no as reference
FROM melting_processes mp
JOIN melting_process_scrap mps ON mp.id = mps.melting_process_id
JOIN items i ON mps.item_id = i.id
JOIN categories c ON i.category_id = c.id

UNION ALL

-- Melting (Outward - Minerals)
SELECT 
  mp.melting_date as movement_date,
  'Melting' as movement_type,
  i.item_name,
  c.category_name,
  NULL as in_qty,
  mpsr.total_weight as out_qty,
  'MP-' || mp.id || '-H' || mp.heat_no as reference
FROM melting_processes mp
JOIN melting_process_spectro_readings mpsr ON mp.id = mpsr.melting_process_id
JOIN items i ON mpsr.item_id = i.id
JOIN categories c ON i.category_id = c.id

UNION ALL

-- Heat Treatment (Inward - Production)
SELECT 
  ht.treatment_date as movement_date,
  'Heat Treatment' as movement_type,
  i.item_name,
  c.category_name,
  ht.bags_produced * 25 as in_qty,
  NULL as out_qty,
  'HT-' || ht.id || '-F' || ht.furnace_no as reference
FROM heat_treatment ht
JOIN items i ON ht.size_item_id = i.id
JOIN categories c ON i.category_id = c.id

UNION ALL

-- Dispatch (Outward)
SELECT 
  d.dispatch_date as movement_date,
  'Dispatch' as movement_type,
  i.item_name,
  c.category_name,
  NULL as in_qty,
  di.quantity as out_qty,
  'DISP-' || d.id as reference
FROM dispatches d
JOIN dispatch_items di ON d.id = di.dispatch_id
JOIN items i ON di.item_id = i.id
JOIN categories c ON i.category_id = c.id

ORDER BY movement_date DESC, movement_type
```

---

## Implementation Steps

1. Create `routes/stockReports.js`
2. Implement all 6 endpoints with proper error handling
3. Use asyncHandler and apiResponse helpers (from utils/helpers.js)
4. Register the route in `server.js`:
   ```javascript
   app.use('/api/stock-reports', require('./routes/stockReports'));
   ```
5. Test each endpoint with sample data

## Notes
- All dates should be compared using `DATE()` function for consistency
- Each bag = 25 kg (as per requirement)
- WIP calculation may need adjustment based on actual process tracking
- Consider adding indexes on frequently queried columns (dates, item_id, etc.)

npm install && cd frontend && npm install && npm run build && cd .. && ls -la frontend/dist

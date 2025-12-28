const express = require('express');
const router = express.Router();
const { crud, query } = require('../config/database');
const { apiResponse, asyncHandler, validateRequired } = require('../utils/helpers');

// Get all items with joined data
router.get('/', asyncHandler(async (req, res) => {
  const { name, category_id } = req.query;
  
  let queryText = `
    SELECT 
      i.*,
      c.category_name,
      u.uom_short_name as uom_name,
      g.hsn_code,
      g.gst_rate
    FROM items i
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN uom u ON i.uom_id = u.id
    LEFT JOIN gst_rates g ON i.gst_rate_id = g.id
    WHERE 1=1
  `;
  
  const params = [];
  let paramIndex = 1;
  
  if (name) {
    queryText += ` AND i.item_name ILIKE $${paramIndex}`;
    params.push(`%${name}%`);
    paramIndex++;
  }
  
  if (category_id) {
    queryText += ` AND i.category_id = $${paramIndex}`;
    params.push(category_id);
    paramIndex++;
  }
  
  queryText += ' ORDER BY i.item_name ASC';
  
  const result = await query(queryText, params);
  res.json(apiResponse(true, result.rows));
}));

// Get item by ID with joined data
router.get('/:id', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT 
      i.*,
      c.category_name,
      u.uom_short_name as uom_name,
      g.hsn_code,
      g.gst_rate
    FROM items i
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN uom u ON i.uom_id = u.id
    LEFT JOIN gst_rates g ON i.gst_rate_id = g.id
    WHERE i.id = $1`,
    [req.params.id]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json(apiResponse(false, null, 'Item not found'));
  }
  
  res.json(apiResponse(true, result.rows[0]));
}));

// Create new item
router.post('/', asyncHandler(async (req, res) => {
  const { item_name, alias, category_id, uom_id, gst_rate_id } = req.body;
  
  validateRequired(req.body, ['item_name', 'category_id', 'uom_id', 'gst_rate_id']);
  
  // Verify foreign keys exist
  const category = await crud.findById('categories', category_id);
  if (!category) {
    return res.status(400).json(apiResponse(false, null, 'Invalid category_id'));
  }
  
  const uom = await crud.findById('uom', uom_id);
  if (!uom) {
    return res.status(400).json(apiResponse(false, null, 'Invalid uom_id'));
  }
  
  const gstRate = await crud.findById('gst_rates', gst_rate_id);
  if (!gstRate) {
    return res.status(400).json(apiResponse(false, null, 'Invalid gst_rate_id'));
  }
  
  const item = await crud.create('items', {
    item_name,
    alias,
    category_id,
    uom_id,
    gst_rate_id
  });
  
  // Return with joined data
  const result = await query(
    `SELECT 
      i.*,
      c.category_name,
      u.uom_short_name as uom_name,
      g.hsn_code,
      g.gst_rate
    FROM items i
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN uom u ON i.uom_id = u.id
    LEFT JOIN gst_rates g ON i.gst_rate_id = g.id
    WHERE i.id = $1`,
    [item.id]
  );
  
  res.status(201).json(apiResponse(true, result.rows[0], 'Item created successfully'));
}));

// Update item
router.put('/:id', asyncHandler(async (req, res) => {
  const { item_name, alias, category_id, uom_id, gst_rate_id } = req.body;
  
  const existing = await crud.findById('items', req.params.id);
  if (!existing) {
    return res.status(404).json(apiResponse(false, null, 'Item not found'));
  }
  
  // Verify foreign keys if provided
  if (category_id) {
    const category = await crud.findById('categories', category_id);
    if (!category) {
      return res.status(400).json(apiResponse(false, null, 'Invalid category_id'));
    }
  }
  
  if (uom_id) {
    const uom = await crud.findById('uom', uom_id);
    if (!uom) {
      return res.status(400).json(apiResponse(false, null, 'Invalid uom_id'));
    }
  }
  
  if (gst_rate_id) {
    const gstRate = await crud.findById('gst_rates', gst_rate_id);
    if (!gstRate) {
      return res.status(400).json(apiResponse(false, null, 'Invalid gst_rate_id'));
    }
  }
  
  const updateData = {};
  if (item_name !== undefined) updateData.item_name = item_name;
  if (alias !== undefined) updateData.alias = alias;
  if (category_id !== undefined) updateData.category_id = category_id;
  if (uom_id !== undefined) updateData.uom_id = uom_id;
  if (gst_rate_id !== undefined) updateData.gst_rate_id = gst_rate_id;
  
  await crud.update('items', req.params.id, updateData);
  
  // Return with joined data
  const result = await query(
    `SELECT 
      i.*,
      c.category_name,
      u.uom_short_name as uom_name,
      g.hsn_code,
      g.gst_rate
    FROM items i
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN uom u ON i.uom_id = u.id
    LEFT JOIN gst_rates g ON i.gst_rate_id = g.id
    WHERE i.id = $1`,
    [req.params.id]
  );
  
  res.json(apiResponse(true, result.rows[0], 'Item updated successfully'));
}));

// Delete item
router.delete('/:id', asyncHandler(async (req, res) => {
  const item = await crud.delete('items', req.params.id);
  
  if (!item) {
    return res.status(404).json(apiResponse(false, null, 'Item not found'));
  }
  
  res.json(apiResponse(true, null, 'Item deleted successfully'));
}));

module.exports = router;

const express = require('express');
const router = express.Router();
const { crud, query } = require('../config/database');
const { apiResponse, asyncHandler, validateRequired } = require('../utils/helpers');

// Get all GST rates (active by default)
router.get('/', asyncHandler(async (req, res) => {
  const { hsn_code, is_active } = req.query;
  const filters = {};
  
  if (hsn_code) filters.hsn_code = hsn_code;
  if (is_active !== undefined) filters.is_active = is_active === 'true';
  else filters.is_active = true; // Default to active rates
  
  const gstRates = await crud.findAll('gst_rates', filters, { orderBy: 'hsn_code ASC, effective_date DESC' });
  res.json(apiResponse(true, gstRates));
}));

// Get GST rate by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const gstRate = await crud.findById('gst_rates', req.params.id);
  
  if (!gstRate) {
    return res.status(404).json(apiResponse(false, null, 'GST rate not found'));
  }
  
  res.json(apiResponse(true, gstRate));
}));

// Get active GST rate by HSN code
router.get('/hsn/:hsn_code', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT * FROM gst_rates 
     WHERE hsn_code = $1 AND is_active = true 
     ORDER BY effective_date DESC 
     LIMIT 1`,
    [req.params.hsn_code]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json(apiResponse(false, null, 'No active GST rate found for this HSN code'));
  }
  
  res.json(apiResponse(true, result.rows[0]));
}));

// Create new GST rate
router.post('/', asyncHandler(async (req, res) => {
  const { gst_details, hsn_code, gst_rate, effective_date, is_active } = req.body;
  
  validateRequired(req.body, ['gst_details', 'hsn_code', 'gst_rate']);
  
  if (gst_rate < 0 || gst_rate > 100) {
    return res.status(400).json(apiResponse(false, null, 'GST rate must be between 0 and 100'));
  }
  
  const gstRate = await crud.create('gst_rates', {
    gst_details,
    hsn_code,
    gst_rate,
    effective_date: effective_date || new Date().toISOString().split('T')[0],
    is_active: is_active !== undefined ? is_active : true
  });
  
  res.status(201).json(apiResponse(true, gstRate, 'GST rate created successfully'));
}));

// Update GST rate
router.put('/:id', asyncHandler(async (req, res) => {
  const { gst_details, hsn_code, gst_rate, effective_date, is_active } = req.body;
  
  const existing = await crud.findById('gst_rates', req.params.id);
  if (!existing) {
    return res.status(404).json(apiResponse(false, null, 'GST rate not found'));
  }
  
  if (gst_rate !== undefined && (gst_rate < 0 || gst_rate > 100)) {
    return res.status(400).json(apiResponse(false, null, 'GST rate must be between 0 and 100'));
  }
  
  const updateData = {};
  if (gst_details !== undefined) updateData.gst_details = gst_details;
  if (hsn_code !== undefined) updateData.hsn_code = hsn_code;
  if (gst_rate !== undefined) updateData.gst_rate = gst_rate;
  if (effective_date !== undefined) updateData.effective_date = effective_date;
  if (is_active !== undefined) updateData.is_active = is_active;
  
  const gstRate = await crud.update('gst_rates', req.params.id, updateData);
  res.json(apiResponse(true, gstRate, 'GST rate updated successfully'));
}));

// Delete GST rate
router.delete('/:id', asyncHandler(async (req, res) => {
  const gstRate = await crud.delete('gst_rates', req.params.id);
  
  if (!gstRate) {
    return res.status(404).json(apiResponse(false, null, 'GST rate not found'));
  }
  
  res.json(apiResponse(true, null, 'GST rate deleted successfully'));
}));

module.exports = router;

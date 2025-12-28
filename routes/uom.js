const express = require('express');
const router = express.Router();
const { crud } = require('../config/database');
const { apiResponse, asyncHandler, validateRequired } = require('../utils/helpers');

// Get all UOMs
router.get('/', asyncHandler(async (req, res) => {
  const uoms = await crud.findAll('uom', {}, { orderBy: 'uom_short_name ASC' });
  res.json(apiResponse(true, uoms));
}));

// Get UOM by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const uom = await crud.findById('uom', req.params.id);
  
  if (!uom) {
    return res.status(404).json(apiResponse(false, null, 'UOM not found'));
  }
  
  res.json(apiResponse(true, uom));
}));

// Create new UOM
router.post('/', asyncHandler(async (req, res) => {
  const { uom_short_name, uom_description } = req.body;
  
  validateRequired(req.body, ['uom_short_name']);
  
  const uom = await crud.create('uom', { uom_short_name, uom_description });
  res.status(201).json(apiResponse(true, uom, 'UOM created successfully'));
}));

// Update UOM
router.put('/:id', asyncHandler(async (req, res) => {
  const { uom_short_name, uom_description } = req.body;
  
  const existing = await crud.findById('uom', req.params.id);
  if (!existing) {
    return res.status(404).json(apiResponse(false, null, 'UOM not found'));
  }
  
  const updateData = {};
  if (uom_short_name !== undefined) updateData.uom_short_name = uom_short_name;
  if (uom_description !== undefined) updateData.uom_description = uom_description;
  
  const uom = await crud.update('uom', req.params.id, updateData);
  res.json(apiResponse(true, uom, 'UOM updated successfully'));
}));

// Delete UOM
router.delete('/:id', asyncHandler(async (req, res) => {
  const uom = await crud.delete('uom', req.params.id);
  
  if (!uom) {
    return res.status(404).json(apiResponse(false, null, 'UOM not found'));
  }
  
  res.json(apiResponse(true, null, 'UOM deleted successfully'));
}));

module.exports = router;

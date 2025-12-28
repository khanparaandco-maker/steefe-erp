const express = require('express');
const router = express.Router();
const { crud } = require('../config/database');
const { apiResponse, asyncHandler, validateRequired } = require('../utils/helpers');

// Get all transporters
router.get('/', asyncHandler(async (req, res) => {
  const { name, city, state } = req.query;
  const filters = {};
  
  if (name) filters.transporter_name = `%${name}%`;
  if (city) filters.city = city;
  if (state) filters.state = state;
  
  const transporters = await crud.findAll('transporters', filters, { orderBy: 'transporter_name ASC' });
  res.json(apiResponse(true, transporters));
}));

// Get transporter by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const transporter = await crud.findById('transporters', req.params.id);
  
  if (!transporter) {
    return res.status(404).json(apiResponse(false, null, 'Transporter not found'));
  }
  
  res.json(apiResponse(true, transporter));
}));

// Create new transporter
router.post('/', asyncHandler(async (req, res) => {
  const { transporter_name, address_line1, address_line2, city, state, gstn, contact_person1, mobile_no, contact_person2 } = req.body;
  
  validateRequired(req.body, ['transporter_name']);
  
  const transporter = await crud.create('transporters', {
    transporter_name,
    address_line1,
    address_line2,
    city,
    state,
    gstn,
    contact_person1,
    mobile_no,
    contact_person2
  });
  
  res.status(201).json(apiResponse(true, transporter, 'Transporter created successfully'));
}));

// Update transporter
router.put('/:id', asyncHandler(async (req, res) => {
  const { transporter_name, address_line1, address_line2, city, state, gstn, contact_person1, mobile_no, contact_person2 } = req.body;
  
  const existing = await crud.findById('transporters', req.params.id);
  if (!existing) {
    return res.status(404).json(apiResponse(false, null, 'Transporter not found'));
  }
  
  const updateData = {};
  if (transporter_name !== undefined) updateData.transporter_name = transporter_name;
  if (address_line1 !== undefined) updateData.address_line1 = address_line1;
  if (address_line2 !== undefined) updateData.address_line2 = address_line2;
  if (city !== undefined) updateData.city = city;
  if (state !== undefined) updateData.state = state;
  if (gstn !== undefined) updateData.gstn = gstn;
  if (contact_person1 !== undefined) updateData.contact_person1 = contact_person1;
  if (mobile_no !== undefined) updateData.mobile_no = mobile_no;
  if (contact_person2 !== undefined) updateData.contact_person2 = contact_person2;
  
  const transporter = await crud.update('transporters', req.params.id, updateData);
  res.json(apiResponse(true, transporter, 'Transporter updated successfully'));
}));

// Delete transporter
router.delete('/:id', asyncHandler(async (req, res) => {
  const transporter = await crud.delete('transporters', req.params.id);
  
  if (!transporter) {
    return res.status(404).json(apiResponse(false, null, 'Transporter not found'));
  }
  
  res.json(apiResponse(true, null, 'Transporter deleted successfully'));
}));

module.exports = router;

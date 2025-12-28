const express = require('express');
const router = express.Router();
const { crud } = require('../config/database');
const { apiResponse, asyncHandler, validateRequired } = require('../utils/helpers');

// Get all suppliers
router.get('/', asyncHandler(async (req, res) => {
  const { name, city, state } = req.query;
  const filters = {};
  
  if (name) filters.supplier_name = `%${name}%`;
  if (city) filters.city = city;
  if (state) filters.state = state;
  
  const suppliers = await crud.findAll('suppliers', filters, { orderBy: 'supplier_name ASC' });
  res.json(apiResponse(true, suppliers));
}));

// Get supplier by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const supplier = await crud.findById('suppliers', req.params.id);
  
  if (!supplier) {
    return res.status(404).json(apiResponse(false, null, 'Supplier not found'));
  }
  
  res.json(apiResponse(true, supplier));
}));

// Create new supplier
router.post('/', asyncHandler(async (req, res) => {
  const { supplier_name, address_line1, address_line2, city, state, gstn, contact_person1, mobile_no, contact_person2 } = req.body;
  
  validateRequired(req.body, ['supplier_name']);
  
  const supplier = await crud.create('suppliers', {
    supplier_name,
    address_line1,
    address_line2,
    city,
    state,
    gstn,
    contact_person1,
    mobile_no,
    contact_person2
  });
  
  res.status(201).json(apiResponse(true, supplier, 'Supplier created successfully'));
}));

// Update supplier
router.put('/:id', asyncHandler(async (req, res) => {
  const { supplier_name, address_line1, address_line2, city, state, gstn, contact_person1, mobile_no, contact_person2 } = req.body;
  
  const existing = await crud.findById('suppliers', req.params.id);
  if (!existing) {
    return res.status(404).json(apiResponse(false, null, 'Supplier not found'));
  }
  
  const updateData = {};
  if (supplier_name !== undefined) updateData.supplier_name = supplier_name;
  if (address_line1 !== undefined) updateData.address_line1 = address_line1;
  if (address_line2 !== undefined) updateData.address_line2 = address_line2;
  if (city !== undefined) updateData.city = city;
  if (state !== undefined) updateData.state = state;
  if (gstn !== undefined) updateData.gstn = gstn;
  if (contact_person1 !== undefined) updateData.contact_person1 = contact_person1;
  if (mobile_no !== undefined) updateData.mobile_no = mobile_no;
  if (contact_person2 !== undefined) updateData.contact_person2 = contact_person2;
  
  const supplier = await crud.update('suppliers', req.params.id, updateData);
  res.json(apiResponse(true, supplier, 'Supplier updated successfully'));
}));

// Delete supplier
router.delete('/:id', asyncHandler(async (req, res) => {
  const supplier = await crud.delete('suppliers', req.params.id);
  
  if (!supplier) {
    return res.status(404).json(apiResponse(false, null, 'Supplier not found'));
  }
  
  res.json(apiResponse(true, null, 'Supplier deleted successfully'));
}));

module.exports = router;

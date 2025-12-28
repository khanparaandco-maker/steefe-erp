const express = require('express');
const router = express.Router();
const { crud } = require('../config/database');
const { apiResponse, asyncHandler, validateRequired } = require('../utils/helpers');

// Get all customers
router.get('/', asyncHandler(async (req, res) => {
  const { name, city, state } = req.query;
  const filters = {};
  
  if (name) filters.customer_name = `%${name}%`;
  if (city) filters.city = city;
  if (state) filters.state = state;
  
  const customers = await crud.findAll('customers', filters, { orderBy: 'customer_name ASC' });
  res.json(apiResponse(true, customers));
}));

// Get customer by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const customer = await crud.findById('customers', req.params.id);
  
  if (!customer) {
    return res.status(404).json(apiResponse(false, null, 'Customer not found'));
  }
  
  res.json(apiResponse(true, customer));
}));

// Create new customer
router.post('/', asyncHandler(async (req, res) => {
  const { customer_name, address_line1, address_line2, city, state, gstn, contact_person1, mobile_no, contact_person2 } = req.body;
  
  validateRequired(req.body, ['customer_name', 'state']);
  
  const customer = await crud.create('customers', {
    customer_name,
    address_line1,
    address_line2,
    city,
    state,
    gstn,
    contact_person1,
    mobile_no,
    contact_person2
  });
  
  res.status(201).json(apiResponse(true, customer, 'Customer created successfully'));
}));

// Update customer
router.put('/:id', asyncHandler(async (req, res) => {
  const { customer_name, address_line1, address_line2, city, state, gstn, contact_person1, mobile_no, contact_person2 } = req.body;
  
  const existing = await crud.findById('customers', req.params.id);
  if (!existing) {
    return res.status(404).json(apiResponse(false, null, 'Customer not found'));
  }
  
  const updateData = {};
  if (customer_name !== undefined) updateData.customer_name = customer_name;
  if (address_line1 !== undefined) updateData.address_line1 = address_line1;
  if (address_line2 !== undefined) updateData.address_line2 = address_line2;
  if (city !== undefined) updateData.city = city;
  if (state !== undefined) updateData.state = state;
  if (gstn !== undefined) updateData.gstn = gstn;
  if (contact_person1 !== undefined) updateData.contact_person1 = contact_person1;
  if (mobile_no !== undefined) updateData.mobile_no = mobile_no;
  if (contact_person2 !== undefined) updateData.contact_person2 = contact_person2;
  
  const customer = await crud.update('customers', req.params.id, updateData);
  res.json(apiResponse(true, customer, 'Customer updated successfully'));
}));

// Delete customer
router.delete('/:id', asyncHandler(async (req, res) => {
  const customer = await crud.delete('customers', req.params.id);
  
  if (!customer) {
    return res.status(404).json(apiResponse(false, null, 'Customer not found'));
  }
  
  res.json(apiResponse(true, null, 'Customer deleted successfully'));
}));

module.exports = router;

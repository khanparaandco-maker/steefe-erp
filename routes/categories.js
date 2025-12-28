const express = require('express');
const router = express.Router();
const { crud } = require('../config/database');
const { apiResponse, asyncHandler, validateRequired } = require('../utils/helpers');

// Get all categories
router.get('/', asyncHandler(async (req, res) => {
  const categories = await crud.findAll('categories', {}, { orderBy: 'category_name ASC' });
  res.json(apiResponse(true, categories));
}));

// Get category by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const category = await crud.findById('categories', req.params.id);
  
  if (!category) {
    return res.status(404).json(apiResponse(false, null, 'Category not found'));
  }
  
  res.json(apiResponse(true, category));
}));

// Create new category
router.post('/', asyncHandler(async (req, res) => {
  const { category_name, alias } = req.body;
  
  validateRequired(req.body, ['category_name']);
  
  const category = await crud.create('categories', { category_name, alias });
  res.status(201).json(apiResponse(true, category, 'Category created successfully'));
}));

// Update category
router.put('/:id', asyncHandler(async (req, res) => {
  const { category_name, alias } = req.body;
  
  const existing = await crud.findById('categories', req.params.id);
  if (!existing) {
    return res.status(404).json(apiResponse(false, null, 'Category not found'));
  }
  
  const updateData = {};
  if (category_name !== undefined) updateData.category_name = category_name;
  if (alias !== undefined) updateData.alias = alias;
  
  const category = await crud.update('categories', req.params.id, updateData);
  res.json(apiResponse(true, category, 'Category updated successfully'));
}));

// Delete category
router.delete('/:id', asyncHandler(async (req, res) => {
  const category = await crud.delete('categories', req.params.id);
  
  if (!category) {
    return res.status(404).json(apiResponse(false, null, 'Category not found'));
  }
  
  res.json(apiResponse(true, null, 'Category deleted successfully'));
}));

module.exports = router;

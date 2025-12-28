const express = require('express');
const router = express.Router();
const { crud, query } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { apiResponse, validateRequired } = require('../utils/helpers');

/**
 * @route   GET /api/heat-treatment
 * @desc    Get all heat treatment records with optional filters
 * @access  Private
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { from_date, to_date, furnace_no } = req.query;

    let queryText = `
      SELECT 
        ht.id,
        ht.treatment_date,
        ht.furnace_no,
        ht.size_item_id,
        i.item_name as size_name,
        ht.time_in,
        ht.time_out,
        ht.temperature,
        ht.bags_produced,
        ht.created_at,
        ht.updated_at
      FROM heat_treatment ht
      LEFT JOIN items i ON ht.size_item_id = i.id
      WHERE 1=1
    `;

    const queryParams = [];
    let paramCount = 1;

    if (from_date) {
      queryText += ` AND ht.treatment_date >= $${paramCount}`;
      queryParams.push(from_date);
      paramCount++;
    }

    if (to_date) {
      queryText += ` AND ht.treatment_date <= $${paramCount}`;
      queryParams.push(to_date);
      paramCount++;
    }

    if (furnace_no) {
      queryText += ` AND ht.furnace_no = $${paramCount}`;
      queryParams.push(furnace_no);
      paramCount++;
    }

    queryText += ` ORDER BY ht.treatment_date DESC, ht.furnace_no ASC`;

    const result = await query(queryText, queryParams);
    res.json(apiResponse(true, result.rows));
  })
);

/**
 * @route   GET /api/heat-treatment/:id
 * @desc    Get heat treatment by ID
 * @access  Private
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const queryText = `
      SELECT 
        ht.id,
        ht.treatment_date,
        ht.furnace_no,
        ht.size_item_id,
        i.item_name as size_name,
        i.alias as size_alias,
        ht.time_in,
        ht.time_out,
        ht.temperature,
        ht.bags_produced,
        ht.created_at,
        ht.updated_at
      FROM heat_treatment ht
      LEFT JOIN items i ON ht.size_item_id = i.id
      WHERE ht.id = $1
    `;

    const result = await query(queryText, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json(apiResponse(false, null, 'Heat treatment record not found'));
    }

    res.json(apiResponse(true, result.rows[0]));
  })
);

/**
 * @route   POST /api/heat-treatment
 * @desc    Create new heat treatment record
 * @access  Private
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const {
      treatment_date,
      furnace_no,
      size_item_id,
      time_in,
      time_out,
      temperature,
      bags_produced,
    } = req.body;

    // Validate required fields
    try {
      validateRequired(req.body, [
        'treatment_date',
        'furnace_no',
        'size_item_id',
        'time_in',
        'time_out',
        'temperature',
        'bags_produced',
      ]);
    } catch (error) {
      return res.status(400).json(apiResponse(false, null, error.message));
    }

    // Validate furnace number range
    if (furnace_no < 1 || furnace_no > 6) {
      return res.status(400).json(apiResponse(false, null, 'Furnace number must be between 1 and 6'));
    }

    // Validate temperature
    if (temperature <= 0) {
      return res.status(400).json(apiResponse(false, null, 'Temperature must be greater than 0'));
    }

    // Validate bags produced
    if (bags_produced <= 0) {
      return res.status(400).json(apiResponse(false, null, 'Bags produced must be greater than 0'));
    }

    // Validate time sequence
    if (time_out <= time_in) {
      return res.status(400).json(apiResponse(false, null, 'Time Out must be after Time In'));
    }

    // Verify that the item exists and is a finished good
    const itemCheck = await query(
      `SELECT i.id, i.item_name, c.category_name 
       FROM items i 
       LEFT JOIN categories c ON i.category_id = c.id 
       WHERE i.id = $1`,
      [size_item_id]
    );

    if (itemCheck.rows.length === 0) {
      return res.status(400).json(apiResponse(false, null, 'Invalid item selected'));
    }

    const item = itemCheck.rows[0];
    if (item.category_name !== 'Finished Product') {
      return res.status(400).json(apiResponse(false, null, 'Only Finished Product items are allowed'));
    }

    // Insert heat treatment record
    const insertQuery = `
      INSERT INTO heat_treatment (
        treatment_date, furnace_no, size_item_id, time_in, time_out, temperature, bags_produced
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;

    const result = await query(insertQuery, [
      treatment_date,
      furnace_no,
      size_item_id,
      time_in,
      time_out,
      temperature,
      bags_produced,
    ]);

    res.status(201).json(
      apiResponse(true, { id: result.rows[0].id }, 'Heat treatment record created successfully')
    );
  })
);

/**
 * @route   PUT /api/heat-treatment/:id
 * @desc    Update heat treatment record
 * @access  Private
 */
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      treatment_date,
      furnace_no,
      size_item_id,
      time_in,
      time_out,
      temperature,
      bags_produced,
    } = req.body;

    // Validate required fields
    try {
      validateRequired(req.body, [
        'treatment_date',
        'furnace_no',
        'size_item_id',
        'time_in',
        'time_out',
        'temperature',
        'bags_produced',
      ]);
    } catch (error) {
      return res.status(400).json(apiResponse(false, null, error.message));
    }

    // Validate furnace number range
    if (furnace_no < 1 || furnace_no > 6) {
      return res.status(400).json(apiResponse(false, null, 'Furnace number must be between 1 and 6'));
    }

    // Validate temperature
    if (temperature <= 0) {
      return res.status(400).json(apiResponse(false, null, 'Temperature must be greater than 0'));
    }

    // Validate bags produced
    if (bags_produced <= 0) {
      return res.status(400).json(apiResponse(false, null, 'Bags produced must be greater than 0'));
    }

    // Validate time sequence
    if (time_out <= time_in) {
      return res.status(400).json(apiResponse(false, null, 'Time Out must be after Time In'));
    }

    // Check if record exists
    const existingRecord = await crud.findById('heat_treatment', id);
    if (!existingRecord) {
      return res.status(404).json(apiResponse(false, null, 'Heat treatment record not found'));
    }

    // Verify that the item exists and is a finished good
    const itemCheck = await query(
      `SELECT i.id, i.item_name, c.category_name 
       FROM items i 
       LEFT JOIN categories c ON i.category_id = c.id 
       WHERE i.id = $1`,
      [size_item_id]
    );

    if (itemCheck.rows.length === 0) {
      return res.status(400).json(apiResponse(false, null, 'Invalid item selected'));
    }

    const item = itemCheck.rows[0];
    if (item.category_name !== 'Finished Product') {
      return res.status(400).json(apiResponse(false, null, 'Only Finished Product items are allowed'));
    }

    // Update heat treatment record
    const updateQuery = `
      UPDATE heat_treatment
      SET 
        treatment_date = $1,
        furnace_no = $2,
        size_item_id = $3,
        time_in = $4,
        time_out = $5,
        temperature = $6,
        bags_produced = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING id
    `;

    await query(updateQuery, [
      treatment_date,
      furnace_no,
      size_item_id,
      time_in,
      time_out,
      temperature,
      bags_produced,
      id,
    ]);

    res.json(apiResponse(true, { id }, 'Heat treatment record updated successfully'));
  })
);

/**
 * @route   DELETE /api/heat-treatment/:id
 * @desc    Delete heat treatment record
 * @access  Private
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if record exists
    const existingRecord = await crud.findById('heat_treatment', id);
    if (!existingRecord) {
      return res.status(404).json(apiResponse(false, null, 'Heat treatment record not found'));
    }

    // Delete the record
    await crud.delete('heat_treatment', id);

    res.json(apiResponse(true, null, 'Heat treatment record deleted successfully'));
  })
);

module.exports = router;

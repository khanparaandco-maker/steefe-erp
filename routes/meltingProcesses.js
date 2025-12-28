const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');
const { apiResponse, asyncHandler, validateRequired } = require('../utils/helpers');

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

// Calculate scrap total from expression (e.g., "100+200+250")
const calculateScrapTotal = (expression) => {
  try {
    // Remove all whitespace
    const cleaned = expression.replace(/\s/g, '');
    
    // Validate: only allow numbers, +, -, *, /, ., ()
    if (!/^[0-9+\-*/().]+$/.test(cleaned)) {
      throw new Error('Invalid expression: only numbers and operators (+, -, *, /, ., ()) are allowed');
    }
    
    // Prevent dangerous patterns
    if (cleaned.includes('__') || cleaned.includes('constructor') || cleaned.includes('prototype')) {
      throw new Error('Invalid expression');
    }
    
    // Calculate using Function constructor (safer than eval)
    const result = new Function('return ' + cleaned)();
    
    if (!isFinite(result) || isNaN(result)) {
      throw new Error('Invalid calculation result');
    }
    
    return parseFloat(result.toFixed(3));
  } catch (error) {
    throw new Error(`Invalid scrap weight expression: ${error.message}`);
  }
};

// Validate time format (HH:MM)
const validateTime = (timeString) => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
};

// ==========================================
// GET ALL MELTING PROCESSES
// ==========================================

router.get('/', asyncHandler(async (req, res) => {
  const { from_date, to_date, heat_no } = req.query;
  
  let queryText = `
    SELECT 
      mp.id,
      mp.melting_date,
      mp.heat_no,
      mp.scrap_weight,
      mp.scrap_total,
      mp.time_in,
      mp.time_out,
      mp.carbon,
      mp.manganese,
      mp.silicon,
      mp.aluminium,
      mp.calcium,
      mp.temperature,
      mp.created_at,
      mp.updated_at,
      COUNT(msr.id) as spectro_reading_count
    FROM melting_processes mp
    LEFT JOIN melting_spectro_readings msr ON mp.id = msr.melting_process_id
    WHERE 1=1
  `;
  
  const params = [];
  let paramIndex = 1;
  
  if (from_date) {
    queryText += ` AND mp.melting_date >= $${paramIndex}`;
    params.push(from_date);
    paramIndex++;
  }
  
  if (to_date) {
    queryText += ` AND mp.melting_date <= $${paramIndex}`;
    params.push(to_date);
    paramIndex++;
  }
  
  if (heat_no) {
    queryText += ` AND mp.heat_no = $${paramIndex}`;
    params.push(heat_no);
    paramIndex++;
  }
  
  queryText += `
    GROUP BY mp.id
    ORDER BY mp.melting_date DESC, mp.heat_no ASC
  `;
  
  const result = await query(queryText, params);
  res.json(apiResponse(true, result.rows));
}));

// ==========================================
// GET SINGLE MELTING PROCESS BY ID
// ==========================================

router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Get main melting process record
  const processResult = await query(
    `SELECT * FROM melting_processes WHERE id = $1`,
    [id]
  );
  
  if (processResult.rows.length === 0) {
    return res.status(404).json(apiResponse(false, null, 'Melting process not found'));
  }
  
  // Get spectro readings
  const spectroResult = await query(
    `SELECT * FROM melting_spectro_readings 
     WHERE melting_process_id = $1 
     ORDER BY reading_sequence ASC`,
    [id]
  );
  
  const data = {
    ...processResult.rows[0],
    spectro_readings: spectroResult.rows
  };
  
  res.json(apiResponse(true, data));
}));

// ==========================================
// CREATE NEW MELTING PROCESS
// ==========================================

router.post('/', asyncHandler(async (req, res) => {
  const {
    melting_date,
    heat_no,
    scrap_weight,
    time_in,
    time_out,
    carbon,
    manganese,
    silicon,
    aluminium,
    calcium,
    temperature,
    spectro_readings
  } = req.body;
  
  // Validation
  try {
    validateRequired(req.body, ['melting_date', 'heat_no', 'scrap_weight', 'time_in', 'time_out']);
  } catch (error) {
    return res.status(400).json(apiResponse(false, null, error.message));
  }
  
  // Validate heat number
  if (heat_no < 1 || heat_no > 10) {
    return res.status(400).json(
      apiResponse(false, null, 'Heat number must be between 1 and 10')
    );
  }
  
  // Validate time format
  if (!validateTime(time_in) || !validateTime(time_out)) {
    return res.status(400).json(
      apiResponse(false, null, 'Invalid time format. Use HH:MM format')
    );
  }
  
  // Calculate scrap total
  let scrap_total;
  try {
    scrap_total = calculateScrapTotal(scrap_weight);
  } catch (error) {
    return res.status(400).json(apiResponse(false, null, error.message));
  }
  
  // Check MS Scrap stock availability
  const stockCheck = await query(`
    SELECT 
      COALESCE(SUM(sgi.quantity), 0) as total_received,
      COALESCE((SELECT SUM(scrap_total) FROM melting_processes), 0) as total_consumed,
      COALESCE(SUM(sgi.quantity), 0) - COALESCE((SELECT SUM(scrap_total) FROM melting_processes), 0) as current_stock
    FROM scrap_grn_items sgi
    JOIN items i ON sgi.item_id = i.id
    WHERE i.item_name = 'MS Scrap'
  `);
  
  const currentStock = parseFloat(stockCheck.rows[0].current_stock || 0);
  
  if (currentStock < scrap_total) {
    return res.status(400).json(
      apiResponse(false, null, `Insufficient MS Scrap stock. Available: ${currentStock.toFixed(3)} kg, Required: ${scrap_total.toFixed(3)} kg. Stock will be negative by ${(scrap_total - currentStock).toFixed(3)} kg.`)
    );
  }
  
  // Check mineral stock availability
  const minerals = [
    { name: 'CARBON', value: carbon, field: 'Carbon' },
    { name: 'MANGANESE', value: manganese, field: 'Manganese' },
    { name: 'SILICON', value: silicon, field: 'Silicon' },
    { name: 'ALUMINIUM', value: aluminium, field: 'Aluminium' },
    { name: 'CALCIUM', value: calcium, field: 'Calcium' }
  ];
  
  const insufficientItems = [];
  
  for (const mineral of minerals) {
    if (mineral.value && parseFloat(mineral.value) > 0) {
      const mineralStock = await query(`
        SELECT 
          COALESCE(SUM(sgi.quantity), 0) as total_received,
          COALESCE((SELECT SUM(${mineral.field.toLowerCase()}) FROM melting_processes), 0) as total_consumed,
          COALESCE(SUM(sgi.quantity), 0) - COALESCE((SELECT SUM(${mineral.field.toLowerCase()}) FROM melting_processes), 0) as current_stock
        FROM scrap_grn_items sgi
        JOIN items i ON sgi.item_id = i.id
        WHERE i.item_name = $1
      `, [mineral.name]);
      
      const availableStock = parseFloat(mineralStock.rows[0].current_stock || 0);
      const requiredQty = parseFloat(mineral.value);
      
      if (availableStock < requiredQty) {
        insufficientItems.push(
          `${mineral.field}: Available ${availableStock.toFixed(3)} kg, Required ${requiredQty.toFixed(3)} kg (Short by ${(requiredQty - availableStock).toFixed(3)} kg)`
        );
      }
    }
  }
  
  if (insufficientItems.length > 0) {
    return res.status(400).json(
      apiResponse(false, null, `Insufficient stock for the following items:\n${insufficientItems.join('\n')}`)
    );
  }
  
  // Validate spectro readings - check if it exists and is an array
  if (!spectro_readings) {
    return res.status(400).json(
      apiResponse(false, null, 'Spectro readings are required')
    );
  }
  
  if (!Array.isArray(spectro_readings)) {
    return res.status(400).json(
      apiResponse(false, null, 'Spectro readings must be an array')
    );
  }
  
  if (spectro_readings.length === 0) {
    return res.status(400).json(
      apiResponse(false, null, 'At least one spectro reading is required')
    );
  }
  
  // Check for duplicate melting_date + heat_no
  const duplicateCheck = await query(
    `SELECT id FROM melting_processes WHERE melting_date = $1 AND heat_no = $2`,
    [melting_date, heat_no]
  );
  
  if (duplicateCheck.rows.length > 0) {
    return res.status(400).json(
      apiResponse(false, null, `A melting process for Heat No. ${heat_no} on ${melting_date} already exists`)
    );
  }
  
  // Use transaction to insert both melting process and spectro readings
  const result = await transaction(async (client) => {
    // Insert melting process
    const insertResult = await client.query(
      `INSERT INTO melting_processes (
        melting_date, heat_no, scrap_weight, scrap_total,
        time_in, time_out, carbon, manganese, silicon,
        aluminium, calcium, temperature
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        melting_date, heat_no, scrap_weight, scrap_total,
        time_in, time_out, carbon, manganese, silicon,
        aluminium, calcium, temperature
      ]
    );
    
    const melting_process_id = insertResult.rows[0].id;
    
    // Insert spectro readings
    for (let i = 0; i < spectro_readings.length; i++) {
      const reading = spectro_readings[i];
      await client.query(
        `INSERT INTO melting_spectro_readings (
          melting_process_id, carbon, silicon, manganese,
          phosphorus, sulphur, chrome, reading_sequence
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          melting_process_id,
          reading.carbon,
          reading.silicon,
          reading.manganese,
          reading.phosphorus,
          reading.sulphur,
          reading.chrome,
          i + 1 // reading_sequence starts from 1
        ]
      );
    }
    
    return melting_process_id;
  });
  
  // Fetch complete data with spectro readings
  const completeData = await query(
    `SELECT mp.*, 
      json_agg(
        json_build_object(
          'id', msr.id,
          'carbon', msr.carbon,
          'silicon', msr.silicon,
          'manganese', msr.manganese,
          'phosphorus', msr.phosphorus,
          'sulphur', msr.sulphur,
          'chrome', msr.chrome,
          'reading_sequence', msr.reading_sequence
        ) ORDER BY msr.reading_sequence
      ) as spectro_readings
    FROM melting_processes mp
    LEFT JOIN melting_spectro_readings msr ON mp.id = msr.melting_process_id
    WHERE mp.id = $1
    GROUP BY mp.id`,
    [result]
  );
  
  res.status(201).json(apiResponse(true, completeData.rows[0], 'Melting process created successfully'));
}));

// ==========================================
// UPDATE MELTING PROCESS
// ==========================================

router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    melting_date,
    heat_no,
    scrap_weight,
    time_in,
    time_out,
    carbon,
    manganese,
    silicon,
    aluminium,
    calcium,
    temperature,
    spectro_readings
  } = req.body;
  
  // Check if process exists
  const existingProcess = await query(
    `SELECT * FROM melting_processes WHERE id = $1`,
    [id]
  );
  
  if (existingProcess.rows.length === 0) {
    return res.status(404).json(apiResponse(false, null, 'Melting process not found'));
  }
  
  // Validation
  try {
    validateRequired(req.body, ['melting_date', 'heat_no', 'scrap_weight', 'time_in', 'time_out']);
  } catch (error) {
    return res.status(400).json(apiResponse(false, null, error.message));
  }
  
  // Validate heat number
  if (heat_no < 1 || heat_no > 10) {
    return res.status(400).json(
      apiResponse(false, null, 'Heat number must be between 1 and 10')
    );
  }
  
  // Validate time format
  if (!validateTime(time_in) || !validateTime(time_out)) {
    return res.status(400).json(
      apiResponse(false, null, 'Invalid time format. Use HH:MM format')
    );
  }
  
  // Calculate scrap total
  let scrap_total;
  try {
    scrap_total = calculateScrapTotal(scrap_weight);
  } catch (error) {
    return res.status(400).json(apiResponse(false, null, error.message));
  }
  
  // Check MS Scrap stock availability (excluding current process consumption)
  const stockCheck = await query(`
    SELECT 
      COALESCE(SUM(sgi.quantity), 0) as total_received,
      COALESCE((SELECT SUM(scrap_total) FROM melting_processes WHERE id != $1), 0) as total_consumed,
      COALESCE(SUM(sgi.quantity), 0) - COALESCE((SELECT SUM(scrap_total) FROM melting_processes WHERE id != $1), 0) as current_stock
    FROM scrap_grn_items sgi
    JOIN items i ON sgi.item_id = i.id
    WHERE i.item_name = 'MS Scrap'
  `, [id]);
  
  const currentStock = parseFloat(stockCheck.rows[0].current_stock || 0);
  
  if (currentStock < scrap_total) {
    return res.status(400).json(
      apiResponse(false, null, `Insufficient MS Scrap stock. Available: ${currentStock.toFixed(3)} kg, Required: ${scrap_total.toFixed(3)} kg. Stock will be negative by ${(scrap_total - currentStock).toFixed(3)} kg.`)
    );
  }
  
  // Check mineral stock availability (excluding current process consumption)
  const minerals = [
    { name: 'CARBON', value: carbon, field: 'Carbon' },
    { name: 'MANGANESE', value: manganese, field: 'Manganese' },
    { name: 'SILICON', value: silicon, field: 'Silicon' },
    { name: 'ALUMINIUM', value: aluminium, field: 'Aluminium' },
    { name: 'CALCIUM', value: calcium, field: 'Calcium' }
  ];
  
  const insufficientItems = [];
  
  for (const mineral of minerals) {
    if (mineral.value && parseFloat(mineral.value) > 0) {
      const mineralStock = await query(`
        SELECT 
          COALESCE(SUM(sgi.quantity), 0) as total_received,
          COALESCE((SELECT SUM(${mineral.field.toLowerCase()}) FROM melting_processes WHERE id != $1), 0) as total_consumed,
          COALESCE(SUM(sgi.quantity), 0) - COALESCE((SELECT SUM(${mineral.field.toLowerCase()}) FROM melting_processes WHERE id != $1), 0) as current_stock
        FROM scrap_grn_items sgi
        JOIN items i ON sgi.item_id = i.id
        WHERE i.item_name = $2
      `, [id, mineral.name]);
      
      const availableStock = parseFloat(mineralStock.rows[0].current_stock || 0);
      const requiredQty = parseFloat(mineral.value);
      
      if (availableStock < requiredQty) {
        insufficientItems.push(
          `${mineral.field}: Available ${availableStock.toFixed(3)} kg, Required ${requiredQty.toFixed(3)} kg (Short by ${(requiredQty - availableStock).toFixed(3)} kg)`
        );
      }
    }
  }
  
  if (insufficientItems.length > 0) {
    return res.status(400).json(
      apiResponse(false, null, `Insufficient stock for the following items:\n${insufficientItems.join('\n')}`)
    );
  }
  
  // Validate spectro readings - check if it exists and is an array
  if (!spectro_readings) {
    return res.status(400).json(
      apiResponse(false, null, 'Spectro readings are required')
    );
  }
  
  if (!Array.isArray(spectro_readings)) {
    return res.status(400).json(
      apiResponse(false, null, 'Spectro readings must be an array')
    );
  }
  
  if (spectro_readings.length === 0) {
    return res.status(400).json(
      apiResponse(false, null, 'At least one spectro reading is required')
    );
  }
  
  // Check for duplicate melting_date + heat_no (excluding current record)
  const duplicateCheck = await query(
    `SELECT id FROM melting_processes WHERE melting_date = $1 AND heat_no = $2 AND id != $3`,
    [melting_date, heat_no, id]
  );
  
  if (duplicateCheck.rows.length > 0) {
    return res.status(400).json(
      apiResponse(false, null, `A melting process for Heat No. ${heat_no} on ${melting_date} already exists`)
    );
  }
  
  // Use transaction to update melting process and spectro readings
  const result = await transaction(async (client) => {
    // Update melting process
    await client.query(
      `UPDATE melting_processes SET
        melting_date = $1,
        heat_no = $2,
        scrap_weight = $3,
        scrap_total = $4,
        time_in = $5,
        time_out = $6,
        carbon = $7,
        manganese = $8,
        silicon = $9,
        aluminium = $10,
        calcium = $11,
        temperature = $12,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13`,
      [
        melting_date, heat_no, scrap_weight, scrap_total,
        time_in, time_out, carbon, manganese, silicon,
        aluminium, calcium, temperature, id
      ]
    );
    
    // Delete existing spectro readings
    await client.query(
      `DELETE FROM melting_spectro_readings WHERE melting_process_id = $1`,
      [id]
    );
    
    // Insert new spectro readings
    for (let i = 0; i < spectro_readings.length; i++) {
      const reading = spectro_readings[i];
      await client.query(
        `INSERT INTO melting_spectro_readings (
          melting_process_id, carbon, silicon, manganese,
          phosphorus, sulphur, chrome, reading_sequence
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          id,
          reading.carbon,
          reading.silicon,
          reading.manganese,
          reading.phosphorus,
          reading.sulphur,
          reading.chrome,
          i + 1
        ]
      );
    }
    
    return id;
  });
  
  // Fetch updated complete data
  const completeData = await query(
    `SELECT mp.*, 
      json_agg(
        json_build_object(
          'id', msr.id,
          'carbon', msr.carbon,
          'silicon', msr.silicon,
          'manganese', msr.manganese,
          'phosphorus', msr.phosphorus,
          'sulphur', msr.sulphur,
          'chrome', msr.chrome,
          'reading_sequence', msr.reading_sequence
        ) ORDER BY msr.reading_sequence
      ) as spectro_readings
    FROM melting_processes mp
    LEFT JOIN melting_spectro_readings msr ON mp.id = msr.melting_process_id
    WHERE mp.id = $1
    GROUP BY mp.id`,
    [result]
  );
  
  res.json(apiResponse(true, completeData.rows[0], 'Melting process updated successfully'));
}));

// ==========================================
// DELETE MELTING PROCESS
// ==========================================

router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Check if process exists
  const existingProcess = await query(
    `SELECT * FROM melting_processes WHERE id = $1`,
    [id]
  );
  
  if (existingProcess.rows.length === 0) {
    return res.status(404).json(apiResponse(false, null, 'Melting process not found'));
  }
  
  // Delete (spectro readings will be deleted automatically due to CASCADE)
  await query(`DELETE FROM melting_processes WHERE id = $1`, [id]);
  
  res.json(apiResponse(true, null, 'Melting process deleted successfully'));
}));

module.exports = router;

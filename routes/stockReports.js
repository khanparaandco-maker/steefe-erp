const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { apiResponse } = require('../utils/helpers');
const { authMiddleware, checkPermission } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/stock-reports/raw-material
 * @desc    Get raw material stock report
 * @access  Private
 */
router.get(
  '/raw-material',
  asyncHandler(async (req, res) => {
    const { category, item_name } = req.query;

    let queryText = `
      SELECT 
        i.id,
        i.item_name,
        c.category_name,
        u.uom_short_name as uom_name,
        COALESCE(grn.total_received, 0) as total_received,
        COALESCE(
          CASE 
            WHEN i.item_name = 'MS Scrap' THEN (SELECT COALESCE(SUM(scrap_total), 0) FROM melting_processes)
            WHEN i.item_name = 'CARBON' THEN (SELECT COALESCE(SUM(carbon), 0) FROM melting_processes)
            WHEN i.item_name = 'MANGANESE' THEN (SELECT COALESCE(SUM(manganese), 0) FROM melting_processes)
            WHEN i.item_name = 'SILICON' THEN (SELECT COALESCE(SUM(silicon), 0) FROM melting_processes)
            WHEN i.item_name = 'ALUMINIUM' THEN (SELECT COALESCE(SUM(aluminium), 0) FROM melting_processes)
            WHEN i.item_name = 'CALCIUM' THEN (SELECT COALESCE(SUM(calcium), 0) FROM melting_processes)
            ELSE 0
          END, 0
        ) as total_consumed,
        COALESCE(grn.total_received, 0) - COALESCE(
          CASE 
            WHEN i.item_name = 'MS Scrap' THEN (SELECT COALESCE(SUM(scrap_total), 0) FROM melting_processes)
            WHEN i.item_name = 'CARBON' THEN (SELECT COALESCE(SUM(carbon), 0) FROM melting_processes)
            WHEN i.item_name = 'MANGANESE' THEN (SELECT COALESCE(SUM(manganese), 0) FROM melting_processes)
            WHEN i.item_name = 'SILICON' THEN (SELECT COALESCE(SUM(silicon), 0) FROM melting_processes)
            WHEN i.item_name = 'ALUMINIUM' THEN (SELECT COALESCE(SUM(aluminium), 0) FROM melting_processes)
            WHEN i.item_name = 'CALCIUM' THEN (SELECT COALESCE(SUM(calcium), 0) FROM melting_processes)
            ELSE 0
          END, 0
        ) as current_stock
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN uom u ON i.uom_id = u.id
      LEFT JOIN (
        SELECT item_id, SUM(quantity) as total_received
        FROM scrap_grn_items
        GROUP BY item_id
      ) grn ON i.id = grn.item_id
      WHERE c.category_name IN ('Raw Material', 'Minerals')
    `;

    const params = [];
    let paramCounter = 1;

    if (category) {
      queryText += ` AND c.category_name = $${paramCounter}`;
      params.push(category);
      paramCounter++;
    }

    if (item_name) {
      queryText += ` AND i.item_name ILIKE $${paramCounter}`;
      params.push(`%${item_name}%`);
      paramCounter++;
    }

    queryText += ` ORDER BY i.item_name`;

    const result = await query(queryText, params);
    res.json(apiResponse(true, result.rows));
  })
);

/**
 * @route   GET /api/stock-reports/consumption
 * @desc    Get material consumption report
 * @access  Private
 */
router.get(
  '/consumption',
  asyncHandler(async (req, res) => {
    const { from_date, to_date, heat_no } = req.query;

    let queryText = `
      SELECT 
        mp.melting_date,
        mp.heat_no,
        'MS Scrap' as item_name,
        'MS Scrap' as category_name,
        mp.scrap_total as total_weight,
        'Melting - MS Scrap' as process_type
      FROM melting_processes mp
      WHERE 1=1
    `;

    const params = [];
    let paramCounter = 1;

    if (from_date) {
      queryText += ` AND mp.melting_date >= $${paramCounter}`;
      params.push(from_date);
      paramCounter++;
    }

    if (to_date) {
      queryText += ` AND mp.melting_date <= $${paramCounter}`;
      params.push(to_date);
      paramCounter++;
    }

    if (heat_no) {
      queryText += ` AND mp.heat_no = $${paramCounter}`;
      params.push(heat_no);
      paramCounter++;
    }

    queryText += ` ORDER BY mp.melting_date DESC, mp.heat_no`;

    const result = await query(queryText, params);
    res.json(apiResponse(true, result.rows));
  })
);

/**
 * @route   GET /api/stock-reports/wip
 * @desc    Get WIP stock report
 * @access  Private
 */
router.get(
  '/wip',
  asyncHandler(async (req, res) => {
    const { from_date, to_date } = req.query;

    let queryText = `
      SELECT 
        mp.id,
        mp.melting_date,
        mp.heat_no,
        mp.scrap_total,
        COALESCE(SUM(ht.bags_produced * 25), 0) as used_in_heat_treatment,
        mp.scrap_total - COALESCE(SUM(ht.bags_produced * 25), 0) as wip_stock
      FROM melting_processes mp
      LEFT JOIN heat_treatment ht ON DATE(mp.melting_date) = DATE(ht.treatment_date)
      WHERE 1=1
    `;

    const params = [];
    let paramCounter = 1;

    if (from_date) {
      queryText += ` AND mp.melting_date >= $${paramCounter}`;
      params.push(from_date);
      paramCounter++;
    }

    if (to_date) {
      queryText += ` AND mp.melting_date <= $${paramCounter}`;
      params.push(to_date);
      paramCounter++;
    }

    queryText += `
      GROUP BY mp.id, mp.melting_date, mp.heat_no, mp.scrap_total
      ORDER BY mp.melting_date DESC
    `;

    const result = await query(queryText, params);
    res.json(apiResponse(true, result.rows));
  })
);

/**
 * @route   GET /api/stock-reports/production
 * @desc    Get production report
 * @access  Private
 */
router.get(
  '/production',
  asyncHandler(async (req, res) => {
    const { from_date, to_date, furnace_no } = req.query;

    let queryText = `
      SELECT 
        ht.id,
        ht.treatment_date,
        ht.furnace_no,
        i.item_name as size_name,
        ht.temperature,
        ht.bags_produced
      FROM heat_treatment ht
      JOIN items i ON ht.size_item_id = i.id
      WHERE 1=1
    `;

    const params = [];
    let paramCounter = 1;

    if (from_date) {
      queryText += ` AND ht.treatment_date >= $${paramCounter}`;
      params.push(from_date);
      paramCounter++;
    }

    if (to_date) {
      queryText += ` AND ht.treatment_date <= $${paramCounter}`;
      params.push(to_date);
      paramCounter++;
    }

    if (furnace_no) {
      queryText += ` AND ht.furnace_no = $${paramCounter}`;
      params.push(furnace_no);
      paramCounter++;
    }

    queryText += ` ORDER BY ht.treatment_date DESC`;

    const result = await query(queryText, params);
    res.json(apiResponse(true, result.rows));
  })
);

/**
 * @route   GET /api/stock-reports/finished-goods
 * @desc    Get finished goods stock report
 * @access  Private
 */
router.get(
  '/finished-goods',
  asyncHandler(async (req, res) => {
    const { item_name } = req.query;

    let queryText = `
      SELECT 
        i.id,
        i.item_name,
        COALESCE(SUM(ht.bags_produced), 0) as total_produced,
        COALESCE(dispatched.bags, 0) as total_dispatched,
        COALESCE(SUM(ht.bags_produced), 0) - COALESCE(dispatched.bags, 0) as current_stock_bags,
        (COALESCE(SUM(ht.bags_produced), 0) - COALESCE(dispatched.bags, 0)) * 25 as current_stock_kg
      FROM items i
      JOIN categories c ON i.category_id = c.id
      LEFT JOIN heat_treatment ht ON i.id = ht.size_item_id
      LEFT JOIN (
        SELECT oi.item_id, SUM(di.quantity_dispatched / 25.0) as bags
        FROM dispatch_items di
        JOIN order_items oi ON di.order_item_id = oi.id
        GROUP BY oi.item_id
      ) dispatched ON i.id = dispatched.item_id
      WHERE c.category_name = 'Finished Product'
    `;

    const params = [];
    let paramCounter = 1;

    if (item_name) {
      queryText += ` AND i.item_name ILIKE $${paramCounter}`;
      params.push(`%${item_name}%`);
      paramCounter++;
    }

    queryText += `
      GROUP BY i.id, i.item_name, dispatched.bags
      ORDER BY i.item_name
    `;

    const result = await query(queryText, params);
    res.json(apiResponse(true, result.rows));
  })
);

/**
 * @route   GET /api/stock-reports/movement
 * @desc    Get stock movement report
 * @access  Private
 */
router.get(
  '/movement',
  asyncHandler(async (req, res) => {
    const { from_date, to_date, item_name, movement_type } = req.query;

    let queryText = `
      WITH stock_movements AS (
        -- GRN (Inward)
        SELECT 
          sg.invoice_date as movement_date,
          'GRN' as movement_type,
          i.item_name,
          c.category_name,
          sgi.quantity as in_qty,
          NULL::numeric as out_qty,
          0 as balance,
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
          'MS Scrap' as item_name,
          'MS Scrap' as category_name,
          NULL::numeric as in_qty,
          mp.scrap_total as out_qty,
          0 as balance,
          'MP-' || mp.id || '-H' || mp.heat_no as reference
        FROM melting_processes mp
        
        UNION ALL
        
        -- Heat Treatment (Inward - Production)
        SELECT 
          ht.treatment_date as movement_date,
          'Heat Treatment' as movement_type,
          i.item_name,
          c.category_name,
          ht.bags_produced * 25 as in_qty,
          NULL::numeric as out_qty,
          0 as balance,
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
          NULL::numeric as in_qty,
          di.quantity_dispatched as out_qty,
          0 as balance,
          'DISP-' || d.id as reference
        FROM dispatches d
        JOIN dispatch_items di ON d.id = di.dispatch_id
        JOIN order_items oi ON di.order_item_id = oi.id
        JOIN items i ON oi.item_id = i.id
        JOIN categories c ON i.category_id = c.id
      )
      SELECT * FROM stock_movements
      WHERE 1=1
    `;

    const params = [];
    let paramCounter = 1;

    if (from_date) {
      queryText += ` AND movement_date >= $${paramCounter}`;
      params.push(from_date);
      paramCounter++;
    }

    if (to_date) {
      queryText += ` AND movement_date <= $${paramCounter}`;
      params.push(to_date);
      paramCounter++;
    }

    if (item_name) {
      queryText += ` AND item_name ILIKE $${paramCounter}`;
      params.push(`%${item_name}%`);
      paramCounter++;
    }

    if (movement_type) {
      queryText += ` AND movement_type = $${paramCounter}`;
      params.push(movement_type);
      paramCounter++;
    }

    queryText += ` ORDER BY movement_date DESC, movement_type`;

    const result = await query(queryText, params);
    res.json(apiResponse(true, result.rows));
  })
);

/**
 * @route   GET /api/stock-reports/stock-statement
 * @desc    Get Stock Statement Report with FIFO valuation
 * @access  Private
 */
router.get(
  '/stock-statement',
  checkPermission('Stock Movement', 'view'),
  asyncHandler(async (req, res) => {
    const { startDate, endDate, categoryId } = req.query;

    // Validation
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    // Check if end date is after start date
    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({
        success: false,
        error: 'End date must be after or equal to start date'
      });
    }

    // Call the stock statement function
    const result = await query(
      `SELECT * FROM get_stock_statement_report($1, $2, $3)
       ORDER BY category_name, item_name`,
      [startDate, endDate, categoryId || null]
    );

    // Calculate totals
    const totals = result.rows.reduce((acc, row) => {
      return {
        opening_qty: acc.opening_qty + parseFloat(row.opening_qty || 0),
        opening_amount: acc.opening_amount + parseFloat(row.opening_amount || 0),
        receipt_qty: acc.receipt_qty + parseFloat(row.receipt_qty || 0),
        receipt_amount: acc.receipt_amount + parseFloat(row.receipt_amount || 0),
        issue_qty: acc.issue_qty + parseFloat(row.issue_qty || 0),
        issue_amount: acc.issue_amount + parseFloat(row.issue_amount || 0),
        closing_qty: acc.closing_qty + parseFloat(row.closing_qty || 0),
        closing_amount: acc.closing_amount + parseFloat(row.closing_amount || 0)
      };
    }, {
      opening_qty: 0,
      opening_amount: 0,
      receipt_qty: 0,
      receipt_amount: 0,
      issue_qty: 0,
      issue_amount: 0,
      closing_qty: 0,
      closing_amount: 0
    });

    res.json({
      success: true,
      data: {
        items: result.rows,
        totals: {
          ...totals,
          opening_rate: totals.opening_qty > 0 ? (totals.opening_amount / totals.opening_qty).toFixed(2) : '0.00',
          receipt_rate: totals.receipt_qty > 0 ? (totals.receipt_amount / totals.receipt_qty).toFixed(2) : '0.00',
          issue_rate: totals.issue_qty > 0 ? (totals.issue_amount / totals.issue_qty).toFixed(2) : '0.00',
          closing_rate: totals.closing_qty > 0 ? (totals.closing_amount / totals.closing_qty).toFixed(2) : '0.00'
        },
        filters: {
          startDate,
          endDate,
          categoryId: categoryId || 'All Categories'
        }
      }
    });
  })
);

/**
 * @route   POST /api/stock-reports/stock-transactions
 * @desc    Create a stock transaction (for manual adjustments, opening stock, etc.)
 * @access  Private
 */
router.post(
  '/stock-transactions',
  checkPermission('Stock Movement', 'edit'),
  asyncHandler(async (req, res) => {
    const {
      transactionDate,
      transactionType,
      itemId,
      quantity,
      rate,
      referenceType,
      referenceId,
      remarks
    } = req.body;

    // Validation
    if (!transactionDate || !transactionType || !itemId || !quantity || !rate) {
      return res.status(400).json({
        success: false,
        error: 'Transaction date, type, item, quantity, and rate are required'
      });
    }

    // Validate transaction type
    const validTypes = ['OPENING', 'RECEIPT', 'ISSUE'];
    if (!validTypes.includes(transactionType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid transaction type. Must be OPENING, RECEIPT, or ISSUE'
      });
    }

    // Validate quantity and rate are positive
    if (quantity <= 0 || rate <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantity and rate must be positive numbers'
      });
    }

    // Calculate amount
    const amount = parseFloat(quantity) * parseFloat(rate);

    // Insert transaction
    const result = await query(
      `INSERT INTO stock_transactions 
       (transaction_date, transaction_type, item_id, quantity, rate, amount, reference_type, reference_id, remarks)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [transactionDate, transactionType, itemId, quantity, rate, amount, referenceType || null, referenceId || null, remarks || null]
    );

    res.status(201).json({
      success: true,
      message: 'Stock transaction created successfully',
      data: result.rows[0]
    });
  })
);

/**
 * @route   GET /api/stock-reports/stock-transactions
 * @desc    Get all stock transactions with filters
 * @access  Private
 */
router.get(
  '/stock-transactions',
  checkPermission('Stock Movement', 'view'),
  asyncHandler(async (req, res) => {
    const { itemId, startDate, endDate, transactionType } = req.query;

    let queryText = `
      SELECT 
        st.*,
        i.item_name,
        c.category_name,
        u.uom_short_name as uom_name
      FROM stock_transactions st
      LEFT JOIN items i ON st.item_id = i.id
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN uom u ON i.uom_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (itemId) {
      queryText += ` AND st.item_id = $${paramCount}`;
      params.push(itemId);
      paramCount++;
    }

    if (startDate) {
      queryText += ` AND st.transaction_date >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      queryText += ` AND st.transaction_date <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    if (transactionType) {
      queryText += ` AND st.transaction_type = $${paramCount}`;
      params.push(transactionType);
      paramCount++;
    }

    queryText += ` ORDER BY st.transaction_date DESC, st.id DESC`;

    const result = await query(queryText, params);

    res.json({
      success: true,
      data: result.rows
    });
  })
);

/**
 * @route   DELETE /api/stock-reports/stock-transactions/:id
 * @desc    Delete a stock transaction
 * @access  Private
 */
router.delete(
  '/stock-transactions/:id',
  checkPermission('Stock Movement', 'delete'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM stock_transactions WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Stock transaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Stock transaction deleted successfully'
    });
  })
);

module.exports = router;

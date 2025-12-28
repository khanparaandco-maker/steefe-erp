const express = require('express');
const router = express.Router();
const { query, transaction, crud } = require('../config/database');
const { apiResponse, asyncHandler, validateRequired } = require('../utils/helpers');

// Get all dispatches
router.get('/', asyncHandler(async (req, res) => {
  const { order_id, from_date, to_date } = req.query;
  
  let queryText = `
    SELECT 
      d.id,
      d.order_id,
      o.order_no,
      o.customer_id,
      c.customer_name,
      d.dispatch_date,
      d.transporter_id,
      t.transporter_name,
      d.lr_no,
      d.lr_date,
      d.invoice_no,
      d.invoice_date,
      d.upload_path,
      COUNT(DISTINCT di.id) as total_items,
      SUM(di.quantity_dispatched) as total_quantity,
      d.created_at,
      d.updated_at
    FROM dispatches d
    JOIN orders o ON d.order_id = o.id
    JOIN customers c ON o.customer_id = c.id
    LEFT JOIN transporters t ON d.transporter_id = t.id
    LEFT JOIN dispatch_items di ON d.id = di.dispatch_id
    WHERE 1=1
  `;
  
  const params = [];
  let paramIndex = 1;
  
  if (order_id) {
    queryText += ` AND d.order_id = $${paramIndex}`;
    params.push(order_id);
    paramIndex++;
  }
  
  if (from_date) {
    queryText += ` AND d.dispatch_date >= $${paramIndex}`;
    params.push(from_date);
    paramIndex++;
  }
  
  if (to_date) {
    queryText += ` AND d.dispatch_date <= $${paramIndex}`;
    params.push(to_date);
    paramIndex++;
  }
  
  queryText += `
    GROUP BY d.id, d.order_id, o.order_no, o.customer_id, c.customer_name, d.dispatch_date, 
             d.transporter_id, t.transporter_name, d.lr_no, d.lr_date, d.invoice_no, d.invoice_date, 
             d.upload_path, d.created_at, d.updated_at
    ORDER BY d.dispatch_date DESC, d.id DESC
  `;
  
  const result = await query(queryText, params);
  res.json(apiResponse(true, result.rows));
}));

// Get dispatch by ID with items
router.get('/:id', asyncHandler(async (req, res) => {
  // Get dispatch header
  const dispatchResult = await query(
    `SELECT 
      d.*,
      o.order_no,
      o.customer_id,
      c.customer_name,
      t.transporter_name
    FROM dispatches d
    JOIN orders o ON d.order_id = o.id
    JOIN customers c ON o.customer_id = c.id
    LEFT JOIN transporters t ON d.transporter_id = t.id
    WHERE d.id = $1`,
    [req.params.id]
  );
  
  if (dispatchResult.rows.length === 0) {
    return res.status(404).json(apiResponse(false, null, 'Dispatch not found'));
  }
  
  const dispatch = dispatchResult.rows[0];
  
  // Get dispatch items
  const itemsResult = await query(
    `SELECT 
      di.*,
      oi.item_id,
      i.item_name,
      i.alias as item_alias,
      u.uom_short_name as uom,
      oi.quantity as ordered_quantity,
      oi.rate,
      oi.bag_count as ordered_bag_count
    FROM dispatch_items di
    JOIN order_items oi ON di.order_item_id = oi.id
    JOIN items i ON oi.item_id = i.id
    JOIN uom u ON i.uom_id = u.id
    WHERE di.dispatch_id = $1
    ORDER BY di.id`,
    [req.params.id]
  );
  
  dispatch.items = itemsResult.rows;
  
  res.json(apiResponse(true, dispatch));
}));

// Create new dispatch
router.post('/', asyncHandler(async (req, res) => {
  const { order_id, dispatch_date, transporter_id, lr_no, lr_date, invoice_no, invoice_date, upload_path, items } = req.body;
  
  validateRequired(req.body, ['order_id', 'dispatch_date', 'items']);
  
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json(apiResponse(false, null, 'Dispatch must have at least one item'));
  }
  
  // Validate each item
  for (const item of items) {
    validateRequired(item, ['order_item_id', 'quantity_dispatched']);
    if (item.quantity_dispatched <= 0) {
      return res.status(400).json(apiResponse(false, null, 'Dispatch quantity must be greater than 0'));
    }
  }
  
  const result = await transaction(async (client) => {
    // Verify order exists
    const orderResult = await client.query(
      'SELECT id FROM orders WHERE id = $1',
      [order_id]
    );
    
    if (orderResult.rows.length === 0) {
      throw new Error('Order not found');
    }
    
    // Verify transporter exists if provided
    if (transporter_id) {
      const transporterResult = await client.query(
        'SELECT id FROM transporters WHERE id = $1',
        [transporter_id]
      );
      
      if (transporterResult.rows.length === 0) {
        throw new Error('Transporter not found');
      }
    }
    
    // Validate dispatch quantities against balance
    for (const item of items) {
      const balanceResult = await client.query(
        `SELECT 
          oi.quantity as ordered_quantity,
          COALESCE(SUM(di.quantity_dispatched), 0) as dispatched_quantity,
          (oi.quantity - COALESCE(SUM(di.quantity_dispatched), 0)) as balance_quantity
         FROM order_items oi
         LEFT JOIN dispatch_items di ON oi.id = di.order_item_id
         WHERE oi.id = $1
         GROUP BY oi.id, oi.quantity`,
        [item.order_item_id]
      );
      
      if (balanceResult.rows.length === 0) {
        throw new Error(`Order item with id ${item.order_item_id} not found`);
      }
      
      const balance = parseFloat(balanceResult.rows[0].balance_quantity);
      const dispatchQty = parseFloat(item.quantity_dispatched);
      
      if (dispatchQty > balance) {
        throw new Error(
          `Dispatch quantity ${dispatchQty} exceeds balance quantity ${balance} for order item ${item.order_item_id}`
        );
      }
    }
    
    // Create dispatch
    const dispatchResult = await client.query(
      `INSERT INTO dispatches (order_id, dispatch_date, transporter_id, lr_no, lr_date, invoice_no, invoice_date, upload_path)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [order_id, dispatch_date, transporter_id, lr_no, lr_date, invoice_no, invoice_date, upload_path]
    );
    
    const dispatch = dispatchResult.rows[0];
    
    // Create dispatch items
    const dispatchItems = [];
    
    for (const item of items) {
      const dispatchItemResult = await client.query(
        `INSERT INTO dispatch_items (dispatch_id, order_item_id, quantity_dispatched)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [dispatch.id, item.order_item_id, item.quantity_dispatched]
      );
      
      dispatchItems.push(dispatchItemResult.rows[0]);
    }
    
    // Order status will be auto-updated by the trigger
    
    return { dispatch, items: dispatchItems };
  });
  
  res.status(201).json(apiResponse(true, result, 'Dispatch created successfully'));
}));

// Update dispatch (header and items)
router.put('/:id', asyncHandler(async (req, res) => {
  const { dispatch_date, transporter_id, lr_no, lr_date, invoice_no, invoice_date, upload_path, items } = req.body;
  
  const existing = await crud.findById('dispatches', req.params.id);
  if (!existing) {
    return res.status(404).json(apiResponse(false, null, 'Dispatch not found'));
  }
  
  // Verify transporter exists if provided
  if (transporter_id) {
    const transporter = await crud.findById('transporters', transporter_id);
    if (!transporter) {
      return res.status(400).json(apiResponse(false, null, 'Invalid transporter_id'));
    }
  }

  const result = await transaction(async (client) => {
    // Update dispatch header
    const updateData = {};
    if (dispatch_date !== undefined) updateData.dispatch_date = dispatch_date;
    if (transporter_id !== undefined) updateData.transporter_id = transporter_id;
    if (lr_no !== undefined) updateData.lr_no = lr_no;
    if (lr_date !== undefined) updateData.lr_date = lr_date;
    if (invoice_no !== undefined) updateData.invoice_no = invoice_no;
    if (invoice_date !== undefined) updateData.invoice_date = invoice_date;
    if (upload_path !== undefined) updateData.upload_path = upload_path;
    
    const keys = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
    
    const dispatchResult = await client.query(
      `UPDATE dispatches SET ${setClause} WHERE id = $1 RETURNING *`,
      [req.params.id, ...values]
    );
    
    const dispatch = dispatchResult.rows[0];
    
    // Update dispatch items if provided
    if (items && Array.isArray(items) && items.length > 0) {
      // Validate dispatch quantities (excluding current dispatch from balance calculation)
      for (const item of items) {
        const balanceResult = await client.query(
          `SELECT 
            oi.quantity as ordered_quantity,
            COALESCE(SUM(di.quantity_dispatched), 0) as other_dispatches,
            (oi.quantity - COALESCE(SUM(di.quantity_dispatched), 0)) as available_quantity
           FROM order_items oi
           LEFT JOIN dispatch_items di ON oi.id = di.order_item_id 
             AND di.dispatch_id != $2
           WHERE oi.id = $1
           GROUP BY oi.id, oi.quantity`,
          [item.order_item_id, req.params.id]
        );
        
        if (balanceResult.rows.length === 0) {
          throw new Error(`Order item with id ${item.order_item_id} not found`);
        }
        
        const available = parseFloat(balanceResult.rows[0].available_quantity);
        const dispatchQty = parseFloat(item.quantity_dispatched);
        
        if (dispatchQty > available) {
          throw new Error(
            `Dispatch quantity ${dispatchQty} exceeds available quantity ${available} for order item ${item.order_item_id}`
          );
        }
      }
      
      // Delete existing dispatch items
      await client.query('DELETE FROM dispatch_items WHERE dispatch_id = $1', [req.params.id]);
      
      // Insert updated dispatch items
      const dispatchItems = [];
      for (const item of items) {
        const result = await client.query(
          `INSERT INTO dispatch_items (dispatch_id, order_item_id, quantity_dispatched)
           VALUES ($1, $2, $3)
           RETURNING *`,
          [req.params.id, item.order_item_id, item.quantity_dispatched]
        );
        dispatchItems.push(result.rows[0]);
      }
      
      return { dispatch, items: dispatchItems };
    }
    
    return { dispatch };
  });
  
  res.json(apiResponse(true, result, 'Dispatch updated successfully'));
}));

// Delete dispatch (cascade deletes items, triggers order status update)
router.delete('/:id', asyncHandler(async (req, res) => {
  const dispatch = await crud.delete('dispatches', req.params.id);
  
  if (!dispatch) {
    return res.status(404).json(apiResponse(false, null, 'Dispatch not found'));
  }
  
  res.json(apiResponse(true, null, 'Dispatch deleted successfully'));
}));

// Get dispatch history for an order
router.get('/order/:order_id/history', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT 
      d.id,
      d.dispatch_date,
      d.transporter_id,
      t.name as transporter_name,
      d.lr_no,
      d.invoice_no,
      COUNT(DISTINCT di.id) as items_count,
      SUM(di.quantity_dispatched) as total_quantity
    FROM dispatches d
    LEFT JOIN transporters t ON d.transporter_id = t.id
    LEFT JOIN dispatch_items di ON d.id = di.dispatch_id
    WHERE d.order_id = $1
    GROUP BY d.id, d.dispatch_date, d.transporter_id, t.name, d.lr_no, d.invoice_no
    ORDER BY d.dispatch_date DESC, d.id DESC`,
    [req.params.order_id]
  );
  
  res.json(apiResponse(true, result.rows));
}));

module.exports = router;

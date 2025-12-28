const express = require('express');
const router = express.Router();
const { query, transaction, crud } = require('../config/database');
const { apiResponse, asyncHandler, validateRequired, calculateGST, calculateBagCount } = require('../utils/helpers');

// Get all orders with summary
router.get('/', asyncHandler(async (req, res) => {
  const { status, customer_id, from_date, to_date } = req.query;
  
  let queryText = `
    SELECT 
      o.id,
      o.order_no,
      o.customer_id,
      c.customer_name,
      c.state as customer_state,
      o.order_date,
      o.po_no,
      o.estimated_delivery_date,
      o.status,
      COUNT(DISTINCT oi.id) as total_items,
      SUM(oi.total_amount) as order_total,
      o.created_at,
      o.updated_at
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE 1=1
  `;
  
  const params = [];
  let paramIndex = 1;
  
  if (status) {
    queryText += ` AND o.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }
  
  if (customer_id) {
    queryText += ` AND o.customer_id = $${paramIndex}`;
    params.push(customer_id);
    paramIndex++;
  }
  
  if (from_date) {
    queryText += ` AND o.order_date >= $${paramIndex}`;
    params.push(from_date);
    paramIndex++;
  }
  
  if (to_date) {
    queryText += ` AND o.order_date <= $${paramIndex}`;
    params.push(to_date);
    paramIndex++;
  }
  
  queryText += `
    GROUP BY o.id, o.order_no, o.customer_id, c.customer_name, c.state, o.order_date, o.po_no, o.estimated_delivery_date, o.status, o.created_at, o.updated_at
    ORDER BY o.order_date DESC, o.id DESC
  `;
  
  const result = await query(queryText, params);
  res.json(apiResponse(true, result.rows));
}));

// Get pending orders (orders with items that have balance > 0)
router.get('/status/pending', asyncHandler(async (req, res) => {
  const queryText = `
    SELECT DISTINCT
      o.id,
      o.order_no,
      o.customer_id,
      c.customer_name,
      c.state as customer_state,
      o.order_date,
      o.po_no,
      o.estimated_delivery_date,
      o.status,
      o.created_at,
      o.updated_at
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    JOIN order_items oi ON o.id = oi.order_id
    JOIN order_items_balance oib ON oi.id = oib.order_item_id
    WHERE oib.balance_quantity > 0
    ORDER BY o.order_date DESC, o.id DESC
  `;
  
  const result = await query(queryText, []);
  res.json(apiResponse(true, result.rows));
}));

// Get order by ID with items
router.get('/:id', asyncHandler(async (req, res) => {
  // Get order header
  const orderResult = await query(
    `SELECT 
      o.*,
      c.customer_name,
      c.state as customer_state,
      c.address_line1,
      c.address_line2,
      c.city,
      c.gstn as customer_gstn,
      c.mobile_no as customer_mobile
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    WHERE o.id = $1`,
    [req.params.id]
  );
  
  if (orderResult.rows.length === 0) {
    return res.status(404).json(apiResponse(false, null, 'Order not found'));
  }
  
  const order = orderResult.rows[0];
  
  // Get order items with balance
  const itemsResult = await query(
    `SELECT 
      oi.*,
      i.item_name,
      i.alias as item_alias,
      u.uom_short_name as uom,
      oib.dispatched_quantity,
      oib.balance_quantity
    FROM order_items oi
    JOIN items i ON oi.item_id = i.id
    JOIN uom u ON i.uom_id = u.id
    LEFT JOIN order_items_balance oib ON oi.id = oib.order_item_id
    WHERE oi.order_id = $1
    ORDER BY oi.id`,
    [req.params.id]
  );
  
  order.items = itemsResult.rows;
  
  res.json(apiResponse(true, order));
}));

// Create new order with items
router.post('/', asyncHandler(async (req, res) => {
  const { customer_id, order_date, po_no, estimated_delivery_date, preferred_transporter_id, payment_condition, items } = req.body;
  
  validateRequired(req.body, ['customer_id', 'order_date', 'items']);
  
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json(apiResponse(false, null, 'Order must have at least one item'));
  }
  
  // Validate each item
  for (const item of items) {
    validateRequired(item, ['item_id', 'quantity', 'rate']);
    if (item.quantity <= 0) {
      return res.status(400).json(apiResponse(false, null, 'Item quantity must be greater than 0'));
    }
    if (item.rate < 0) {
      return res.status(400).json(apiResponse(false, null, 'Item rate cannot be negative'));
    }
  }
  
  const result = await transaction(async (client) => {
    // Get customer details for GST calculation
    const customerResult = await client.query(
      'SELECT state FROM customers WHERE id = $1',
      [customer_id]
    );
    
    if (customerResult.rows.length === 0) {
      throw new Error('Customer not found');
    }
    
    const customerState = customerResult.rows[0].state;
    
    // Generate order number
    const orderNoResult = await client.query('SELECT generate_order_no() as order_no');
    const order_no = orderNoResult.rows[0].order_no;
    
    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (order_no, customer_id, order_date, po_no, estimated_delivery_date, preferred_transporter_id, payment_condition, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending')
       RETURNING *`,
      [order_no, customer_id, order_date, po_no, estimated_delivery_date, preferred_transporter_id, payment_condition]
    );
    
    const order = orderResult.rows[0];
    
    // Create order items
    const orderItems = [];
    
    for (const item of items) {
      // Get item GST rate
      const itemResult = await client.query(
        `SELECT i.*, g.gst_rate
         FROM items i
         JOIN gst_rates g ON i.gst_rate_id = g.id
         WHERE i.id = $1`,
        [item.item_id]
      );
      
      if (itemResult.rows.length === 0) {
        throw new Error(`Item with id ${item.item_id} not found`);
      }
      
      const itemData = itemResult.rows[0];
      const gstRate = itemData.gst_rate;
      
      // Calculate amounts
      const quantity = parseFloat(item.quantity);
      const rate = parseFloat(item.rate);
      const amount = parseFloat((quantity * rate).toFixed(2));
      const bag_count = calculateBagCount(quantity);
      
      // Calculate GST
      const gst = calculateGST(customerState, amount, gstRate);
      const total_amount = parseFloat((amount + gst.cgst + gst.sgst + gst.igst).toFixed(2));
      
      // Insert order item
      const orderItemResult = await client.query(
        `INSERT INTO order_items (order_id, item_id, quantity, bag_count, rate, amount, cgst, sgst, igst, total_amount)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [order.id, item.item_id, quantity, bag_count, rate, amount, gst.cgst, gst.sgst, gst.igst, total_amount]
      );
      
      orderItems.push(orderItemResult.rows[0]);
    }
    
    return { order, items: orderItems };
  });
  
  res.status(201).json(apiResponse(true, result, 'Order created successfully'));
}));

// Update order header (not items)
router.put('/:id', asyncHandler(async (req, res) => {
  const { customer_id, order_date, po_no, estimated_delivery_date, preferred_transporter_id, payment_condition, items } = req.body;
  
  const existing = await crud.findById('orders', req.params.id);
  if (!existing) {
    return res.status(404).json(apiResponse(false, null, 'Order not found'));
  }
  
  // Verify customer exists if provided
  if (customer_id) {
    const customer = await crud.findById('customers', customer_id);
    if (!customer) {
      return res.status(400).json(apiResponse(false, null, 'Invalid customer_id'));
    }
  }
  
  // Use transaction to update order and items
  await transaction(async (client) => {
    // Update order header
    const updateData = {};
    if (customer_id !== undefined) updateData.customer_id = customer_id;
    if (order_date !== undefined) updateData.order_date = order_date;
    if (po_no !== undefined) updateData.po_no = po_no;
    if (estimated_delivery_date !== undefined) updateData.estimated_delivery_date = estimated_delivery_date;
    if (preferred_transporter_id !== undefined) updateData.preferred_transporter_id = preferred_transporter_id;
    if (payment_condition !== undefined) updateData.payment_condition = payment_condition;
    
    if (Object.keys(updateData).length > 0) {
      const keys = Object.keys(updateData);
      const values = Object.values(updateData);
      const setClause = keys.map((key, idx) => `${key} = $${idx + 1}`).join(', ');
      await client.query(
        `UPDATE orders SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${keys.length + 1}`,
        [...values, req.params.id]
      );
    }
    
    // If items are provided, update them
    if (items && Array.isArray(items)) {
      // Get existing order items to check for dispatched quantities
      const existingItemsResult = await client.query(
        `SELECT oi.id, oib.dispatched_quantity 
         FROM order_items oi
         LEFT JOIN order_items_balance oib ON oi.id = oib.order_item_id
         WHERE oi.order_id = $1`,
        [req.params.id]
      );
      
      const existingItems = existingItemsResult.rows;
      const existingItemIds = existingItems.map(item => item.id);
      const updatedItemIds = items.filter(item => item.id).map(item => item.id);
      
      // Delete items that are not in the updated list (only if not dispatched)
      const itemsToDelete = existingItemIds.filter(id => !updatedItemIds.includes(id));
      for (const itemId of itemsToDelete) {
        const existingItem = existingItems.find(item => item.id === itemId);
        if (existingItem.dispatched_quantity > 0) {
          throw new Error('Cannot delete items that have been dispatched');
        }
        await client.query('DELETE FROM order_items WHERE id = $1', [itemId]);
      }
      
      // Get customer state for GST calculation
      const customerResult = await client.query('SELECT state FROM customers WHERE id = $1', [customer_id || existing.customer_id]);
      const customerState = customerResult.rows[0].state;
      
      // Update or insert items
      for (const item of items) {
        const { item_id, quantity, bag_count, rate } = item;
        
        // Get item GST rate
        const itemResult = await client.query('SELECT gst_rate_id FROM items WHERE id = $1', [item_id]);
        const gstRateResult = await client.query('SELECT gst_rate FROM gst_rates WHERE id = $1', [itemResult.rows[0].gst_rate_id]);
        const gstRate = gstRateResult.rows[0].gst_rate;
        
        const amount = parseFloat((quantity * rate).toFixed(2));
        const gst = calculateGST(customerState, amount, gstRate);
        const total_amount = parseFloat((amount + gst.cgst + gst.sgst + gst.igst).toFixed(2));
        
        if (item.id) {
          // Update existing item
          await client.query(
            `UPDATE order_items 
             SET item_id = $1, quantity = $2, bag_count = $3, rate = $4, amount = $5,
                 cgst = $6, sgst = $7, igst = $8, total_amount = $9, updated_at = CURRENT_TIMESTAMP
             WHERE id = $10`,
            [item_id, quantity, bag_count, rate, amount, gst.cgst, gst.sgst, gst.igst, total_amount, item.id]
          );
          // Balance view will automatically update when order_items changes
        } else {
          // Insert new item
          const itemInsertResult = await client.query(
            `INSERT INTO order_items 
             (order_id, item_id, quantity, bag_count, rate, amount, cgst, sgst, igst, total_amount)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING id`,
            [req.params.id, item_id, quantity, bag_count, rate, amount, gst.cgst, gst.sgst, gst.igst, total_amount]
          );
          // Balance view will automatically calculate from order_items
        }
      }
    }
  });
  
  // Fetch updated order
  const orderResult = await query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
  
  res.json(apiResponse(true, orderResult.rows[0], 'Order updated successfully'));
}));

// Get pending orders (for dispatch selection)
router.get('/status/pending', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT 
      o.id,
      o.order_no,
      o.customer_id,
      c.customer_name,
      c.mobile_no as customer_mobile,
      o.order_date,
      o.po_no,
      COUNT(DISTINCT oi.id) as total_items,
      SUM(oib.balance_quantity) as total_balance_quantity,
      SUM(oi.total_amount) as order_total
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN order_items_balance oib ON oi.id = oib.order_item_id
    WHERE o.status = 'Pending' AND oib.balance_quantity > 0
    GROUP BY o.id, o.order_no, o.customer_id, c.customer_name, c.mobile_no, o.order_date, o.po_no
    ORDER BY o.order_date DESC`
  );
  
  res.json(apiResponse(true, result.rows));
}));

// Get order items balance for dispatch
router.get('/:id/balance', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT 
      oib.order_item_id,
      oib.item_id,
      oib.item_name,
      i.alias as item_alias,
      u.uom_short_name as uom,
      oib.ordered_quantity,
      oib.dispatched_quantity,
      oib.balance_quantity,
      oi.rate,
      oi.bag_count as ordered_bag_count
    FROM order_items_balance oib
    JOIN order_items oi ON oib.order_item_id = oi.id
    JOIN items i ON oib.item_id = i.id
    JOIN uom u ON i.uom_id = u.id
    WHERE oib.order_id = $1
    ORDER BY oib.order_item_id`,
    [req.params.id]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json(apiResponse(false, null, 'Order not found'));
  }
  
  res.json(apiResponse(true, result.rows));
}));

// Delete order (cascade deletes items)
router.delete('/:id', asyncHandler(async (req, res) => {
  // Check if order has dispatches
  const dispatchCheck = await query(
    'SELECT COUNT(*) as count FROM dispatches WHERE order_id = $1',
    [req.params.id]
  );
  
  if (parseInt(dispatchCheck.rows[0].count) > 0) {
    return res.status(400).json(apiResponse(false, null, 'Cannot delete order with dispatches'));
  }
  
  const order = await crud.delete('orders', req.params.id);
  
  if (!order) {
    return res.status(404).json(apiResponse(false, null, 'Order not found'));
  }
  
  res.json(apiResponse(true, null, 'Order deleted successfully'));
}));

module.exports = router;

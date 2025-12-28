const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/scrap_grn';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per file
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDF, and Word documents are allowed'));
    }
  }
});

// Get all scrap GRN records with filters
router.get('/', async (req, res) => {
  try {
    const { supplier_id, from_date, to_date } = req.query;
    
    let queryText = `
      SELECT 
        sg.id,
        sg.grn_no,
        sg.supplier_id,
        s.supplier_name,
        sg.invoice_no,
        sg.invoice_date,
        sg.vehicle_no,
        sg.packing_forwarding,
        sg.total_amount,
        sg.cgst,
        sg.sgst,
        sg.igst,
        sg.invoice_total,
        sg.created_at,
        sg.updated_at,
        COUNT(DISTINCT sgi.id) as total_items
      FROM scrap_grn sg
      JOIN suppliers s ON sg.supplier_id = s.id
      LEFT JOIN scrap_grn_items sgi ON sg.id = sgi.grn_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (supplier_id) {
      queryText += ` AND sg.supplier_id = $${paramIndex}`;
      params.push(supplier_id);
      paramIndex++;
    }
    
    if (from_date) {
      queryText += ` AND sg.invoice_date >= $${paramIndex}`;
      params.push(from_date);
      paramIndex++;
    }
    
    if (to_date) {
      queryText += ` AND sg.invoice_date <= $${paramIndex}`;
      params.push(to_date);
      paramIndex++;
    }
    
    queryText += `
      GROUP BY sg.id, sg.grn_no, sg.supplier_id, s.supplier_name, sg.invoice_no, 
               sg.invoice_date, sg.vehicle_no, sg.packing_forwarding, sg.total_amount, 
               sg.cgst, sg.sgst, sg.igst, sg.invoice_total, 
               sg.created_at, sg.updated_at
      ORDER BY sg.invoice_date DESC, sg.id DESC
    `;
    
    const result = await query(queryText, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching scrap GRN:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single scrap GRN by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get GRN header
    const grnResult = await query(`
      SELECT 
        sg.*,
        s.supplier_name,
        s.state as supplier_state
      FROM scrap_grn sg
      JOIN suppliers s ON sg.supplier_id = s.id
      WHERE sg.id = $1
    `, [id]);
    
    if (grnResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Scrap GRN not found' });
    }
    
    // Get GRN items
    const itemsResult = await query(`
      SELECT 
        sgi.*,
        i.item_name,
        i.alias as item_alias,
        u.uom_short_name as uom,
        gr.gst_rate as item_gst_rate
      FROM scrap_grn_items sgi
      JOIN items i ON sgi.item_id = i.id
      JOIN uom u ON i.uom_id = u.id
      LEFT JOIN gst_rates gr ON i.gst_rate_id = gr.id
      WHERE sgi.grn_id = $1
      ORDER BY sgi.id
    `, [id]);
    
    // Get uploads
    const uploadsResult = await query(`
      SELECT *
      FROM scrap_grn_uploads
      WHERE grn_id = $1
      ORDER BY file_type, id
    `, [id]);
    
    const grn = grnResult.rows[0];
    grn.items = itemsResult.rows;
    grn.uploads = uploadsResult.rows;
    
    res.json({ success: true, data: grn });
  } catch (error) {
    console.error('Error fetching scrap GRN:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new scrap GRN
router.post('/', upload.fields([
  { name: 'invoice_copy', maxCount: 5 },
  { name: 'weight_bridge', maxCount: 5 },
  { name: 'materials_photos', maxCount: 10 },
  { name: 'other_documents', maxCount: 5 }
]), async (req, res) => {
  try {
    const {
      supplier_id,
      invoice_no,
      invoice_date,
      vehicle_no,
      packing_forwarding,
      total_amount,
      cgst,
      sgst,
      igst,
      invoice_total,
      items
    } = req.body;
    
    // Parse items if it's a string
    const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
    
    const result = await transaction(async (client) => {
      // Generate GRN number
      const grnNoResult = await client.query('SELECT generate_grn_no() as grn_no');
      const grn_no = grnNoResult.rows[0].grn_no;
      
      // Insert GRN header
      const grnResult = await client.query(`
        INSERT INTO scrap_grn (
          grn_no, supplier_id, invoice_no, invoice_date, vehicle_no,
          packing_forwarding, total_amount, cgst, sgst, igst, invoice_total
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        grn_no, supplier_id, invoice_no, invoice_date, vehicle_no || null,
        packing_forwarding || 0, total_amount, cgst || 0, sgst || 0, igst || 0,
        invoice_total
      ]);
      
      const grn = grnResult.rows[0];
      
      // Insert GRN items
      for (const item of parsedItems) {
        await client.query(`
          INSERT INTO scrap_grn_items (
            grn_id, item_id, quantity, rate, amount, gst_rate, gst_amount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          grn.id,
          item.item_id,
          item.quantity,
          item.rate,
          item.amount,
          item.gst_rate || 0,
          item.gst_amount || 0
        ]);
      }
      
      // Handle file uploads
      if (req.files) {
        for (const [fileType, files] of Object.entries(req.files)) {
          for (const file of files) {
            await client.query(`
              INSERT INTO scrap_grn_uploads (grn_id, file_type, file_name, file_path)
              VALUES ($1, $2, $3, $4)
            `, [grn.id, fileType, file.originalname, file.path]);
          }
        }
      }
      
      return grn;
    });
    
    res.status(201).json({ success: true, data: result, message: 'Scrap GRN created successfully' });
  } catch (error) {
    console.error('Error creating scrap GRN:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update scrap GRN
router.put('/:id', upload.fields([
  { name: 'invoice_copy', maxCount: 5 },
  { name: 'weight_bridge', maxCount: 5 },
  { name: 'materials_photos', maxCount: 10 },
  { name: 'other_documents', maxCount: 5 }
]), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      supplier_id,
      invoice_no,
      invoice_date,
      vehicle_no,
      packing_forwarding,
      total_amount,
      cgst,
      sgst,
      igst,
      invoice_total,
      items
    } = req.body;
    
    const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
    
    const result = await transaction(async (client) => {
      // Update GRN header
      const grnResult = await client.query(`
        UPDATE scrap_grn
        SET supplier_id = $1, invoice_no = $2, invoice_date = $3, vehicle_no = $4,
            packing_forwarding = $5, total_amount = $6, cgst = $7, sgst = $8,
            igst = $9, invoice_total = $10
        WHERE id = $11
        RETURNING *
      `, [
        supplier_id, invoice_no, invoice_date, vehicle_no || null,
        packing_forwarding || 0, total_amount, cgst || 0, sgst || 0, igst || 0,
        invoice_total, id
      ]);
      
      if (grnResult.rows.length === 0) {
        throw new Error('Scrap GRN not found');
      }
      
      // Delete existing items
      await client.query('DELETE FROM scrap_grn_items WHERE grn_id = $1', [id]);
      
      // Insert updated items
      for (const item of parsedItems) {
        await client.query(`
          INSERT INTO scrap_grn_items (
            grn_id, item_id, quantity, rate, amount, gst_rate, gst_amount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          id,
          item.item_id,
          item.quantity,
          item.rate,
          item.amount,
          item.gst_rate || 0,
          item.gst_amount || 0
        ]);
      }
      
      // Handle new file uploads
      if (req.files) {
        for (const [fileType, files] of Object.entries(req.files)) {
          for (const file of files) {
            await client.query(`
              INSERT INTO scrap_grn_uploads (grn_id, file_type, file_name, file_path)
              VALUES ($1, $2, $3, $4)
            `, [id, fileType, file.originalname, file.path]);
          }
        }
      }
      
      return grnResult.rows[0];
    });
    
    res.json({ success: true, data: result, message: 'Scrap GRN updated successfully' });
  } catch (error) {
    console.error('Error updating scrap GRN:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete scrap GRN
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await transaction(async (client) => {
      // Get file paths to delete
      const filesResult = await client.query(
        'SELECT file_path FROM scrap_grn_uploads WHERE grn_id = $1',
        [id]
      );
      
      // Delete the GRN (cascade will delete items and uploads)
      const result = await client.query(
        'DELETE FROM scrap_grn WHERE id = $1 RETURNING *',
        [id]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Scrap GRN not found');
      }
      
      // Delete physical files
      filesResult.rows.forEach(row => {
        if (fs.existsSync(row.file_path)) {
          fs.unlinkSync(row.file_path);
        }
      });
    });
    
    res.json({ success: true, message: 'Scrap GRN deleted successfully' });
  } catch (error) {
    console.error('Error deleting scrap GRN:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete uploaded file
router.delete('/:id/upload/:uploadId', async (req, res) => {
  try {
    const { id, uploadId } = req.params;
    
    const result = await query(
      'DELETE FROM scrap_grn_uploads WHERE id = $1 AND grn_id = $2 RETURNING file_path',
      [uploadId, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Upload not found' });
    }
    
    // Delete physical file
    const filePath = result.rows[0].file_path;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get raw material items
router.get('/items/raw-materials', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        i.id,
        i.item_name,
        i.alias,
        c.category_name,
        u.uom_short_name as uom,
        gr.gst_rate
      FROM items i
      JOIN categories c ON i.category_id = c.id
      JOIN uom u ON i.uom_id = u.id
      LEFT JOIN gst_rates gr ON i.gst_rate_id = gr.id
      WHERE c.category_name IN ('Raw Material', 'Minerals')
      ORDER BY i.item_name
    `);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching raw materials:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

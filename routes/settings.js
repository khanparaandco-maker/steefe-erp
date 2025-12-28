const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for logo upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/company');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Get company settings
router.get('/company', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM company_settings ORDER BY id LIMIT 1'
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Company settings not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching company settings:', error);
    res.status(500).json({ message: 'Error fetching company settings', error: error.message });
  }
});

// Update company settings
router.put('/company', upload.single('logo'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      company_name, address_line1, address_line2, city, state, pincode,
      gstn, pan, contact_person, mobile, email, website
    } = req.body;
    
    let logoUrl = null;
    let logoFilename = null;
    
    // Handle logo upload
    if (req.file) {
      logoUrl = `/uploads/company/${req.file.filename}`;
      logoFilename = req.file.filename;
      
      // Delete old logo if exists
      const oldLogo = await client.query(
        'SELECT logo_filename FROM company_settings WHERE id = 1'
      );
      
      if (oldLogo.rows[0]?.logo_filename) {
        const oldLogoPath = path.join(__dirname, '../uploads/company', oldLogo.rows[0].logo_filename);
        try {
          await fs.unlink(oldLogoPath);
        } catch (err) {
          console.log('Old logo file not found or already deleted');
        }
      }
    }
    
    // Check if settings exist
    const existing = await client.query('SELECT id FROM company_settings LIMIT 1');
    
    let query;
    let values;
    
    if (existing.rows.length === 0) {
      // Insert new
      query = `
        INSERT INTO company_settings (
          company_name, address_line1, address_line2, city, state, pincode,
          gstn, pan, contact_person, mobile, email, website, logo_url, logo_filename
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;
      values = [
        company_name, address_line1, address_line2, city, state, pincode,
        gstn, pan, contact_person, mobile, email, website, logoUrl, logoFilename
      ];
    } else {
      // Update existing
      if (req.file) {
        query = `
          UPDATE company_settings SET
            company_name = $1, address_line1 = $2, address_line2 = $3, city = $4,
            state = $5, pincode = $6, gstn = $7, pan = $8, contact_person = $9,
            mobile = $10, email = $11, website = $12, logo_url = $13, logo_filename = $14,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = 1
          RETURNING *
        `;
        values = [
          company_name, address_line1, address_line2, city, state, pincode,
          gstn, pan, contact_person, mobile, email, website, logoUrl, logoFilename
        ];
      } else {
        query = `
          UPDATE company_settings SET
            company_name = $1, address_line1 = $2, address_line2 = $3, city = $4,
            state = $5, pincode = $6, gstn = $7, pan = $8, contact_person = $9,
            mobile = $10, email = $11, website = $12, updated_at = CURRENT_TIMESTAMP
          WHERE id = 1
          RETURNING *
        `;
        values = [
          company_name, address_line1, address_line2, city, state, pincode,
          gstn, pan, contact_person, mobile, email, website
        ];
      }
    }
    
    const result = await client.query(query, values);
    
    await client.query('COMMIT');
    res.json({ message: 'Company settings saved successfully', data: result.rows[0] });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error saving company settings:', error);
    res.status(500).json({ message: 'Error saving company settings', error: error.message });
  } finally {
    client.release();
  }
});

// Get WhatsApp settings
router.get('/whatsapp', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT whatsapp_enabled, whatsapp_api_key, whatsapp_phone_number, whatsapp_instance_id FROM company_settings LIMIT 1'
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'WhatsApp settings not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching WhatsApp settings:', error);
    res.status(500).json({ message: 'Error fetching WhatsApp settings', error: error.message });
  }
});

// Update WhatsApp settings
router.put('/whatsapp', async (req, res) => {
  try {
    const { whatsapp_enabled, whatsapp_api_key, whatsapp_phone_number, whatsapp_instance_id } = req.body;
    
    const result = await pool.query(
      `UPDATE company_settings SET
        whatsapp_enabled = $1,
        whatsapp_api_key = $2,
        whatsapp_phone_number = $3,
        whatsapp_instance_id = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
      RETURNING *`,
      [whatsapp_enabled, whatsapp_api_key, whatsapp_phone_number, whatsapp_instance_id]
    );
    
    res.json({ message: 'WhatsApp settings saved successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Error saving WhatsApp settings:', error);
    res.status(500).json({ message: 'Error saving WhatsApp settings', error: error.message });
  }
});

// Get Email settings
router.get('/email', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT email_enabled, smtp_host, smtp_port, smtp_user, smtp_password,
              from_email, from_name, use_ssl FROM company_settings LIMIT 1`
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Email settings not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching email settings:', error);
    res.status(500).json({ message: 'Error fetching email settings', error: error.message });
  }
});

// Update Email settings
router.put('/email', async (req, res) => {
  try {
    const {
      email_enabled, smtp_host, smtp_port, smtp_user, smtp_password,
      from_email, from_name, use_ssl
    } = req.body;
    
    const result = await pool.query(
      `UPDATE company_settings SET
        email_enabled = $1,
        smtp_host = $2,
        smtp_port = $3,
        smtp_user = $4,
        smtp_password = $5,
        from_email = $6,
        from_name = $7,
        use_ssl = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
      RETURNING *`,
      [email_enabled, smtp_host, smtp_port, smtp_user, smtp_password,
       from_email, from_name, use_ssl]
    );
    
    res.json({ message: 'Email settings saved successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Error saving email settings:', error);
    res.status(500).json({ message: 'Error saving email settings', error: error.message });
  }
});

// ==========================================
// BANK ACCOUNTS ROUTES
// ==========================================

// Get all bank accounts
router.get('/banks', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM bank_accounts WHERE is_active = true ORDER BY is_primary DESC, bank_name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    res.status(500).json({ message: 'Error fetching bank accounts', error: error.message });
  }
});

// Get single bank account
router.get('/banks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM bank_accounts WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Bank account not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching bank account:', error);
    res.status(500).json({ message: 'Error fetching bank account', error: error.message });
  }
});

// Create bank account
router.post('/banks', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      bank_name, account_holder_name, account_number, ifsc_code, branch_name,
      account_type, upi_id, swift_code, micr_code, is_primary
    } = req.body;
    
    // If this is set as primary, unset other primary banks
    if (is_primary) {
      await client.query('UPDATE bank_accounts SET is_primary = false');
    }
    
    const result = await client.query(
      `INSERT INTO bank_accounts (
        bank_name, account_holder_name, account_number, ifsc_code, branch_name,
        account_type, upi_id, swift_code, micr_code, is_primary
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [bank_name, account_holder_name, account_number, ifsc_code, branch_name,
       account_type, upi_id, swift_code, micr_code, is_primary || false]
    );
    
    await client.query('COMMIT');
    res.status(201).json({ message: 'Bank account created successfully', data: result.rows[0] });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating bank account:', error);
    res.status(500).json({ message: 'Error creating bank account', error: error.message });
  } finally {
    client.release();
  }
});

// Update bank account
router.put('/banks/:id', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const {
      bank_name, account_holder_name, account_number, ifsc_code, branch_name,
      account_type, upi_id, swift_code, micr_code, is_primary
    } = req.body;
    
    // If this is set as primary, unset other primary banks
    if (is_primary) {
      await client.query('UPDATE bank_accounts SET is_primary = false WHERE id != $1', [id]);
    }
    
    const result = await client.query(
      `UPDATE bank_accounts SET
        bank_name = $1, account_holder_name = $2, account_number = $3,
        ifsc_code = $4, branch_name = $5, account_type = $6, upi_id = $7,
        swift_code = $8, micr_code = $9, is_primary = $10, updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *`,
      [bank_name, account_holder_name, account_number, ifsc_code, branch_name,
       account_type, upi_id, swift_code, micr_code, is_primary || false, id]
    );
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Bank account not found' });
    }
    
    await client.query('COMMIT');
    res.json({ message: 'Bank account updated successfully', data: result.rows[0] });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating bank account:', error);
    res.status(500).json({ message: 'Error updating bank account', error: error.message });
  } finally {
    client.release();
  }
});

// Delete bank account (soft delete)
router.delete('/banks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'UPDATE bank_accounts SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Bank account not found' });
    }
    
    res.json({ message: 'Bank account deleted successfully' });
  } catch (error) {
    console.error('Error deleting bank account:', error);
    res.status(500).json({ message: 'Error deleting bank account', error: error.message });
  }
});

module.exports = router;

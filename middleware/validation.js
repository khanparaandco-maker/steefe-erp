const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation middleware to check for validation errors
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * Common validation rules
 */
const validationRules = {
  // ID parameter validation
  idParam: [
    param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer')
  ],

  // Supplier validation
  supplier: {
    create: [
      body('name').trim().notEmpty().withMessage('Name is required'),
      body('mobile').optional().isMobilePhone().withMessage('Invalid mobile number'),
      body('gstn').optional().isLength({ min: 15, max: 15 }).withMessage('GSTN must be 15 characters')
    ],
    update: [
      body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
      body('mobile').optional().isMobilePhone().withMessage('Invalid mobile number'),
      body('gstn').optional().isLength({ min: 15, max: 15 }).withMessage('GSTN must be 15 characters')
    ]
  },

  // Category validation
  category: {
    create: [
      body('name').trim().notEmpty().withMessage('Name is required')
    ],
    update: [
      body('name').optional().trim().notEmpty().withMessage('Name cannot be empty')
    ]
  },

  // UOM validation
  uom: {
    create: [
      body('short_name').trim().notEmpty().withMessage('Short name is required')
    ],
    update: [
      body('short_name').optional().trim().notEmpty().withMessage('Short name cannot be empty')
    ]
  },

  // GST Rate validation
  gstRate: {
    create: [
      body('hsn_code').trim().notEmpty().withMessage('HSN code is required'),
      body('rate_percentage').isFloat({ min: 0, max: 100 }).withMessage('Rate must be between 0 and 100'),
      body('effective_date').optional().isISO8601().withMessage('Invalid date format')
    ],
    update: [
      body('hsn_code').optional().trim().notEmpty().withMessage('HSN code cannot be empty'),
      body('rate_percentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Rate must be between 0 and 100'),
      body('effective_date').optional().isISO8601().withMessage('Invalid date format')
    ]
  },

  // Item validation
  item: {
    create: [
      body('name').trim().notEmpty().withMessage('Name is required'),
      body('category_id').isInt({ min: 1 }).withMessage('Valid category_id is required'),
      body('uom_id').isInt({ min: 1 }).withMessage('Valid uom_id is required'),
      body('gst_rate_id').isInt({ min: 1 }).withMessage('Valid gst_rate_id is required')
    ],
    update: [
      body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
      body('category_id').optional().isInt({ min: 1 }).withMessage('Invalid category_id'),
      body('uom_id').optional().isInt({ min: 1 }).withMessage('Invalid uom_id'),
      body('gst_rate_id').optional().isInt({ min: 1 }).withMessage('Invalid gst_rate_id')
    ]
  },

  // Customer validation
  customer: {
    create: [
      body('name').trim().notEmpty().withMessage('Name is required'),
      body('state').trim().notEmpty().withMessage('State is required'),
      body('mobile').optional().isMobilePhone().withMessage('Invalid mobile number'),
      body('gstn').optional().isLength({ min: 15, max: 15 }).withMessage('GSTN must be 15 characters')
    ],
    update: [
      body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
      body('state').optional().trim().notEmpty().withMessage('State cannot be empty'),
      body('mobile').optional().isMobilePhone().withMessage('Invalid mobile number'),
      body('gstn').optional().isLength({ min: 15, max: 15 }).withMessage('GSTN must be 15 characters')
    ]
  },

  // Order validation
  order: {
    create: [
      body('customer_id').isInt({ min: 1 }).withMessage('Valid customer_id is required'),
      body('order_date').isISO8601().withMessage('Valid order_date is required (YYYY-MM-DD)'),
      body('estimated_delivery_date').optional().isISO8601().withMessage('Invalid date format'),
      body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
      body('items.*.item_id').isInt({ min: 1 }).withMessage('Valid item_id is required'),
      body('items.*.quantity').isFloat({ min: 0.001 }).withMessage('Quantity must be greater than 0'),
      body('items.*.rate').isFloat({ min: 0 }).withMessage('Rate must be 0 or greater')
    ],
    update: [
      body('customer_id').optional().isInt({ min: 1 }).withMessage('Invalid customer_id'),
      body('order_date').optional().isISO8601().withMessage('Invalid date format'),
      body('estimated_delivery_date').optional().isISO8601().withMessage('Invalid date format')
    ]
  },

  // Dispatch validation
  dispatch: {
    create: [
      body('order_id').isInt({ min: 1 }).withMessage('Valid order_id is required'),
      body('dispatch_date').isISO8601().withMessage('Valid dispatch_date is required (YYYY-MM-DD)'),
      body('transporter_id').optional().isInt({ min: 1 }).withMessage('Invalid transporter_id'),
      body('lr_date').optional().isISO8601().withMessage('Invalid date format'),
      body('invoice_date').optional().isISO8601().withMessage('Invalid date format'),
      body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
      body('items.*.order_item_id').isInt({ min: 1 }).withMessage('Valid order_item_id is required'),
      body('items.*.quantity_dispatched').isFloat({ min: 0.001 }).withMessage('Dispatch quantity must be greater than 0')
    ],
    update: [
      body('dispatch_date').optional().isISO8601().withMessage('Invalid date format'),
      body('transporter_id').optional().isInt({ min: 1 }).withMessage('Invalid transporter_id'),
      body('lr_date').optional().isISO8601().withMessage('Invalid date format'),
      body('invoice_date').optional().isISO8601().withMessage('Invalid date format')
    ]
  }
};

module.exports = {
  validate,
  validationRules
};

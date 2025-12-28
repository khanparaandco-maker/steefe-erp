/**
 * Calculate GST based on company state and customer state
 * @param {string} customerState - Customer's state
 * @param {number} amount - Base amount
 * @param {number} gstRate - GST rate percentage
 * @returns {Object} { cgst, sgst, igst }
 */
const calculateGST = (customerState, amount, gstRate) => {
  const companyState = process.env.COMPANY_STATE || 'Maharashtra';
  
  const gstAmount = (amount * gstRate) / 100;
  
  if (customerState === companyState) {
    // Same state: CGST + SGST
    return {
      cgst: parseFloat((gstAmount / 2).toFixed(2)),
      sgst: parseFloat((gstAmount / 2).toFixed(2)),
      igst: 0
    };
  } else {
    // Different state: IGST
    return {
      cgst: 0,
      sgst: 0,
      igst: parseFloat(gstAmount.toFixed(2))
    };
  }
};

/**
 * Calculate bag count from quantity
 * @param {number} quantity - Quantity value
 * @returns {number} Bag count
 */
const calculateBagCount = (quantity) => {
  const bagsPerQuantity = parseFloat(process.env.BAGS_PER_QUANTITY || 25);
  return parseFloat((quantity / bagsPerQuantity).toFixed(3));
};

/**
 * Format date to YYYY-MM-DD
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date
 */
const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

/**
 * Validate required fields
 * @param {Object} data - Data object
 * @param {Array} requiredFields - Array of required field names
 * @throws {Error} If validation fails
 */
const validateRequired = (data, requiredFields) => {
  const missing = requiredFields.filter(field => !data[field]);
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
};

/**
 * Create standard API response
 * @param {boolean} success - Success status
 * @param {*} data - Response data
 * @param {string} message - Optional message
 * @returns {Object} Response object
 */
const apiResponse = (success, data = null, message = null) => {
  const response = { success };
  if (message) response.message = message;
  if (data) response.data = data;
  return response;
};

/**
 * Handle async route errors
 * @param {Function} fn - Async route handler
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  calculateGST,
  calculateBagCount,
  formatDate,
  validateRequired,
  apiResponse,
  asyncHandler
};

import { COMPANY_STATE, BAGS_PER_QUANTITY } from './constants';

/**
 * Calculate GST based on customer state
 * @param {number} amount - Base amount
 * @param {number} gstRate - GST rate percentage
 * @param {string} customerState - Customer's state
 * @returns {object} - CGST, SGST, IGST values
 */
export const calculateGST = (amount, gstRate, customerState) => {
  const gstAmount = (amount * gstRate) / 100;
  
  if (customerState === COMPANY_STATE) {
    // Same state - CGST + SGST
    return {
      cgst: gstAmount / 2,
      sgst: gstAmount / 2,
      igst: 0,
      total: gstAmount,
    };
  } else {
    // Different state - IGST
    return {
      cgst: 0,
      sgst: 0,
      igst: gstAmount,
      total: gstAmount,
    };
  }
};

/**
 * Calculate number of bags from quantity
 * @param {number} quantity
 * @returns {number} - Number of bags
 */
export const calculateBags = (quantity) => {
  return Math.ceil(quantity / BAGS_PER_QUANTITY);
};

/**
 * Format date to YYYY-MM-DD
 * @param {Date|string} date
 * @returns {string}
 */
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

/**
 * Format date to display format
 * @param {Date|string} date
 * @returns {string}
 */
export const formatDisplayDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format currency
 * @param {number} amount
 * @returns {string}
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format number with commas
 * @param {number} num
 * @returns {string}
 */
export const formatNumber = (num) => {
  return new Intl.NumberFormat('en-IN').format(num);
};

/**
 * Validate GSTN format
 * @param {string} gstn
 * @returns {boolean}
 */
export const validateGSTN = (gstn) => {
  const gstnRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstnRegex.test(gstn);
};

/**
 * Validate mobile number
 * Accepts both formats:
 * - 10-digit Indian: 9876543210
 * - International with country code: 919876543210
 * @param {string} mobile
 * @returns {boolean}
 */
export const validateMobile = (mobile) => {
  // Remove any spaces or special characters
  const cleanedMobile = mobile.replace(/[\s\-\(\)]/g, '');
  
  // Check for 10-digit Indian mobile (6-9 as first digit)
  const indianMobileRegex = /^[6-9]\d{9}$/;
  
  // Check for international format with country code (10-15 digits)
  const internationalMobileRegex = /^\d{10,15}$/;
  
  return indianMobileRegex.test(cleanedMobile) || internationalMobileRegex.test(cleanedMobile);
};

/**
 * Show toast notification (you can integrate with a toast library)
 * @param {string} message
 * @param {string} type - 'success' | 'error' | 'info'
 */
export const showToast = (message, type = 'info') => {
  // Simple console log for now, can be replaced with a toast library
  console.log(`[${type.toUpperCase()}]: ${message}`);
  alert(`${type.toUpperCase()}: ${message}`);
};

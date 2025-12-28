const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

/**
 * Verify JWT token and attach user to request
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided. Please login.' 
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');

    // Check if session is still valid
    const sessionCheck = await query(
      `SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.is_active
       FROM users u
       JOIN user_sessions us ON u.id = us.user_id
       WHERE u.id = $1 AND us.token_hash = $2 AND us.is_active = TRUE AND us.expires_at > NOW()`,
      [decoded.userId, decoded.sessionId]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'Session expired or invalid. Please login again.' 
      });
    }

    const user = sessionCheck.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ 
        success: false, 
        error: 'Account is inactive. Contact administrator.' 
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      sessionId: decoded.sessionId
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token. Please login again.' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Token expired. Please login again.' 
      });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Authentication failed.' 
    });
  }
};

/**
 * Check if user has permission for specific module and action
 * @param {string} moduleName - Name of the module
 * @param {string} action - 'view', 'edit', 'delete', or 'export'
 */
const checkPermission = (moduleName, action = 'view') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          error: 'Authentication required.' 
        });
      }

      // Check permission using database function
      const permissionCheck = await query(
        'SELECT check_user_permission($1, $2, $3) as has_permission',
        [req.user.id, moduleName, action]
      );

      const hasPermission = permissionCheck.rows[0]?.has_permission;

      if (!hasPermission) {
        return res.status(403).json({ 
          success: false, 
          error: `You don't have ${action} permission for ${moduleName}.` 
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Permission check failed.' 
      });
    }
  };
};

/**
 * Optional auth - attaches user if token exists but doesn't fail if missing
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
      
      const userCheck = await query(
        'SELECT id, username, email, first_name, last_name FROM users WHERE id = $1 AND is_active = TRUE',
        [decoded.userId]
      );

      if (userCheck.rows.length > 0) {
        const user = userCheck.rows[0];
        req.user = {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name
        };
      }
    }
    
    next();
  } catch (error) {
    // Silent fail for optional auth
    next();
  }
};

/**
 * Log user activity to audit trail
 */
const logActivity = (action, tableName = null) => {
  return async (req, res, next) => {
    try {
      if (req.user) {
        await query(
          'SELECT log_audit($1, $2, $3, $4)',
          [req.user.id, action, tableName, null]
        );
      }
      next();
    } catch (error) {
      console.error('Audit log error:', error);
      // Don't fail the request if logging fails
      next();
    }
  };
};

module.exports = {
  authMiddleware,
  checkPermission,
  optionalAuth,
  logActivity
};

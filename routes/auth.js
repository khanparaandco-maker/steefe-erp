const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
const LOCK_TIME = parseInt(process.env.LOCK_TIME) || 30; // minutes

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return token
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username and password are required.' 
      });
    }

    // Get user from database
    const userResult = await query(
      `SELECT id, username, email, password_hash, first_name, last_name, mobile_no, 
              is_active, failed_login_attempts, locked_until
       FROM users 
       WHERE username = $1 OR email = $1`,
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid username or password.' 
      });
    }

    const user = userResult.rows[0];

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remainingTime = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      return res.status(403).json({ 
        success: false, 
        error: `Account is locked. Try again in ${remainingTime} minutes.` 
      });
    }

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({ 
        success: false, 
        error: 'Account is inactive. Contact administrator.' 
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      // Increment failed login attempts
      const newAttempts = user.failed_login_attempts + 1;
      let lockUntil = null;

      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        lockUntil = new Date(Date.now() + LOCK_TIME * 60000);
        await query(
          'UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3',
          [newAttempts, lockUntil, user.id]
        );
        return res.status(403).json({ 
          success: false, 
          error: `Account locked due to too many failed attempts. Try again in ${LOCK_TIME} minutes.` 
        });
      }

      await query(
        'UPDATE users SET failed_login_attempts = $1 WHERE id = $2',
        [newAttempts, user.id]
      );

      return res.status(401).json({ 
        success: false, 
        error: `Invalid username or password. ${MAX_LOGIN_ATTEMPTS - newAttempts} attempts remaining.` 
      });
    }

    // Reset failed attempts and update last login
    await query(
      'UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Generate session ID
    const sessionId = `sess_${Date.now()}_${user.id}`;
    const tokenHash = require('crypto').createHash('sha256').update(sessionId).digest('hex');

    // Create session in database
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours
    await query(
      `INSERT INTO user_sessions (user_id, token_hash, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, sessionId, expiresAt, req.ip, req.headers['user-agent']]
    );

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        sessionId: sessionId
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Get user permissions
    const permissionsResult = await query(
      'SELECT * FROM get_user_permissions($1)',
      [user.id]
    );

    // Format permissions as object
    const permissions = {};
    permissionsResult.rows.forEach(perm => {
      permissions[perm.module_name] = {
        can_view: perm.can_view,
        can_edit: perm.can_edit,
        can_delete: perm.can_delete,
        can_export: perm.can_export,
        route_path: perm.route_path,
        parent_module: perm.parent_module
      };
    });

    // Log successful login
    await query(
      'SELECT log_audit($1, $2, $3, $4)',
      [user.id, 'LOGIN', 'users', user.id]
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          mobileNo: user.mobile_no
        },
        permissions
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Login failed. Please try again.' 
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and invalidate session
 * @access  Private
 */
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    // Invalidate session
    await query(
      'UPDATE user_sessions SET is_active = FALSE WHERE user_id = $1 AND token_hash = $2',
      [req.user.id, req.user.sessionId]
    );

    // Log logout
    await query(
      'SELECT log_audit($1, $2, $3, $4)',
      [req.user.id, 'LOGOUT', 'users', req.user.id]
    );

    res.json({
      success: true,
      message: 'Logged out successfully.'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Logout failed.' 
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info and permissions
 * @access  Private
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    // Get user details
    const userResult = await query(
      `SELECT id, username, email, first_name, last_name, mobile_no, last_login
       FROM users 
       WHERE id = $1`,
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found.' 
      });
    }

    const user = userResult.rows[0];

    // Get permissions
    const permissionsResult = await query(
      'SELECT * FROM get_user_permissions($1)',
      [user.id]
    );

    const permissions = {};
    permissionsResult.rows.forEach(perm => {
      permissions[perm.module_name] = {
        can_view: perm.can_view,
        can_edit: perm.can_edit,
        can_delete: perm.can_delete,
        can_export: perm.can_export,
        route_path: perm.route_path,
        parent_module: perm.parent_module
      };
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          mobileNo: user.mobile_no,
          lastLogin: user.last_login
        },
        permissions
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get user information.' 
    });
  }
});

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        error: 'Current password and new password are required.' 
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        success: false, 
        error: 'New password must be at least 8 characters long.' 
      });
    }

    // Get current password hash
    const userResult = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    const user = userResult.rows[0];

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        error: 'Current password is incorrect.' 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, req.user.id]
    );

    // Log password change
    await query(
      'SELECT log_audit($1, $2, $3, $4)',
      [req.user.id, 'PASSWORD_CHANGE', 'users', req.user.id]
    );

    res.json({
      success: true,
      message: 'Password changed successfully.'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to change password.' 
    });
  }
});

module.exports = router;

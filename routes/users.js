const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { authMiddleware, checkPermission } = require('../middleware/auth');

// All user routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/users/roles/all
 * @desc    Get all roles
 * @access  Private (requires User Management view permission)
 */
router.get('/roles/all', checkPermission('User Management', 'view'), async (req, res) => {
  try {
    const result = await query(`
      SELECT id, role_name, description
      FROM roles
      ORDER BY id
    `);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch roles.' 
    });
  }
});

/**
 * @route   GET /api/users/modules/all
 * @desc    Get all modules hierarchy
 * @access  Private (requires User Management view permission)
 */
router.get('/modules/all', checkPermission('User Management', 'view'), async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        m.id, m.module_name, m.parent_module_id, m.display_order, 
        m.icon, m.route_path, pm.module_name as parent_name
      FROM modules m
      LEFT JOIN modules pm ON m.parent_module_id = pm.id
      ORDER BY COALESCE(m.parent_module_id, m.id), m.display_order
    `);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get modules error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch modules.' 
    });
  }
});

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private (requires User Management view permission)
 */
router.get('/', checkPermission('User Management', 'view'), async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        u.id, u.username, u.email, 
        CONCAT(u.first_name, ' ', u.last_name) as full_name,
        u.first_name, u.last_name,
        u.is_active, u.last_login, u.created_at,
        u.failed_login_attempts, u.locked_until,
        json_agg(
          json_build_object('role_id', r.id, 'role_name', r.role_name)
        ) FILTER (WHERE r.id IS NOT NULL) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch users.' 
    });
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Get single user by ID
 * @access  Private
 */
router.get('/:id', checkPermission('User Management', 'view'), async (req, res) => {
  try {
    const { id } = req.params;

    const userResult = await query(`
      SELECT 
        u.id, u.username, u.email, u.first_name, u.last_name, u.mobile_no,
        u.is_active, u.last_login, u.created_at, u.updated_at
      FROM users u
      WHERE u.id = $1
    `, [id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found.' 
      });
    }

    // Get user roles
    const rolesResult = await query(`
      SELECT r.id, r.role_name, r.description
      FROM roles r
      JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = $1
    `, [id]);

    res.json({
      success: true,
      data: {
        ...userResult.rows[0],
        roles: rolesResult.rows
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch user.' 
    });
  }
});

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (requires User Management edit permission)
 */
router.post('/', checkPermission('User Management', 'edit'), async (req, res) => {
  try {
    const { username, email, password, full_name, role_ids, is_active } = req.body;

    // Validation
    if (!username || !email || !password || !full_name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username, email, password, and full name are required.' 
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password must be at least 8 characters long.' 
      });
    }

    // Check if username or email already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username or email already exists.' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Split full_name into first_name and last_name
    const nameParts = full_name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || firstName;

    // Create user
    const result = await query(`
      INSERT INTO users (username, email, password_hash, first_name, last_name, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, username, email, first_name, last_name, is_active, created_at
    `, [username, email, hashedPassword, firstName, lastName, is_active !== false]);

    const newUser = result.rows[0];

    // Assign roles if provided
    if (role_ids && Array.isArray(role_ids) && role_ids.length > 0) {
      for (const roleId of role_ids) {
        await query(
          'INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES ($1, $2, $3)',
          [newUser.id, roleId, req.user.id]
        );
      }
    }

    // Log user creation
    await query(
      'SELECT log_audit($1, $2, $3, $4, $5, $6)',
      [req.user.id, 'CREATE', 'users', newUser.id, null, JSON.stringify(newUser)]
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      data: newUser
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create user.' 
    });
  }
});

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (requires User Management edit permission)
 */
router.put('/:id', checkPermission('User Management', 'edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, full_name, is_active, password, role_ids } = req.body;

    // Get old user data for audit
    const oldUserResult = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (oldUserResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found.' 
      });
    }
    const oldUser = oldUserResult.rows[0];

    // Check if username or email already exists for other users
    if (username || email) {
      const existingUser = await query(
        'SELECT id FROM users WHERE (username = $1 OR email = $2) AND id != $3',
        [username || oldUser.username, email || oldUser.email, id]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Username or email already exists.' 
        });
      }
    }

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (username !== undefined) {
      updates.push(`username = $${paramCount++}`);
      values.push(username);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }
    if (full_name !== undefined) {
      const nameParts = full_name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || firstName;
      
      updates.push(`first_name = $${paramCount++}`);
      values.push(firstName);
      updates.push(`last_name = $${paramCount++}`);
      values.push(lastName);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }
    if (password) {
      if (password.length < 8) {
        return res.status(400).json({ 
          success: false, 
          error: 'Password must be at least 8 characters long.' 
        });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push(`password_hash = $${paramCount++}`);
      values.push(hashedPassword);
    }

    if (updates.length === 0 && !role_ids) {
      return res.status(400).json({ 
        success: false, 
        error: 'No fields to update.' 
      });
    }

    // Update user if there are field changes
    if (updates.length > 0) {
      updates.push(`updated_at = NOW()`);
      values.push(id);

      const result = await query(`
        UPDATE users 
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, username, email, first_name, last_name, is_active, updated_at
      `, values);
    }

    // Update roles if provided
    if (role_ids && Array.isArray(role_ids)) {
      // Delete existing roles
      await query('DELETE FROM user_roles WHERE user_id = $1', [id]);
      
      // Assign new roles
      for (const roleId of role_ids) {
        await query(
          'INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES ($1, $2, $3)',
          [id, roleId, req.user.id]
        );
      }
    }

    // Get updated user
    const updatedResult = await query(
      'SELECT id, username, email, first_name, last_name, is_active, updated_at FROM users WHERE id = $1',
      [id]
    );
    const updatedUser = updatedResult.rows[0];

    // Log user update
    await query(
      'SELECT log_audit($1, $2, $3, $4, $5, $6)',
      [req.user.id, 'UPDATE', 'users', id, JSON.stringify(oldUser), JSON.stringify(updatedUser)]
    );

    res.json({
      success: true,
      message: 'User updated successfully.',
      data: updatedUser
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update user.' 
    });
  }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private (requires User Management delete permission)
 */
router.delete('/:id', checkPermission('User Management', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting self
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete your own account.' 
      });
    }

    // Get user data for audit before deletion
    const userResult = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found.' 
      });
    }

    // Delete user (cascades to user_roles and user_sessions)
    await query('DELETE FROM users WHERE id = $1', [id]);

    // Log user deletion
    await query(
      'SELECT log_audit($1, $2, $3, $4, $5, $6)',
      [req.user.id, 'DELETE', 'users', id, JSON.stringify(userResult.rows[0]), null]
    );

    res.json({
      success: true,
      message: 'User deleted successfully.'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete user.' 
    });
  }
});

/**
 * @route   GET /api/users/:id/permissions
 * @desc    Get user-specific custom permissions (not role-based)
 * @access  Private
 */
router.get('/:id/permissions', checkPermission('User Management', 'view'), async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 GET permissions route called for user:', id);

    // Get ONLY user-specific custom permissions (not role-based)
    const result = await query(`
      SELECT 
        module_id,
        can_view,
        can_edit,
        can_delete
      FROM permissions
      WHERE user_id = $1
      ORDER BY module_id
    `, [id]);

    console.log('📊 Query result for user', id, ':', result.rows);

    // Return as array with module_id
    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch permissions.' 
    });
  }
});

/**
 * @route   PUT /api/users/:id/permissions
 * @desc    Update user permissions
 * @access  Private (requires User Management edit permission)
 */
router.put('/:id/permissions', checkPermission('User Management', 'edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    if (!permissions || !Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        error: 'Permissions array is required'
      });
    }

    // Delete existing custom permissions for this user
    await query('DELETE FROM permissions WHERE user_id = $1', [id]);

    // Insert new permissions
    for (const perm of permissions) {
      if (perm.module_id) {
        await query(
          `INSERT INTO permissions (user_id, module_id, can_view, can_edit, can_delete, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [id, perm.module_id, perm.can_view || false, perm.can_edit || false, perm.can_delete || false]
        );
      }
    }

    // Log permission update
    await query(
      'SELECT log_audit($1, $2, $3, $4)',
      [req.user.id, 'UPDATE_PERMISSIONS', 'permissions', id]
    );

    res.json({
      success: true,
      message: 'Permissions updated successfully'
    });

  } catch (error) {
    console.error('Update permissions error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update permissions.',
      details: error.message
    });
  }
});

module.exports = router;

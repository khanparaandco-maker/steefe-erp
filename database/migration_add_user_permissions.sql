-- Migration: Add user-specific permissions support
-- Date: 2025-11-30

-- Add user_id column to permissions table to support per-user permissions
ALTER TABLE permissions 
ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Drop the old unique constraint
ALTER TABLE permissions 
DROP CONSTRAINT IF EXISTS permissions_role_id_module_id_key;

-- Add new constraint: either role_id or user_id must be set, but not both
ALTER TABLE permissions 
ADD CONSTRAINT permissions_role_or_user_check 
CHECK ((role_id IS NOT NULL AND user_id IS NULL) OR (role_id IS NULL AND user_id IS NOT NULL));

-- Add unique constraint for user permissions
CREATE UNIQUE INDEX IF NOT EXISTS idx_permissions_user_module 
ON permissions(user_id, module_id) WHERE user_id IS NOT NULL;

-- Keep unique constraint for role permissions
CREATE UNIQUE INDEX IF NOT EXISTS idx_permissions_role_module 
ON permissions(role_id, module_id) WHERE role_id IS NOT NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_permissions_user_id ON permissions(user_id) WHERE user_id IS NOT NULL;

COMMENT ON COLUMN permissions.user_id IS 'User ID for custom per-user permissions (mutually exclusive with role_id)';

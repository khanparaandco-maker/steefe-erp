-- Update get_user_permissions to include user-specific custom permissions
-- User-specific permissions override role-based permissions

CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id INTEGER)
RETURNS TABLE (
    module_name VARCHAR,
    parent_module VARCHAR,
    can_view BOOLEAN,
    can_edit BOOLEAN,
    can_delete BOOLEAN,
    can_export BOOLEAN,
    route_path VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    WITH role_permissions AS (
        -- Get role-based permissions
        SELECT 
            m.id as module_id,
            m.module_name as mod_name,
            pm.module_name as parent_mod_name,
            p.can_view as perm_view,
            p.can_edit as perm_edit,
            p.can_delete as perm_delete,
            p.can_export as perm_export,
            m.route_path as mod_route,
            m.display_order as mod_order,
            1 as priority  -- Lower priority
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN permissions p ON ur.role_id = p.role_id
        JOIN modules m ON p.module_id = m.id
        LEFT JOIN modules pm ON m.parent_module_id = pm.id
        WHERE u.id = p_user_id 
        AND u.is_active = TRUE
        AND p.role_id IS NOT NULL
    ),
    user_permissions AS (
        -- Get user-specific custom permissions
        SELECT 
            m.id as module_id,
            m.module_name as mod_name,
            pm.module_name as parent_mod_name,
            p.can_view as perm_view,
            p.can_edit as perm_edit,
            p.can_delete as perm_delete,
            FALSE as perm_export,  -- User permissions don't have export flag
            m.route_path as mod_route,
            m.display_order as mod_order,
            2 as priority  -- Higher priority
        FROM permissions p
        JOIN modules m ON p.module_id = m.id
        LEFT JOIN modules pm ON m.parent_module_id = pm.id
        WHERE p.user_id = p_user_id
    ),
    combined_permissions AS (
        -- Combine both, keeping highest priority for each module
        SELECT DISTINCT ON (module_id)
            module_id,
            mod_name,
            parent_mod_name,
            perm_view,
            perm_edit,
            perm_delete,
            perm_export,
            mod_route,
            mod_order
        FROM (
            SELECT * FROM role_permissions
            UNION ALL
            SELECT * FROM user_permissions
        ) all_perms
        ORDER BY module_id, priority DESC  -- Higher priority wins
    )
    SELECT 
        cp.mod_name::VARCHAR,
        cp.parent_mod_name::VARCHAR,
        cp.perm_view,
        cp.perm_edit,
        cp.perm_delete,
        cp.perm_export,
        cp.mod_route::VARCHAR
    FROM combined_permissions cp
    ORDER BY cp.mod_order;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- MIGRATION: Funciones SECURITY DEFINER para el sistema RBAC
-- =============================================================================
-- Estas funciones se usan desde RLS policies y desde el cliente via RPC.
-- Todas son SECURITY DEFINER para evitar recursión de RLS al consultar
-- las tablas role_permissions y user_roles.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- get_user_roles: Devuelve los roles de un usuario como tabla
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_roles(user_uuid UUID)
RETURNS TABLE(role_name TEXT, role_description TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT r.name, r.description
  FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id
  WHERE ur.user_id = user_uuid;
END;
$$;

-- ---------------------------------------------------------------------------
-- get_user_permissions: Devuelve los permisos de un usuario como tabla
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_permissions(user_uuid UUID)
RETURNS TABLE(permission_code TEXT, permission_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.code, p.name
  FROM user_roles ur
  JOIN role_permissions rp ON rp.role_id = ur.role_id
  JOIN permissions p ON p.id = rp.permission_id
  WHERE ur.user_id = user_uuid;
END;
$$;

-- ---------------------------------------------------------------------------
-- has_permission: Verifica si un usuario tiene un permiso específico
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION has_permission(user_uuid UUID, perm_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = user_uuid
      AND p.code = perm_code
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- has_role: Verifica si un usuario tiene un rol específico
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION has_role(user_uuid UUID, role_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = user_uuid
      AND r.name = role_name
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- assign_role: Asigna un rol a un usuario (idempotente)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION assign_role(
  user_uuid UUID,
  role_name TEXT,
  assigned_by_uuid UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_roles (user_id, role_id, assigned_by)
  SELECT user_uuid, id, assigned_by_uuid
  FROM roles
  WHERE name = role_name
  ON CONFLICT (user_id, role_id) DO NOTHING;
END;
$$;

-- ---------------------------------------------------------------------------
-- remove_role: Elimina un rol de un usuario
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION remove_role(user_uuid UUID, role_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM user_roles
  WHERE user_id = user_uuid
    AND role_id = (SELECT id FROM roles WHERE name = role_name);
END;
$$;

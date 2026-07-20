-- =============================================================================
-- MIGRATION: Crear tablas del sistema RBAC
-- =============================================================================
-- Sistema de Roles y Permisos para reemplazar el booleano is_admin.
-- 4 tablas: roles, permissions, role_permissions, user_roles
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. ROLES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 2. PERMISSIONS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 3. ROLE-PERMISSIONS (junction table)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Index for looking up permissions by role
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- ---------------------------------------------------------------------------
-- 4. USER-ROLES (junction table)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  PRIMARY KEY (user_id, role_id)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_by ON user_roles(assigned_by);

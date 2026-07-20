-- =============================================================================
-- MIGRATION: RLS Policies para tablas del sistema RBAC
-- =============================================================================
-- Las policies usan las funciones SECURITY DEFINER creadas en 008.
-- Patrón: SELECT para authenticated, escritura solo con permiso específico.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ROLES
-- ---------------------------------------------------------------------------
-- Todos los usuarios autenticados pueden leer roles
CREATE POLICY "Roles select for authenticated" ON roles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Solo usuarios con permiso 'gestionar_roles' pueden crear/editar/eliminar
CREATE POLICY "Roles insert for gestionar_roles" ON roles
  FOR INSERT WITH CHECK (has_permission(auth.uid(), 'gestionar_roles'));

CREATE POLICY "Roles update for gestionar_roles" ON roles
  FOR UPDATE USING (has_permission(auth.uid(), 'gestionar_roles'));

CREATE POLICY "Roles delete for gestionar_roles" ON roles
  FOR DELETE USING (has_permission(auth.uid(), 'gestionar_roles'));

-- ---------------------------------------------------------------------------
-- PERMISSIONS
-- ---------------------------------------------------------------------------
CREATE POLICY "Permissions select for authenticated" ON permissions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Permissions insert for gestionar_permisos" ON permissions
  FOR INSERT WITH CHECK (has_permission(auth.uid(), 'gestionar_permisos'));

CREATE POLICY "Permissions update for gestionar_permisos" ON permissions
  FOR UPDATE USING (has_permission(auth.uid(), 'gestionar_permisos'));

CREATE POLICY "Permissions delete for gestionar_permisos" ON permissions
  FOR DELETE USING (has_permission(auth.uid(), 'gestionar_permisos'));

-- ---------------------------------------------------------------------------
-- ROLE_PERMISSIONS
-- ---------------------------------------------------------------------------
CREATE POLICY "Role permissions select for gestionar_roles" ON role_permissions
  FOR SELECT USING (has_permission(auth.uid(), 'gestionar_roles'));

CREATE POLICY "Role permissions insert for gestionar_roles" ON role_permissions
  FOR INSERT WITH CHECK (has_permission(auth.uid(), 'gestionar_roles'));

CREATE POLICY "Role permissions update for gestionar_roles" ON role_permissions
  FOR UPDATE USING (has_permission(auth.uid(), 'gestionar_roles'));

CREATE POLICY "Role permissions delete for gestionar_roles" ON role_permissions
  FOR DELETE USING (has_permission(auth.uid(), 'gestionar_roles'));

-- ---------------------------------------------------------------------------
-- USER_ROLES
-- ---------------------------------------------------------------------------
CREATE POLICY "User roles select for gestionar_roles" ON user_roles
  FOR SELECT USING (has_permission(auth.uid(), 'gestionar_roles'));

CREATE POLICY "User roles insert for gestionar_roles" ON user_roles
  FOR INSERT WITH CHECK (has_permission(auth.uid(), 'gestionar_roles'));

CREATE POLICY "User roles update for gestionar_roles" ON user_roles
  FOR UPDATE USING (has_permission(auth.uid(), 'gestionar_roles'));

CREATE POLICY "User roles delete for gestionar_roles" ON user_roles
  FOR DELETE USING (has_permission(auth.uid(), 'gestionar_roles'));

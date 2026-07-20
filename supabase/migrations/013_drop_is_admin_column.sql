-- =============================================================================
-- MIGRATION: Eliminar columna is_admin de profiles
-- =============================================================================
-- SOLO ejecutar después de verificar que:
-- 1. Todos los usuarios admin tienen el rol Dirigente asignado
-- 2. Todas las RLS policies usan has_permission() en vez de is_admin
-- 3. El frontend ya no referencia is_admin
-- =============================================================================

ALTER TABLE profiles DROP COLUMN IF EXISTS is_admin;

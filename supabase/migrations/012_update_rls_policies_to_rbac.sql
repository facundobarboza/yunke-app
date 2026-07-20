-- =============================================================================
-- MIGRATION: Actualizar RLS policies de is_admin a RBAC
-- =============================================================================
-- Reemplaza todas las policies que usan profiles.is_admin = true
-- por policies que usan las funciones has_permission() / has_role().
-- Ejecutar DESPUÉS de 011_migrate_is_admin_to_rbac.sql
-- Las policies se crean solo si no existen (IF NOT EXISTS pattern).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- CATEGORÍAS
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage categorías" ON categorias;
DROP POLICY IF EXISTS "RBAC manage categorías" ON categorias;
CREATE POLICY "RBAC manage categorías" ON categorias
  FOR ALL USING (
    has_permission(auth.uid(), 'gestionar_jugadores')
  );

-- ---------------------------------------------------------------------------
-- JUGADORES
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage jugadores" ON jugadores;
DROP POLICY IF EXISTS "RBAC manage jugadores" ON jugadores;
CREATE POLICY "RBAC manage jugadores" ON jugadores
  FOR ALL USING (
    has_permission(auth.uid(), 'gestionar_jugadores')
  );

-- ---------------------------------------------------------------------------
-- FOTOS DE JUGADORES
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage fotos" ON jugador_fotos;
DROP POLICY IF EXISTS "RBAC manage fotos" ON jugador_fotos;
CREATE POLICY "RBAC manage fotos" ON jugador_fotos
  FOR ALL USING (
    has_permission(auth.uid(), 'gestionar_jugadores')
  );

-- ---------------------------------------------------------------------------
-- RIVALES
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage rivales" ON rivales;
DROP POLICY IF EXISTS "RBAC manage rivales" ON rivales;
CREATE POLICY "RBAC manage rivales" ON rivales
  FOR ALL USING (
    has_permission(auth.uid(), 'gestionar_partidos')
  );

-- ---------------------------------------------------------------------------
-- PARTIDOS
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage partidos" ON partidos;
DROP POLICY IF EXISTS "RBAC manage partidos" ON partidos;
CREATE POLICY "RBAC manage partidos" ON partidos
  FOR ALL USING (
    has_permission(auth.uid(), 'gestionar_partidos')
  );

-- ---------------------------------------------------------------------------
-- SPONSORS
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage sponsors" ON sponsors;
DROP POLICY IF EXISTS "RBAC manage sponsors" ON sponsors;
CREATE POLICY "RBAC manage sponsors" ON sponsors
  FOR ALL USING (
    has_permission(auth.uid(), 'gestionar_sponsors')
  );

-- ---------------------------------------------------------------------------
-- NOTICIAS
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage noticias" ON noticias;
DROP POLICY IF EXISTS "RBAC manage noticias" ON noticias;
CREATE POLICY "RBAC manage noticias" ON noticias
  FOR ALL USING (
    has_permission(auth.uid(), 'gestionar_beneficios')
  );

-- ---------------------------------------------------------------------------
-- BENEFICIOS (separate insert/update/delete policies)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins insert beneficios" ON beneficios;
DROP POLICY IF EXISTS "Admins update beneficios" ON beneficios;
DROP POLICY IF EXISTS "Admins delete beneficios" ON beneficios;
DROP POLICY IF EXISTS "RBAC insert beneficios" ON beneficios;
DROP POLICY IF EXISTS "RBAC update beneficios" ON beneficios;
DROP POLICY IF EXISTS "RBAC delete beneficios" ON beneficios;

CREATE POLICY "RBAC insert beneficios" ON beneficios
  FOR INSERT WITH CHECK (
    has_permission(auth.uid(), 'gestionar_beneficios')
  );

CREATE POLICY "RBAC update beneficios" ON beneficios
  FOR UPDATE USING (
    has_permission(auth.uid(), 'gestionar_beneficios')
  );

CREATE POLICY "RBAC delete beneficios" ON beneficios
  FOR DELETE USING (
    has_permission(auth.uid(), 'gestionar_beneficios')
  );

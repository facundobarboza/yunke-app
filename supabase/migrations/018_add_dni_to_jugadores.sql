-- =============================================================================
-- MIGRATION: Agregar columna DNI a jugadores
-- =============================================================================

ALTER TABLE jugadores ADD COLUMN IF NOT EXISTS dni TEXT;

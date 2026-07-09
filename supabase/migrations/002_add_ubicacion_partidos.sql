-- =============================================================================
-- MIGRATION: Agregar columna ubicación a partidos
-- =============================================================================
-- Ejecutar solo si la tabla partidos ya existe sin esta columna.
-- Si creás la DB desde cero con 001, no necesitás correr esto.

ALTER TABLE partidos ADD COLUMN IF NOT EXISTS ubicacion TEXT;

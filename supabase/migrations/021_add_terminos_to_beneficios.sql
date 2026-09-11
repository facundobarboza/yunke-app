-- =============================================================================
-- MIGRATION: Términos y condiciones (letra chica) para beneficios
-- =============================================================================
-- Columna opcional con la letra chica de cada promoción. El detalle del
-- beneficio la muestra en tipografía pequeña solo cuando tiene contenido.
--
-- Aplicar manualmente en el SQL Editor de Supabase Dashboard
-- =============================================================================

ALTER TABLE beneficios ADD COLUMN IF NOT EXISTS terminos TEXT;

COMMENT ON COLUMN beneficios.terminos IS 'Términos y condiciones (letra chica) del beneficio; opcional';

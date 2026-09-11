-- =============================================================================
-- MIGRATION: Foto de fondo para categorías (equipos)
-- =============================================================================
-- La home muestra cada categoría como tarjeta con foto del equipo
-- y overlay con el gradiente de color de la categoría.

ALTER TABLE categorias ADD COLUMN IF NOT EXISTS foto_url TEXT;

COMMENT ON COLUMN categorias.foto_url IS 'Foto del equipo/categoría para la tarjeta de la home';

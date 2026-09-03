-- =============================================================================
-- MIGRATION: Agregar opciones del teléfono de sponsors
-- =============================================================================
-- Un número puede permitir llamadas, WhatsApp, o ambos.
-- El detalle del sponsor muestra solo los botones habilitados.
--
-- Aplicar manualmente en el SQL Editor de Supabase Dashboard
-- =============================================================================

ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS telefono_whatsapp BOOLEAN DEFAULT true;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS telefono_llamada BOOLEAN DEFAULT true;

COMMENT ON COLUMN sponsors.telefono_whatsapp IS 'Si es true, el detalle muestra el botón de WhatsApp para este número';
COMMENT ON COLUMN sponsors.telefono_llamada IS 'Si es true, el detalle muestra el botón de llamada para este número';

-- =============================================================================
-- MIGRATION: Imagen de portada para beneficios
-- =============================================================================
-- Columna opcional con la URL de la imagen de portada del comercio. El detalle
-- del beneficio la muestra como fondo del header (con overlay) cuando existe;
-- si es NULL se mantiene el gradiente dorado actual.
--
-- Aplicar manualmente en el SQL Editor de Supabase Dashboard o via CLI --linked
-- =============================================================================

ALTER TABLE beneficios ADD COLUMN IF NOT EXISTS portada TEXT;

COMMENT ON COLUMN beneficios.portada IS 'URL de la imagen de portada del comercio; opcional';

-- Bucket público para las portadas de beneficios
INSERT INTO storage.buckets (id, name, public) VALUES ('beneficios', 'beneficios', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Lectura pública
CREATE POLICY "Beneficios portada read" ON storage.objects FOR SELECT
USING (bucket_id = 'beneficios');

-- Escritura para usuarios autenticados
CREATE POLICY "Beneficios portada insert" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'beneficios' AND auth.role() = 'authenticated');

-- Escritura para usuarios anónimos (patrón existente del proyecto)
CREATE POLICY "Beneficios portada insert anon" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'beneficios' AND auth.role() = 'anon');

-- Borrado para usuarios autenticados
CREATE POLICY "Beneficios portada delete" ON storage.objects FOR DELETE
USING (bucket_id = 'beneficios' AND auth.role() = 'authenticated');
-- ============================================
-- Storage RLS Policies for yunke-app
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================

-- 1. Asegurar que los buckets existen y son públicos
INSERT INTO storage.buckets (id, name, public) VALUES ('sponsors', 'sponsors', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public) VALUES ('jugadores', 'jugadores', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public) VALUES ('escudos', 'escudos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ============================================
-- Policies para bucket 'sponsors'
-- ============================================

-- Permitir lectura a todos (bucket público)
CREATE POLICY "Public read for sponsors"
ON storage.objects FOR SELECT
USING (bucket_id = 'sponsors');

-- Permitir upload a usuarios autenticados
CREATE POLICY "Authenticated upload for sponsors"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'sponsors' AND auth.role() = 'authenticated');

-- Permitir upload a usuarios anónimos (anon)
CREATE POLICY "Anon upload for sponsors"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'sponsors' AND auth.role() = 'anon');

-- Permitir delete a usuarios autenticados
CREATE POLICY "Authenticated delete for sponsors"
ON storage.objects FOR DELETE
USING (bucket_id = 'sponsors' AND auth.role() = 'authenticated');

-- Permitir delete a usuarios anónimos
CREATE POLICY "Anon delete for sponsors"
ON storage.objects FOR DELETE
USING (bucket_id = 'sponsors' AND auth.role() = 'anon');

-- ============================================
-- Policies para bucket 'jugadores'
-- ============================================

CREATE POLICY "Public read for jugadores"
ON storage.objects FOR SELECT
USING (bucket_id = 'jugadores');

CREATE POLICY "Authenticated upload for jugadores"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'jugadores' AND auth.role() = 'authenticated');

CREATE POLICY "Anon upload for jugadores"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'jugadores' AND auth.role() = 'anon');

CREATE POLICY "Authenticated delete for jugadores"
ON storage.objects FOR DELETE
USING (bucket_id = 'jugadores' AND auth.role() = 'authenticated');

CREATE POLICY "Anon delete for jugadores"
ON storage.objects FOR DELETE
USING (bucket_id = 'jugadores' AND auth.role() = 'anon');

-- ============================================
-- Policies para bucket 'escudos'
-- ============================================

CREATE POLICY "Public read for escudos"
ON storage.objects FOR SELECT
USING (bucket_id = 'escudos');

CREATE POLICY "Authenticated upload for escudos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'escudos' AND auth.role() = 'authenticated');

CREATE POLICY "Anon upload for escudos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'escudos' AND auth.role() = 'anon');

CREATE POLICY "Authenticated delete for escudos"
ON storage.objects FOR DELETE
USING (bucket_id = 'escudos' AND auth.role() = 'authenticated');

CREATE POLICY "Anon delete for escudos"
ON storage.objects FOR DELETE
USING (bucket_id = 'escudos' AND auth.role() = 'anon');

-- =============================================================================
-- MIGRATION: Crear tabla sponsor_images (galería de fotos de sponsors)
-- =============================================================================
-- Esta tabla es usada por create-sponsor.tsx y sponsor/[id].tsx
-- pero no estaba incluida en la migración original.

CREATE TABLE IF NOT EXISTS sponsor_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sponsor_id UUID REFERENCES sponsors(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sponsor_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sponsor images públicas" ON sponsor_images
  FOR SELECT USING (true);

CREATE POLICY "Admins manage sponsor images" ON sponsor_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- =============================================================================
-- MIGRATION: Crear tabla feature_flags
-- =============================================================================
-- Tabla para controlar features de la app desde Supabase.
-- Los flags se leen con el hook useFeatureFlag().

CREATE TABLE IF NOT EXISTS feature_flags (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  is_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Feature flags públicos" ON feature_flags
  FOR SELECT USING (true);

CREATE POLICY "Admins manage feature flags" ON feature_flags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Flag por defecto: banner de hacerse socio
INSERT INTO feature_flags (key, is_enabled) VALUES
  ('show_membership_banner', false)
ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- SETUP COMPLETO: Club Yunke - Base de datos desde cero
-- =============================================================================
-- Ejecutar en el SQL Editor de Supabase Dashboard
-- Este script crea TODO lo necesario para que la app funcione.
--
-- IMPORTANTE: Ejecutar en este orden exacto.
-- =============================================================================


-- ===========================================================================
-- PARTE 1: TABLA PROFILES (necesaria para Auth y RLS policies)
-- ===========================================================================
-- Esta tabla conecta auth.users con los permisos de admin de la app.

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trigger para crear profile automáticamente cuando un usuario se registra
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ===========================================================================
-- PARTE 2: TABLAS PRINCIPALES
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- CATEGORÍAS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categorias (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  orden INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categorías públicas" ON categorias
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins manage categorías" ON categorias
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- ---------------------------------------------------------------------------
-- JUGADORES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS jugadores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellido TEXT,
  dorsal INTEGER,
  posicion TEXT,
  fecha_nacimiento DATE,
  nacionalidad TEXT,
  instagram TEXT,
  descripcion TEXT,
  foto_url TEXT,
  categoria_id INTEGER REFERENCES categorias(id),
  is_capitan BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE jugadores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jugadores públicos" ON jugadores
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins manage jugadores" ON jugadores
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE OR REPLACE FUNCTION update_jugadores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_jugadores_updated_at
  BEFORE UPDATE ON jugadores
  FOR EACH ROW
  EXECUTE FUNCTION update_jugadores_updated_at();

-- ---------------------------------------------------------------------------
-- FOTOS DE JUGADORES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS jugador_fotos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  jugador_id UUID REFERENCES jugadores(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE jugador_fotos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fotos públicas" ON jugador_fotos
  FOR SELECT USING (true);

CREATE POLICY "Admins manage fotos" ON jugador_fotos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- ---------------------------------------------------------------------------
-- RIVALES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rivales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  escudo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE rivales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rivales públicos" ON rivales
  FOR SELECT USING (true);

CREATE POLICY "Admins manage rivales" ON rivales
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- ---------------------------------------------------------------------------
-- PARTIDOS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS partidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha TIMESTAMPTZ NOT NULL,
  rival TEXT NOT NULL,
  es_local BOOLEAN DEFAULT true,
  competicion TEXT,
  categoria_id INTEGER REFERENCES categorias(id),
  resultado_local INTEGER,
  resultado_visitante INTEGER,
  jugado BOOLEAN DEFAULT false,
  escudo_url TEXT,
  ubicacion TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE partidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partidos públicos" ON partidos
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins manage partidos" ON partidos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE OR REPLACE FUNCTION update_partidos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_partidos_updated_at
  BEFORE UPDATE ON partidos
  FOR EACH ROW
  EXECUTE FUNCTION update_partidos_updated_at();

-- ---------------------------------------------------------------------------
-- SPONSORS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sponsors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  logo_url TEXT,
  portada_url TEXT,
  descripcion TEXT,
  nivel TEXT,
  horarios TEXT,
  direccion TEXT,
  telefono TEXT,
  web_url TEXT,
  instagram TEXT,
  facebook TEXT,
  is_active BOOLEAN DEFAULT true,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sponsors públicos" ON sponsors
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins manage sponsors" ON sponsors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE OR REPLACE FUNCTION update_sponsors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sponsors_updated_at
  BEFORE UPDATE ON sponsors
  FOR EACH ROW
  EXECUTE FUNCTION update_sponsors_updated_at();

-- ---------------------------------------------------------------------------
-- SPONSOR IMAGES (Galería de fotos)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- NOTICIAS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS noticias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE noticias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Noticias públicas" ON noticias
  FOR SELECT USING (true);

CREATE POLICY "Admins manage noticias" ON noticias
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE OR REPLACE FUNCTION update_noticias_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_noticias_updated_at
  BEFORE UPDATE ON noticias
  FOR EACH ROW
  EXECUTE FUNCTION update_noticias_updated_at();

-- ---------------------------------------------------------------------------
-- BENEFICIOS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS beneficios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tienda TEXT NOT NULL,
  descuento TEXT NOT NULL,
  detalle TEXT NOT NULL,
  icono TEXT NOT NULL DEFAULT 'pricetag-outline',
  is_active BOOLEAN DEFAULT true,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE beneficios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Beneficios públicos" ON beneficios
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins insert beneficios" ON beneficios
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins update beneficios" ON beneficios
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins delete beneficios" ON beneficios
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE OR REPLACE FUNCTION update_beneficios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_beneficios_updated_at
  BEFORE UPDATE ON beneficios
  FOR EACH ROW
  EXECUTE FUNCTION update_beneficios_updated_at();

-- ---------------------------------------------------------------------------
-- FEATURE FLAGS
-- ---------------------------------------------------------------------------
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

-- Flags iniciales
INSERT INTO feature_flags (key, is_enabled) VALUES
  ('show_membership_banner', false)
ON CONFLICT (key) DO NOTHING;


-- ===========================================================================
-- PARTE 3: CATEGORÍAS INICIALES
-- ===========================================================================
-- Descomentá y modificá según las categorías de tu club.

INSERT INTO categorias (nombre, orden) VALUES
  ('Primera Masculina', 1),
  ('Primera Femenina', 2),
  ('Sub 17 Masculina', 3),
  ('Sub 17 Femenina', 4),
  ('Sub 15 Masculina', 5),
  ('Sub 15 Femenina', 6),
  ('Formativa', 7)
ON CONFLICT DO NOTHING;


-- ===========================================================================
-- PARTE 4: HACER ADMIN A UN USUARIO
-- ===========================================================================
-- IMPORTANTE: Primero registrate en la app con el email del club.
-- Después ejecutá este script reemplazando el email.

-- Opción 1: Por email (reemplazá 'tu-email@ejemplo.com')
UPDATE profiles SET is_admin = true WHERE email = 'tu-email@ejemplo.com';

-- Opción 2: Por ID de usuario (si ya conocés tu ID)
-- UPDATE profiles SET is_admin = true WHERE id = 'tu-user-id';


-- ===========================================================================
-- PARTE 5: STORAGE BUCKETS (Ejecutar después desde el Dashboard)
-- ===========================================================================
-- No se pueden crear buckets desde SQL. Andá a:
-- Dashboard → Storage → New Bucket
--
-- Crear estos 3 buckets:
--
-- 1. Nombre: jugadores
--    Público: ✅ (Enable public access)
--
-- 2. Nombre: escudos
--    Público: ✅ (Enable public access)
--
-- 3. Nombre: sponsors
--    Público: ✅ (Enable public access)


-- ===========================================================================
-- VERIFICACIÓN FINAL
-- ===========================================================================
SELECT 'profiles' as tabla, count(*) as registros FROM profiles
UNION ALL
SELECT 'categorias', count(*) FROM categorias
UNION ALL
SELECT 'jugadores', count(*) FROM jugadores
UNION ALL
SELECT 'jugador_fotos', count(*) FROM jugador_fotos
UNION ALL
SELECT 'rivales', count(*) FROM rivales
UNION ALL
SELECT 'sponsor_images', count(*) FROM sponsor_images
UNION ALL
SELECT 'sponsors', count(*) FROM sponsors
UNION ALL
SELECT 'partidos', count(*) FROM partidos
UNION ALL
SELECT 'noticias', count(*) FROM noticias
UNION ALL
SELECT 'beneficios', count(*) FROM beneficios
UNION ALL
SELECT 'feature_flags', count(*) FROM feature_flags
ORDER BY tabla;

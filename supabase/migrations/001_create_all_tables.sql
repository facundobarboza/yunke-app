-- =============================================================================
-- MIGRATION: Crear todas las tablas del Club Yunke
-- =============================================================================
-- Ejecutar en el SQL Editor de Supabase (Dashboard > SQL Editor)
-- Esta migración crea todo lo necesario para que la app funcione.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. CATEGORÍAS
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
-- 2. JUGADORES
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
-- 3. FOTOS DE JUGADORES
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
-- 4. RIVALES
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
-- 5. PARTIDOS
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
-- 6. SPONSORS
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
-- 7. NOTICIAS
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
-- 8. BENEFICIOS
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

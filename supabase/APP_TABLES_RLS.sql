-- =============================================================================
-- SETUP: Tablas de la app + RLS policies (RBAC ya existente)
-- =============================================================================
-- Ejecutar en el SQL Editor de Supabase.
-- Asume que las tablas RBAC (roles, permissions, role_permissions, user_roles)
-- y las funciones (has_permission, has_role, etc.) ya existen.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- PROFILES (asegurar que existe)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  nombre TEXT,
  apellido TEXT,
  telefono TEXT,
  dni TEXT,
  is_socio BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Profiles select for own" ON profiles;
  DROP POLICY IF EXISTS "Profiles update for own" ON profiles;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Profiles select for own" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Profiles update for own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trigger para copiar nombre/apellido del user metadata al profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, nombre, apellido)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', ''),
    COALESCE(NEW.raw_user_meta_data->>'apellido', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

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

DO $$ BEGIN DROP POLICY IF EXISTS "Categorías públicas" ON categorias; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "RBAC manage categorías" ON categorias; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Categorías públicas" ON categorias FOR SELECT USING (is_active = true);
CREATE POLICY "RBAC manage categorías" ON categorias
  FOR ALL USING (has_permission(auth.uid(), 'gestionar_jugadores'));

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

DO $$ BEGIN DROP POLICY IF EXISTS "Jugadores públicos" ON jugadores; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "RBAC manage jugadores" ON jugadores; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Jugadores públicos" ON jugadores FOR SELECT USING (is_active = true);
CREATE POLICY "RBAC manage jugadores" ON jugadores
  FOR ALL USING (has_permission(auth.uid(), 'gestionar_jugadores'));

CREATE OR REPLACE FUNCTION update_jugadores_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trigger_jugadores_updated_at ON jugadores;
CREATE TRIGGER trigger_jugadores_updated_at BEFORE UPDATE ON jugadores
  FOR EACH ROW EXECUTE FUNCTION update_jugadores_updated_at();

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

DO $$ BEGIN DROP POLICY IF EXISTS "Fotos públicas" ON jugador_fotos; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "RBAC manage fotos" ON jugador_fotos; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Fotos públicas" ON jugador_fotos FOR SELECT USING (true);
CREATE POLICY "RBAC manage fotos" ON jugador_fotos
  FOR ALL USING (has_permission(auth.uid(), 'gestionar_jugadores'));

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

DO $$ BEGIN DROP POLICY IF EXISTS "Rivales públicos" ON rivales; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "RBAC manage rivales" ON rivales; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Rivales públicos" ON rivales FOR SELECT USING (true);
CREATE POLICY "RBAC manage rivales" ON rivales
  FOR ALL USING (has_permission(auth.uid(), 'gestionar_partidos'));

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

DO $$ BEGIN DROP POLICY IF EXISTS "Partidos públicos" ON partidos; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "RBAC manage partidos" ON partidos; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Partidos públicos" ON partidos FOR SELECT USING (is_active = true);
CREATE POLICY "RBAC manage partidos" ON partidos
  FOR ALL USING (has_permission(auth.uid(), 'gestionar_partidos'));

CREATE OR REPLACE FUNCTION update_partidos_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trigger_partidos_updated_at ON partidos;
CREATE TRIGGER trigger_partidos_updated_at BEFORE UPDATE ON partidos
  FOR EACH ROW EXECUTE FUNCTION update_partidos_updated_at();

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

DO $$ BEGIN DROP POLICY IF EXISTS "Sponsors públicos" ON sponsors; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "RBAC manage sponsors" ON sponsors; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Sponsors públicos" ON sponsors FOR SELECT USING (is_active = true);
CREATE POLICY "RBAC manage sponsors" ON sponsors
  FOR ALL USING (has_permission(auth.uid(), 'gestionar_sponsors'));

CREATE OR REPLACE FUNCTION update_sponsors_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trigger_sponsors_updated_at ON sponsors;
CREATE TRIGGER trigger_sponsors_updated_at BEFORE UPDATE ON sponsors
  FOR EACH ROW EXECUTE FUNCTION update_sponsors_updated_at();

-- ---------------------------------------------------------------------------
-- SPONSOR IMAGES
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

DO $$ BEGIN DROP POLICY IF EXISTS "Sponsor images públicas" ON sponsor_images; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "RBAC manage sponsor images" ON sponsor_images; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Sponsor images públicas" ON sponsor_images FOR SELECT USING (true);
CREATE POLICY "RBAC manage sponsor images" ON sponsor_images
  FOR ALL USING (has_permission(auth.uid(), 'gestionar_sponsors'));

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

DO $$ BEGIN DROP POLICY IF EXISTS "Noticias públicas" ON noticias; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "RBAC manage noticias" ON noticias; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Noticias públicas" ON noticias FOR SELECT USING (true);
CREATE POLICY "RBAC manage noticias" ON noticias
  FOR ALL USING (has_permission(auth.uid(), 'gestionar_beneficios'));

CREATE OR REPLACE FUNCTION update_noticias_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trigger_noticias_updated_at ON noticias;
CREATE TRIGGER trigger_noticias_updated_at BEFORE UPDATE ON noticias
  FOR EACH ROW EXECUTE FUNCTION update_noticias_updated_at();

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

DO $$ BEGIN DROP POLICY IF EXISTS "Beneficios públicos" ON beneficios; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "RBAC insert beneficios" ON beneficios; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "RBAC update beneficios" ON beneficios; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "RBAC delete beneficios" ON beneficios; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Beneficios públicos" ON beneficios FOR SELECT USING (is_active = true);
CREATE POLICY "RBAC insert beneficios" ON beneficios
  FOR INSERT WITH CHECK (has_permission(auth.uid(), 'gestionar_beneficios'));
CREATE POLICY "RBAC update beneficios" ON beneficios
  FOR UPDATE USING (has_permission(auth.uid(), 'gestionar_beneficios'));
CREATE POLICY "RBAC delete beneficios" ON beneficios
  FOR DELETE USING (has_permission(auth.uid(), 'gestionar_beneficios'));

CREATE OR REPLACE FUNCTION update_beneficios_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trigger_beneficios_updated_at ON beneficios;
CREATE TRIGGER trigger_beneficios_updated_at BEFORE UPDATE ON beneficios
  FOR EACH ROW EXECUTE FUNCTION update_beneficios_updated_at();

-- ---------------------------------------------------------------------------
-- FEATURE FLAGS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feature_flags (
  id SERIAL PRIMARY KEY,
  flag_key TEXT UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN DROP POLICY IF EXISTS "Feature flags públicos" ON feature_flags; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "RBAC manage feature flags" ON feature_flags; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Feature flags públicos" ON feature_flags FOR SELECT USING (true);
CREATE POLICY "RBAC manage feature flags" ON feature_flags
  FOR ALL USING (has_permission(auth.uid(), 'gestionar_roles'));

-- ---------------------------------------------------------------------------
-- STORAGE: Buckets + Policies
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) VALUES ('sponsors', 'sponsors', true)
ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('jugadores', 'jugadores', true)
ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('escudos', 'escudos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read for sponsors') THEN
    CREATE POLICY "Public read for sponsors" ON storage.objects FOR SELECT USING (bucket_id = 'sponsors');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon upload for sponsors') THEN
    CREATE POLICY "Anon upload for sponsors" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'sponsors');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon delete for sponsors') THEN
    CREATE POLICY "Anon delete for sponsors" ON storage.objects FOR DELETE USING (bucket_id = 'sponsors');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read for jugadores') THEN
    CREATE POLICY "Public read for jugadores" ON storage.objects FOR SELECT USING (bucket_id = 'jugadores');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon upload for jugadores') THEN
    CREATE POLICY "Anon upload for jugadores" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'jugadores');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon delete for jugadores') THEN
    CREATE POLICY "Anon delete for jugadores" ON storage.objects FOR DELETE USING (bucket_id = 'jugadores');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read for escudos') THEN
    CREATE POLICY "Public read for escudos" ON storage.objects FOR SELECT USING (bucket_id = 'escudos');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon upload for escudos') THEN
    CREATE POLICY "Anon upload for escudos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'escudos');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon delete for escudos') THEN
    CREATE POLICY "Anon delete for escudos" ON storage.objects FOR DELETE USING (bucket_id = 'escudos');
  END IF;
END $$;

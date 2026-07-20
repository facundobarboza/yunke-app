-- =============================================================================
-- SETUP COMPLETO: RBAC + Tablas de la app con RLS
-- =============================================================================
-- Ejecutar UN SOLO ARCHIVO en el SQL Editor de Supabase.
-- Este archivo crea todo: RBAC, tablas de la app, y RLS policies.
-- =============================================================================

-- =============================================================================
-- PARTE 1: SISTEMA RBAC
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1.1 Tablas RBAC
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  PRIMARY KEY (user_id, role_id)
);
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

-- ---------------------------------------------------------------------------
-- 1.2 Funciones SECURITY DEFINER
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_roles(user_uuid UUID)
RETURNS TABLE(role_name TEXT, role_description TEXT)
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT r.name, r.description
  FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id
  WHERE ur.user_id = user_uuid;
END;
$$;

CREATE OR REPLACE FUNCTION get_user_permissions(user_uuid UUID)
RETURNS TABLE(permission_code TEXT, permission_name TEXT)
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.code, p.name
  FROM user_roles ur
  JOIN role_permissions rp ON rp.role_id = ur.role_id
  JOIN permissions p ON p.id = rp.permission_id
  WHERE ur.user_id = user_uuid;
END;
$$;

CREATE OR REPLACE FUNCTION has_permission(user_uuid UUID, perm_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = user_uuid AND p.code = perm_code
  );
END;
$$;

CREATE OR REPLACE FUNCTION has_role(user_uuid UUID, role_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = user_uuid AND r.name = role_name
  );
END;
$$;

CREATE OR REPLACE FUNCTION assign_role(user_uuid UUID, role_name TEXT, assigned_by_uuid UUID DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_roles (user_id, role_id, assigned_by)
  SELECT user_uuid, id, assigned_by_uuid
  FROM roles WHERE name = role_name
  ON CONFLICT (user_id, role_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION remove_role(user_uuid UUID, role_name TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM user_roles
  WHERE user_id = user_uuid
    AND role_id = (SELECT id FROM roles WHERE name = role_name);
END;
$$;

-- ---------------------------------------------------------------------------
-- 1.3 RLS Policies para tablas RBAC
-- ---------------------------------------------------------------------------
CREATE POLICY "Roles select for authenticated" ON roles
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Roles insert for gestionar_roles" ON roles
  FOR INSERT WITH CHECK (has_permission(auth.uid(), 'gestionar_roles'));
CREATE POLICY "Roles update for gestionar_roles" ON roles
  FOR UPDATE USING (has_permission(auth.uid(), 'gestionar_roles'));
CREATE POLICY "Roles delete for gestionar_roles" ON roles
  FOR DELETE USING (has_permission(auth.uid(), 'gestionar_roles'));

CREATE POLICY "Permissions select for authenticated" ON permissions
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permissions insert for gestionar_permisos" ON permissions
  FOR INSERT WITH CHECK (has_permission(auth.uid(), 'gestionar_permisos'));
CREATE POLICY "Permissions update for gestionar_permisos" ON permissions
  FOR UPDATE USING (has_permission(auth.uid(), 'gestionar_permisos'));
CREATE POLICY "Permissions delete for gestionar_permisos" ON permissions
  FOR DELETE USING (has_permission(auth.uid(), 'gestionar_permisos'));

CREATE POLICY "Role permissions select for gestionar_roles" ON role_permissions
  FOR SELECT USING (has_permission(auth.uid(), 'gestionar_roles'));
CREATE POLICY "Role permissions insert for gestionar_roles" ON role_permissions
  FOR INSERT WITH CHECK (has_permission(auth.uid(), 'gestionar_roles'));
CREATE POLICY "Role permissions delete for gestionar_roles" ON role_permissions
  FOR DELETE USING (has_permission(auth.uid(), 'gestionar_roles'));

CREATE POLICY "User roles select for gestionar_roles" ON user_roles
  FOR SELECT USING (has_permission(auth.uid(), 'gestionar_roles'));
CREATE POLICY "User roles insert for gestionar_roles" ON user_roles
  FOR INSERT WITH CHECK (has_permission(auth.uid(), 'gestionar_roles'));
CREATE POLICY "User roles delete for gestionar_roles" ON user_roles
  FOR DELETE USING (has_permission(auth.uid(), 'gestionar_roles'));

-- ---------------------------------------------------------------------------
-- 1.4 Seed data: Roles y Permisos
-- ---------------------------------------------------------------------------
INSERT INTO roles (name, description) VALUES
  ('Jugador', 'Jugador del club — puede confirmar asistencia a convocatorias'),
  ('Tecnico', 'Cuerpo técnico — gestiona jugadores, partidos y convocatorias'),
  ('Dirigente', 'Dirigente del club — acceso completo a la administración')
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (name, description, code) VALUES
  ('Ver Admin', 'Acceder al panel de administración', 'ver_admin'),
  ('Gestionar Jugadores', 'Crear, editar y eliminar jugadores', 'gestionar_jugadores'),
  ('Gestionar Partidos', 'Crear, editar y eliminar partidos', 'gestionar_partidos'),
  ('Gestionar Sponsors', 'Crear, editar y eliminar sponsors', 'gestionar_sponsors'),
  ('Gestionar Beneficios', 'Crear, editar y eliminar beneficios', 'gestionar_beneficios'),
  ('Gestionar Roles', 'Crear, editar y eliminar roles y asignarlos a usuarios', 'gestionar_roles'),
  ('Gestionar Permisos', 'Crear, editar y eliminar permisos', 'gestionar_permisos'),
  ('Tomar Asistencia', 'Registrar asistencia a entrenamientos y partidos', 'tomar_asistencia'),
  ('Realizar Convocatoria', 'Crear y enviar convocatorias a jugadores', 'realizar_convocatoria'),
  ('Confirmar Asistencia', 'Confirmar asistencia a convocatorias', 'confirmar_asistencia')
ON CONFLICT (code) DO NOTHING;

-- Dirigente: ALL permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'Dirigente'
ON CONFLICT DO NOTHING;

-- Tecnico: ver_admin, gestionar_jugadores, gestionar_partidos, tomar_asistencia, realizar_convocatoria
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'Tecnico' AND p.code IN ('ver_admin', 'gestionar_jugadores', 'gestionar_partidos', 'tomar_asistencia', 'realizar_convocatoria')
ON CONFLICT DO NOTHING;

-- Jugador: confirmar_asistencia
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'Jugador' AND p.code = 'confirmar_asistencia'
ON CONFLICT DO NOTHING;


-- =============================================================================
-- PARTE 2: TABLAS DE LA APP
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 2.1 CATEGORÍAS
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
CREATE POLICY "RBAC manage categorías" ON categorias
  FOR ALL USING (has_permission(auth.uid(), 'gestionar_jugadores'));

-- ---------------------------------------------------------------------------
-- 2.2 JUGADORES
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
CREATE POLICY "RBAC manage jugadores" ON jugadores
  FOR ALL USING (has_permission(auth.uid(), 'gestionar_jugadores'));

CREATE OR REPLACE FUNCTION update_jugadores_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_jugadores_updated_at BEFORE UPDATE ON jugadores
  FOR EACH ROW EXECUTE FUNCTION update_jugadores_updated_at();

-- ---------------------------------------------------------------------------
-- 2.3 FOTOS DE JUGADORES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS jugador_fotos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  jugador_id UUID REFERENCES jugadores(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE jugador_fotos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fotos públicas" ON jugador_fotos FOR SELECT USING (true);
CREATE POLICY "RBAC manage fotos" ON jugador_fotos
  FOR ALL USING (has_permission(auth.uid(), 'gestionar_jugadores'));

-- ---------------------------------------------------------------------------
-- 2.4 RIVALES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rivales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  escudo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE rivales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rivales públicos" ON rivales FOR SELECT USING (true);
CREATE POLICY "RBAC manage rivales" ON rivales
  FOR ALL USING (has_permission(auth.uid(), 'gestionar_partidos'));

-- ---------------------------------------------------------------------------
-- 2.5 PARTIDOS
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

CREATE POLICY "Partidos públicos" ON partidos FOR SELECT USING (is_active = true);
CREATE POLICY "RBAC manage partidos" ON partidos
  FOR ALL USING (has_permission(auth.uid(), 'gestionar_partidos'));

CREATE OR REPLACE FUNCTION update_partidos_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_partidos_updated_at BEFORE UPDATE ON partidos
  FOR EACH ROW EXECUTE FUNCTION update_partidos_updated_at();

-- ---------------------------------------------------------------------------
-- 2.6 SPONSORS
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

CREATE POLICY "Sponsors públicos" ON sponsors FOR SELECT USING (is_active = true);
CREATE POLICY "RBAC manage sponsors" ON sponsors
  FOR ALL USING (has_permission(auth.uid(), 'gestionar_sponsors'));

CREATE OR REPLACE FUNCTION update_sponsors_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_sponsors_updated_at BEFORE UPDATE ON sponsors
  FOR EACH ROW EXECUTE FUNCTION update_sponsors_updated_at();

-- ---------------------------------------------------------------------------
-- 2.7 SPONSOR IMAGES
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

CREATE POLICY "Sponsor images públicas" ON sponsor_images FOR SELECT USING (true);
CREATE POLICY "RBAC manage sponsor images" ON sponsor_images
  FOR ALL USING (has_permission(auth.uid(), 'gestionar_sponsors'));

-- ---------------------------------------------------------------------------
-- 2.8 NOTICIAS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS noticias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE noticias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Noticias públicas" ON noticias FOR SELECT USING (true);
CREATE POLICY "RBAC manage noticias" ON noticias
  FOR ALL USING (has_permission(auth.uid(), 'gestionar_beneficios'));

CREATE OR REPLACE FUNCTION update_noticias_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_noticias_updated_at BEFORE UPDATE ON noticias
  FOR EACH ROW EXECUTE FUNCTION update_noticias_updated_at();

-- ---------------------------------------------------------------------------
-- 2.9 BENEFICIOS
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

CREATE POLICY "Beneficios públicos" ON beneficios FOR SELECT USING (is_active = true);
CREATE POLICY "RBAC insert beneficios" ON beneficios
  FOR INSERT WITH CHECK (has_permission(auth.uid(), 'gestionar_beneficios'));
CREATE POLICY "RBAC update beneficios" ON beneficios
  FOR UPDATE USING (has_permission(auth.uid(), 'gestionar_beneficios'));
CREATE POLICY "RBAC delete beneficios" ON beneficios
  FOR DELETE USING (has_permission(auth.uid(), 'gestionar_beneficios'));

CREATE OR REPLACE FUNCTION update_beneficios_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_beneficios_updated_at BEFORE UPDATE ON beneficios
  FOR EACH ROW EXECUTE FUNCTION update_beneficios_updated_at();

-- ---------------------------------------------------------------------------
-- 2.10 FEATURE FLAGS
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

CREATE POLICY "Feature flags públicos" ON feature_flags FOR SELECT USING (true);
CREATE POLICY "RBAC manage feature flags" ON feature_flags
  FOR ALL USING (has_permission(auth.uid(), 'gestionar_roles'));

-- ---------------------------------------------------------------------------
-- 2.11 PROFILES (asegurar que existe con los campos necesarios)
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

-- Storage policies para imágenes
INSERT INTO storage.buckets (id, name, public) VALUES ('sponsors', 'sponsors', true)
ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('jugadores', 'jugadores', true)
ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('escudos', 'escudos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS policies
DO $$
BEGIN
  -- sponsors
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read for sponsors') THEN
    CREATE POLICY "Public read for sponsors" ON storage.objects FOR SELECT USING (bucket_id = 'sponsors');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon upload for sponsors') THEN
    CREATE POLICY "Anon upload for sponsors" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'sponsors');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon delete for sponsors') THEN
    CREATE POLICY "Anon delete for sponsors" ON storage.objects FOR DELETE USING (bucket_id = 'sponsors');
  END IF;

  -- jugadores
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read for jugadores') THEN
    CREATE POLICY "Public read for jugadores" ON storage.objects FOR SELECT USING (bucket_id = 'jugadores');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon upload for jugadores') THEN
    CREATE POLICY "Anon upload for jugadores" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'jugadores');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon delete for jugadores') THEN
    CREATE POLICY "Anon delete for jugadores" ON storage.objects FOR DELETE USING (bucket_id = 'jugadores');
  END IF;

  -- escudos
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

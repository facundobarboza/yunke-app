-- =============================================================================
-- MIGRATION: Agregar campos faltantes a profiles
-- =============================================================================
-- Agrega nombre, apellido, telefono y dni a la tabla profiles.
-- También actualiza el trigger para copiar datos del registro.

-- Agregar columnas faltantes
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nombre TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS apellido TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telefono TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dni TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_socio BOOLEAN DEFAULT false;

-- Actualizar el trigger para copiar nombre y apellido del registro
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nombre, apellido)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'nombre',
    NEW.raw_user_meta_data->>'apellido'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

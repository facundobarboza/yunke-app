-- =============================================================================
-- MIGRATION: Crear tabla beneficios
-- =============================================================================
-- Ejecutar en el SQL Editor de Supabase (Dashboard > SQL Editor)

-- 1. Crear tabla beneficios
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

-- 2. Habilitar RLS
ALTER TABLE beneficios ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de acceso
-- Cualquiera puede ver beneficios activos
CREATE POLICY "Beneficios públicos" ON beneficios
  FOR SELECT USING (is_active = true);

-- Solo admins pueden gestionar
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

-- 4. Trigger para updated_at
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

-- 5. Insertar datos de prueba (los que estaban hardcodeados)
INSERT INTO beneficios (tienda, descuento, detalle, icono, orden) VALUES
  ('Amor FARRR', '20% OFF', 'En todas las hamburguesas y pizzas los días de partido.', 'fast-food-outline', 1),
  ('Sport Center', '15% OFF', 'En compra de indumentaria deportiva y calzado.', 'shirt-outline', 2),
  ('Bar El Club', '2x1 en Cervezas', 'Presentando tu carnet digital de socio.', 'beer-outline', 3),
  ('Ferretería Don Tornillo', '10% OFF', 'En todos los artículos de ferretería y pinturería.', 'build-outline', 4),
  ('Clínica Dental Yunke', 'Limpieza Gratis', 'Una limpieza dental anual sin cargo para socios.', 'medkit-outline', 5);

-- =============================================================================
-- MIGRATION: Create asistencias table for attendance tracking
-- =============================================================================
-- Creates the asistencias table with RLS policies using has_permission()
-- for the 'tomar_asistencia' permission code.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Create asistencias table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS asistencias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  jugador_id UUID REFERENCES jugadores(id) ON DELETE CASCADE,
  categoria_id INTEGER REFERENCES categorias(id),
  fecha DATE NOT NULL,
  presente BOOLEAN DEFAULT false,
  notas TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(jugador_id, fecha)
);

-- ---------------------------------------------------------------------------
-- 2. Enable Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 3. RLS Policies
-- ---------------------------------------------------------------------------
-- All authenticated users can read attendance records
CREATE POLICY "Asistencias select for authenticated" ON asistencias
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only users with 'tomar_asistencia' permission can insert
CREATE POLICY "Asistencias insert for tomar_asistencia" ON asistencias
  FOR INSERT WITH CHECK (has_permission(auth.uid(), 'tomar_asistencia'));

-- Only users with 'tomar_asistencia' permission can update
CREATE POLICY "Asistencias update for tomar_asistencia" ON asistencias
  FOR UPDATE USING (has_permission(auth.uid(), 'tomar_asistencia'));

-- Only users with 'tomar_asistencia' permission can delete
CREATE POLICY "Asistencias delete for tomar_asistencia" ON asistencias
  FOR DELETE USING (has_permission(auth.uid(), 'tomar_asistencia'));

-- ---------------------------------------------------------------------------
-- 4. Trigger to auto-update updated_at on row modification
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_asistencias_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_asistencias_updated_at
  BEFORE UPDATE ON asistencias
  FOR EACH ROW
  EXECUTE FUNCTION update_asistencias_updated_at();

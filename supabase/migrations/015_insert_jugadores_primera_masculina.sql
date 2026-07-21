-- =============================================================================
-- MIGRATION: Insertar jugadores reales — Primera Masculina (categoría 1)
-- =============================================================================
-- ATENCIÓN: Este script TRUNCATE la tabla jugadores y reinserta solo los
-- jugadores de Primera Masculina con datos reales.
-- Los datos de prueba de otras categorías se pierden (re-ejecutar seed.sql
-- si los necesitás).
-- =============================================================================

-- Limpiar jugadores existentes
TRUNCATE TABLE jugadores CASCADE;

-- Insertar jugadores de Primera Masculina (categoria_id = 1)
INSERT INTO jugadores (nombre, apellido, fecha_nacimiento, categoria_id, is_active) VALUES
  ('Franco Daniel', 'Jarapa', '1999-04-07', 1, true),
  ('Emiliano', 'Echevarne', '2000-11-24', 1, true),
  ('Facundo', 'Moran', '2005-04-21', 1, true),
  ('Nicolas', 'Mondre', '1995-03-13', 1, true),
  ('Rodrigo Nicolas', 'Rangol Amieva', '2001-04-18', 1, true),
  ('Luciano', 'Perea', '1999-04-07', 1, true),
  ('Jorge', 'Miranda', '2000-01-02', 1, true),
  ('Marcos Ezequiel', 'Sosa', '1995-09-14', 1, true),
  ('Claudio Tomás', 'Brito', '1999-07-22', 1, true),
  ('Mauro', 'Romero', '1999-10-03', 1, true),
  ('Fabricio Ariel', 'Peña', '2000-01-10', 1, true),
  ('Abel', 'Ortega', '2001-11-19', 1, true),
  ('Mateo Lucas', 'Romero', '2008-01-04', 1, true),
  ('Matias Gabriel', 'Perez', '2010-11-27', 1, true),
  ('Nicolas', 'Maturuno', '2010-04-30', 1, true),
  ('Uriel', 'Rossa', '2007-05-16', 1, true),
  ('Braiam Nicolás', 'Lucero', '2000-01-24', 1, true),
  ('Brayan Alejandro', 'Paredes', '1999-01-30', 1, true),
  ('Flavio Nahuel', 'Palacio', '1997-12-05', 1, true),
  ('Nicolás Darío', 'Moyano', '2001-02-22', 1, true),
  ('Hector David', 'Velazquez', '1995-03-10', 1, true),
  ('Mateo Mariano', 'Rosales Velázquez', '2003-08-24', 1, true),
  ('Emir Uriel', 'Guzmán', '2000-12-13', 1, true),
  ('Brayam Ismael', 'Baigorria Correa', '1998-12-27', 1, true),
  ('Fernando', 'Miranda', '1995-08-24', 1, true),
  ('Pablo Agustín', 'Abaurre', '2001-05-10', 1, true);

-- =============================================================================
-- NOTA: Los campos dorsal, posicion, instagram, descripcion y foto_url quedan
-- vacíos. Se pueden completar después desde la app de admin.
-- =============================================================================

-- =============================================================================
-- MIGRATION: Insertar jugadores reales — Primera Femenina (categoría 2)
-- =============================================================================
-- NOTA: Solo INSERT, NO TRUNCATE. Los jugadores de Primera Masculina se
-- mantienen intactos.
-- =============================================================================

INSERT INTO jugadores (nombre, apellido, fecha_nacimiento, categoria_id, is_active) VALUES
  ('Dahyana Anabela', 'Arce', '1993-09-02', 2, true),
  ('Eliana', 'Villegas', '1998-04-14', 2, true),
  ('Natasha', 'Oviedo', '1996-10-24', 2, true),
  ('Araceli Daiana', 'Tapia', '1994-07-25', 2, true),
  ('Ariana', 'Valliz', '1999-12-26', 2, true),
  ('Estefania Antonella', 'Lopez', '2006-02-06', 2, true),
  ('Sofía Agostina', 'Aguero', '1999-12-15', 2, true),
  ('Gisella Joana', 'Orozco', '1990-06-23', 2, true),
  ('Yanet Milagros', 'Peralta Carmeno', '2003-11-19', 2, true),
  ('Paine', 'Ramos', '1991-01-02', 2, true),
  ('Ana Paula', 'Moreira Sosa', '2007-07-31', 2, true),
  ('Dayana Damaris', 'Díaz', '2004-12-20', 2, true),
  ('Yamila Desree', 'Orozco', '1994-04-23', 2, true),
  ('Ariana Ludmila', 'Godoy Mesa', '2006-06-14', 2, true),
  ('Melina Gianella', 'Aguilar', '2002-03-07', 2, true),
  ('Priscila', 'Albornoz', '2004-12-12', 2, true),
  ('Sonia', 'Garro', '2000-10-25', 2, true),
  ('Fernanda', 'Quiroga', '2006-06-06', 2, true),
  ('Pamela', 'Perez', '2001-01-30', 2, true);

-- =============================================================================
-- NOTA: Los campos dorsal, posicion, instagram, descripcion y foto_url quedan
-- vacíos. Se pueden completar después desde la app de admin.
-- =============================================================================

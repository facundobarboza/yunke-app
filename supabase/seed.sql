-- =============================================================================
-- SEED: Club Yunke — Datos de prueba
-- =============================================================================
-- Ejecutar en el SQL Editor de Supabase (Dashboard > SQL Editor)
--
-- ATENCIÓN: Este script hace TRUNCATE de todas las tablas.
-- Los datos existentes se perderán.
-- =============================================================================

-- 0. CATEGORÍAS (ya existen, pero las reseedeamos para tener control)
TRUNCATE TABLE categorias CASCADE;
ALTER SEQUENCE categorias_id_seq RESTART WITH 1;

INSERT INTO categorias (nombre, orden) VALUES
  ('Primera Masculina', 1),
  ('Primera Femenina', 2),
  ('Sub 17 Masculina', 3),
  ('Sub 17 Femenina', 4),
  ('Sub 15 Masculina', 5),
  ('Sub 15 Femenina', 6),
  ('Formativa', 7);

-- 1. JUGADORES
TRUNCATE TABLE jugadores CASCADE;

INSERT INTO jugadores (nombre, apellido, dorsal, posicion, fecha_nacimiento, nacionalidad, instagram, descripcion, categoria_id) VALUES
  -- Primera Masculina (categoria_id = 1)
  ('Lautaro', 'Méndez', 1, 'Arquero', '1994-03-15', 'Argentina', 'lautimendez', 'Arquero de gran envergadura y reflejos felinos. Formado en las inferiores del club, es un referente del equipo.', 1),
  ('Facundo', 'Olivera', 12, 'Arquero', '1996-07-22', 'Argentina', 'facuolivera', 'Arquero eléctrico, excelente en el uno contra uno. Llegó al club en 2022.', 1),
  ('Matías', 'Correa', 2, 'Cierre', '1995-11-08', 'Argentina', 'matcorrea', 'Cierre de experiencia, líder de la defensa. Inteligente para leer el juego.', 1),
  ('Ignacio', 'Roldán', 4, 'Cierre', '1997-02-14', 'Argentina', 'nachoroldan', 'Cierre veloz con buena salida de pelota. Puede jugar también de ala.', 1),
  ('Tomás', 'Sosa', 3, 'Cierre', '1998-09-30', 'Argentina', 'tomisosa', 'Juvenil con proyección. Fuerte en el juego aéreo y recuperación.', 1),
  ('Santiago', 'López', 5, 'Ala', '1993-04-18', 'Argentina', 'santilopez', 'Ala zurdo con gran pegada. Dueño de la pelota parada.', 1),
  ('Nicolás', 'Martínez', 7, 'Ala', '1994-12-03', 'Argentina', 'nicomartinez', 'Ala derecho explosivo, desequilibrante en el uno contra uno.', 1),
  ('Luciano', 'Giménez', 10, 'Ala', '1996-05-27', 'Argentina', 'luchogimenez', 'Enganche creativo, visión de juego excepcional. El cerebro del equipo.', 1),
  ('Julián', 'Álvarez', 8, 'Ala', '1997-08-14', 'Argentina', 'julialvarez', 'Ala polifuncional, puede jugar en ambas bandas. Gran sacrificio defensivo.', 1),
  ('Franco', 'Díaz', 9, 'Pivot', '1992-06-21', 'Argentina', 'francodia', 'Pivot de área, goleador histórico del club. Aguantador y letal en el gol.', 1),
  ('Agustín', 'Pereyra', 11, 'Pivot', '1995-10-05', 'Argentina', 'aguspereyra', 'Pivot móvil, asocia y define. Inteligente para jugar de espaldas.', 1),
  ('Bruno', 'Castillo', 6, 'Ala', '1998-01-19', 'Argentina', 'brunocastillo', 'Juvenil que se ganó el puesto. Dinámico y con buen cambio de ritmo.', 1),

  -- Primera Femenina (categoria_id = 2)
  ('Emiliana', 'Ríos', 1, 'Arquera', '1999-03-10', 'Argentina', 'emirios', 'Arquera joven con buena técnica de pies. Promesa del club.', 2),
  ('Gabriela', 'Acosta', 4, 'Cierre', '2000-07-15', 'Argentina', 'gabiacosta', 'Cierre firme, buen anticipo. Capitana de la primera.', 2),
  ('Hernana', 'Moreno', 2, 'Cierre', '2000-11-28', 'Argentina', 'hernanmoreno', 'Central con buena salida. Puede jugar como líbero.', 2),
  ('Diega', 'Riquelme', 10, 'Ala', '1999-05-06', 'Argentina', 'diegoriquelme', 'Mediapunta talentosa, gambeteadora.', 2),
  ('Martina', 'Palermo', 9, 'Pivot', '1998-12-12', 'Argentina', 'martinapalermo', 'Pivot de área, oportunista. Goleadora del equipo.', 2),
  ('Leonora', 'Ponzio', 8, 'Ala', '2000-04-22', 'Argentina', 'leonoraponzio', 'Ala de ida y vuelta, incansable. Pulmón del equipo.', 2),
  ('Pabla', 'Aimar', 5, 'Ala', '2001-09-17', 'Argentina', 'pablaaimar', 'Zurda habilidosa, picante. Desequilibra por izquierda.', 2),
  ('Lucas', 'Vidal', 3, 'Cierre', '1999-08-03', 'Argentina', 'lucasvidal', 'Marcador rústico, fuerte en la marca. Difícil de superar.', 2),
  ('Julieta', 'Mansilla', 11, 'Ala', '2000-02-14', 'Argentina', 'julimansilla', 'Ala rápida, desborda constantemente. Joya de la cantera.', 2),
  ('Ramira', 'Funes', 12, 'Arquera', '2001-11-30', 'Argentina', 'ramirafunes', 'Arquera alta, buen juego aéreo. En desarrollo.', 2),

  -- Sub 17 Masculina (categoria_id = 3)
  ('Fabricio', 'Luna', 1, 'Arquero', '2007-08-19', 'Argentina', 'fabricioluna', 'Arquero ágil, buenos reflejos. Destaca en penales.', 3),
  ('Bautista', 'Ávalos', 4, 'Cierre', '2008-03-12', 'Argentina', 'bautiavalos', 'Cierre sereno, buen manejo de balón. Líder defensivo.', 3),
  ('Lautaro', 'Díaz', 10, 'Ala', '2007-11-05', 'Argentina', 'lautarodiaz', 'Diez clásico, gambeta y visión. Muy técnico.', 3),
  ('Felipe', 'Torres', 9, 'Pivot', '2008-06-18', 'Argentina', 'felipetorres', 'Goleador nato, olfato de gol. Máximo artillero.', 3),
  ('Nahuel', 'Godoy', 7, 'Ala', '2007-02-28', 'Argentina', 'nahuelgodoy', 'Extremo rápido, desbordante. Asiste y define.', 3),
  ('Tomás', 'Vega', 2, 'Cierre', '2008-09-14', 'Argentina', 'tomasvega', 'Defensor firme, buen juego aéreo. Corporalmente fuerte.', 3),

  -- Sub 17 Femenina (categoria_id = 4)
  ('Santina', 'Muñoz', 1, 'Arquera', '2008-08-19', 'Argentina', 'santinamunoz', 'Arquera ágil, buenos reflejos.', 4),
  ('Bautista', 'Ávalos', 4, 'Cierre', '2008-03-12', 'Argentina', 'bautiavalos', 'Cierre sereno, buena marcadora.', 4),
  ('Lautara', 'Díaz', 10, 'Ala', '2008-11-05', 'Argentina', 'lautaradiaz', 'Diez clásica, gambeta y visión.', 4),
  ('Felipa', 'Torres', 9, 'Pivot', '2009-06-18', 'Argentina', 'felipatorres', 'Goleadora nata, olfato de gol.', 4),

  -- Sub 15 Masculina (categoria_id = 5)
  ('Luciano', 'Arias', 10, 'Ala', '2010-05-20', 'Argentina', 'lucianoarias', 'Talentoso zurdo, pegada fina. Promesa a seguir.', 5),
  ('Emiliano', 'Coronel', 1, 'Arquero', '2011-01-15', 'Argentina', 'emicoronel', 'Arquero alto, buena estirada. Reflejos felinos.', 5),
  ('Franco', 'Mendoza', 9, 'Pivot', '2010-08-07', 'Argentina', 'francomendoza', 'Pivot con buena técnica, asocia bien. Inteligente.', 5),
  ('Ignacio', 'Peralta', 4, 'Cierre', '2011-04-22', 'Argentina', 'nachoperalta', 'Cierre ordenado, buen despliegue. Maduro para su edad.', 5),
  ('Valentín', 'Barrios', 11, 'Ala', '2010-12-01', 'Argentina', 'valentinbarrios', 'Veloz, encara siempre. Desequilibrante.', 5),
  ('Thiago', 'Morel', 7, 'Ala', '2011-07-30', 'Argentina', 'thiagomorel', 'Habilidoso, gambeteador. Alegría en la cancha.', 5),

  -- Sub 15 Femenina (categoria_id = 6)
  ('Luciana', 'Arias', 10, 'Ala', '2011-05-20', 'Argentina', 'lucianaarias', 'Talentosa zurda, pegada fina.', 6),
  ('Emiliana', 'Coronel', 1, 'Arquera', '2012-01-15', 'Argentina', 'emicoronel', 'Arquera alta, buena estirada.', 6),
  ('Franca', 'Mendoza', 9, 'Pivot', '2011-08-07', 'Argentina', 'francamendoza', 'Pivot con buena técnica, asocia bien.', 6),
  ('Valentina', 'Barrios', 11, 'Ala', '2011-12-01', 'Argentina', 'valentinabarrios', 'Veloz, encara siempre. Desequilibrante.', 6),

  -- Formativa (categoria_id = 7)
  ('Benjamín', 'Álvarez', 10, 'Ala', '2013-03-15', 'Argentina', 'benjaalvarez', 'Zurdo talentoso. Categoría 2013.', 7),
  ('Sofía', 'López', 7, 'Ala', '2014-06-22', 'Argentina', 'sofialopez', 'Habilidosa, alegría en la cancha.', 7),
  ('Mateo', 'García', 9, 'Pivot', '2013-11-08', 'Argentina', 'mateogarcia', 'Goleador. Categoría 2013.', 7);

-- 2. FOTOS DE JUGADORES
TRUNCATE TABLE jugador_fotos;

INSERT INTO jugador_fotos (url, jugador_id) VALUES
  ('https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&q=80', (SELECT id FROM jugadores WHERE nombre = 'Lautaro' AND apellido = 'Méndez')),
  ('https://images.unsplash.com/photo-1570297098995-5a31b5e0a223?w=400&q=80', (SELECT id FROM jugadores WHERE nombre = 'Facundo' AND apellido = 'Olivera')),
  ('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', (SELECT id FROM jugadores WHERE nombre = 'Franco' AND apellido = 'Díaz')),
  ('https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80', (SELECT id FROM jugadores WHERE nombre = 'Santiago' AND apellido = 'López')),
  ('https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80', (SELECT id FROM jugadores WHERE nombre = 'Luciano' AND apellido = 'Giménez')),
  ('https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80', (SELECT id FROM jugadores WHERE nombre = 'Emiliana' AND apellido = 'Ríos')),
  ('https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80', (SELECT id FROM jugadores WHERE nombre = 'Gabriela' AND apellido = 'Acosta'));

-- 3. SPONSORS
TRUNCATE TABLE sponsors CASCADE;

INSERT INTO sponsors (nombre, descripcion, nivel, horarios, direccion, telefono, web_url, instagram, facebook, orden) VALUES
  (
    'Deportes Sport Center',
    'Tienda especializada en indumentaria y calzado deportivo. Sponsor oficial de la indumentaria del club.',
    'Oficial',
    'Lun a Sab 9:00-21:00 — Dom 10:00-18:00',
    'Av. Colón 1234, Córdoba',
    '+54 351 423-5678',
    'https://sportcenter.example.com',
    'https://instagram.com/sportcenterok',
    'https://facebook.com/sportcenterok',
    1
  ),
  (
    'Amor Fast Food',
    'Las mejores hamburguesas y pizzas de la zona. Show en vivo los fines de semana.',
    'Oficial',
    'Lun a Dom 11:00-02:00',
    'Av. Recta Martinoli 567, Córdoba',
    '+54 351 434-9012',
    'https://amorfood.example.com',
    'https://instagram.com/amorfood',
    'https://facebook.com/amorfood',
    2
  ),
  (
    'Bar El Club',
    'Tradicional bar del barrio. Cerveza tirada, picadas y pantalla gigante.',
    'Auspiciante',
    'Lun a Dom 8:00-01:00',
    'Belgrano 890, Córdoba',
    '+54 351 445-3456',
    null,
    'https://instagram.com/barclubok',
    null,
    3
  ),
  (
    'Ferretería Don Tornillo',
    'Ferretería industrial y del hogar. Pinturería, herramientas, sanitarios.',
    'Auspiciante',
    'Lun a Vie 8:00-19:00 — Sab 8:00-13:00',
    'San Martín 345, Córdoba',
    '+54 351 456-7890',
    'https://dontornillo.example.com',
    'https://instagram.com/dontornillook',
    'https://facebook.com/dontornillook',
    4
  ),
  (
    'Clínica Dental Yunke',
    'Odontología general y estética. Atención preferencial a socios.',
    'Auspiciante',
    'Lun a Vie 9:00-20:00 — Sab 9:00-13:00',
    '25 de Mayo 678, Córdoba',
    '+54 351 467-1234',
    'https://dentalyunke.example.com',
    'https://instagram.com/dentalyunke',
    null,
    5
  ),
  (
    'Lavadero Ola',
    'Lavado de autos ecológico. Tapizados, pulido, encerado. Servicio a domicilio.',
    'Colaborador',
    'Lun a Sab 8:00-20:00',
    'Av. Patria 234, Córdoba',
    '+54 351 478-5678',
    null,
    'https://instagram.com/lavadero.ola',
    null,
    6
  );

-- 4. PARTIDOS
TRUNCATE TABLE partidos CASCADE;

INSERT INTO partidos (fecha, rival, es_local, competicion, categoria_id, resultado_local, resultado_visitante, jugado) VALUES
  -- Partidos ya jugados (Primera Masculina)
  ('2026-02-15 20:00:00-03', 'Sportivo Belgrano', true, 'Liga Cordobesa de Futsal', 1, 4, 2, true),
  ('2026-02-22 19:30:00-03', 'Atlético Carlos Paz', false, 'Liga Cordobesa de Futsal', 1, 1, 3, true),
  ('2026-03-01 21:00:00-03', 'Banfield Futsal', true, 'Liga Cordobesa de Futsal', 1, 2, 2, true),
  ('2026-03-15 19:00:00-03', 'Instituto ACC', true, 'Liga Cordobesa de Futsal', 1, 5, 0, true),
  ('2026-04-05 19:00:00-03', 'Belgrano Futsal', true, 'Copa Córdoba', 1, 6, 2, true),
  ('2026-04-19 21:00:00-03', 'Las Palmas', true, 'Liga Cordobesa de Futsal', 1, 3, 1, true),

  -- Partidos ya jugados (Primera Femenina)
  ('2026-02-16 20:00:00-03', 'Las Águilas', true, 'Liga Cordobesa Femenina', 2, 3, 1, true),
  ('2026-03-02 19:30:00-03', 'Universitario', false, 'Liga Cordobesa Femenina', 2, 0, 0, true),
  ('2026-03-22 20:30:00-03', 'Talleres Femenino', false, 'Liga Cordobesa Femenina', 2, 2, 4, true),
  ('2026-04-12 20:00:00-03', 'General Paz Juniors', false, 'Liga Cordobesa Femenina', 2, 1, 1, true),
  ('2026-04-26 19:30:00-03', 'Racing Femenino', false, 'Liga Cordobesa Femenina', 2, 4, 3, true),

  -- Partidos ya jugados (Sub 17 Masculina)
  ('2026-03-08 20:00:00-03', 'Racing de Nueva Italia', false, 'Torneo Juvenil', 3, 3, 1, true),
  ('2026-04-02 18:00:00-03', 'Instituto Sub 17', true, 'Torneo Juvenil', 3, 2, 0, true),

  -- Partidos próximos (Primera Masculina)
  ('2026-07-04 20:00:00-03', 'Atlético Carlos Paz', true, 'Liga Cordobesa de Futsal', 1, null, null, false),
  ('2026-07-11 19:30:00-03', 'Sportivo Belgrano', false, 'Liga Cordobesa de Futsal', 1, null, null, false),
  ('2026-08-01 20:00:00-03', 'Racing de Nueva Italia', true, 'Copa Córdoba', 1, null, null, false),
  ('2026-08-08 19:00:00-03', 'Instituto ACC', false, 'Liga Cordobesa de Futsal', 1, null, null, false),

  -- Partidos próximos (Primera Femenina)
  ('2026-07-05 20:00:00-03', 'Las Águilas', false, 'Liga Cordobesa Femenina', 2, null, null, false),
  ('2026-07-18 21:00:00-03', 'General Paz Juniors', true, 'Liga Cordobesa Femenina', 2, null, null, false),
  ('2026-08-15 20:30:00-03', 'Talleres Femenino', true, 'Liga Cordobesa Femenina', 2, null, null, false),

  -- Partidos próximos (Sub 17 Masculina)
  ('2026-07-12 18:00:00-03', 'Belgrano Sub 17', true, 'Torneo Juvenil', 3, null, null, false),

  -- Partidos próximos (Sub 17 Femenina)
  ('2026-07-13 18:00:00-03', 'Las Palmas Sub 17', true, 'Torneo Juvenil Femenino', 4, null, null, false);

-- 5. NOTICIAS
TRUNCATE TABLE noticias CASCADE;

INSERT INTO noticias (titulo, contenido, created_at) VALUES
  (
    'Yunke goleó a Instituto en el clásico',
    'El equipo dirigido por DT González venció 5-0 a Instituto ACC en un partido impecable. Franco Díaz fue la figura con un doblete. El equipo se afianza en la punta de la Liga Cordobesa de Futsal con una actuación sólida.',
    '2026-03-15 23:30:00-03'
  ),
  (
    'Nuevos sponsors para la temporada 2026',
    'El Club Yunke sumó nuevos sponsors para esta temporada. Sport Center será el proveedor oficial de indumentaria, y se suman Clínica Dental Yunke y Lavadero Ola como sponsors oficiales.',
    '2026-03-10 10:00:00-03'
  ),
  (
    'Se viene el torneo de verano de futsal',
    'El club organiza el Torneo de Verano 2026 con más de 20 equipos participantes. Las categorías Sub 15, Sub 17 y Primera competirán desde enero. Las inscripciones ya están abiertas.',
    '2026-01-15 14:00:00-03'
  ),
  (
    'Las inferiores arrasan en el Provincial',
    'Nuestras divisiones Sub 17 y Sub 15 se consagraron campeonas del Torneo Provincial de Futsal disputado en Villa María. Gran actuación de los juveniles.',
    '2025-12-10 18:00:00-03'
  ),
  (
    'El femenino sigue imparable',
    'La Primera Femenina continúa su racha invicta en la Liga Cordobesa. Las dirigidas por DT Martínez llevan 8 partidos sin perder.',
    '2026-04-27 10:00:00-03'
  );

-- =============================================================================
-- VERIFICACIÓN
-- =============================================================================
-- Correr esto después del seed:
--
--   SELECT 'categorias' as tabla, count(*) as registros FROM categorias
--   UNION ALL
--   SELECT 'jugadores', count(*) FROM jugadores
--   UNION ALL
--   SELECT 'jugador_fotos', count(*) FROM jugador_fotos
--   UNION ALL
--   SELECT 'sponsors', count(*) FROM sponsors
--   UNION ALL
--   SELECT 'partidos', count(*) FROM partidos
--   UNION ALL
--   SELECT 'noticias', count(*) FROM noticias
--   ORDER BY tabla;

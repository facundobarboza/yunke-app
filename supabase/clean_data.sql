-- =============================================================================
-- CLEAN: Borrar todos los datos (mantener estructura)
-- =============================================================================
-- Ejecutar en el SQL Editor de Supabase antes de cargar datos reales.
-- NO borra tablas, solo limpia los registros.
-- NO toca auth.users ni profiles.
-- =============================================================================

-- Resetear datos en orden inverso de dependencias
TRUNCATE TABLE beneficios CASCADE;
TRUNCATE TABLE noticias CASCADE;
TRUNCATE TABLE partidos CASCADE;
TRUNCATE TABLE sponsor_images CASCADE;
TRUNCATE TABLE sponsors CASCADE;
TRUNCATE TABLE jugador_fotos CASCADE;
TRUNCATE TABLE jugadores CASCADE;
TRUNCATE TABLE categorias CASCADE;

-- Resetear sequences para que empiecen en 1
ALTER SEQUENCE categorias_id_seq RESTART WITH 1;

-- =============================================================================
-- VERIFICACIÓN
-- =============================================================================
SELECT 'categorias' as tabla, count(*) as registros FROM categorias
UNION ALL
SELECT 'jugadores', count(*) FROM jugadores
UNION ALL
SELECT 'jugador_fotos', count(*) FROM jugador_fotos
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
ORDER BY tabla;

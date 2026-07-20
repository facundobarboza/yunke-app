-- =============================================================================
-- MIGRATION: Seed data para el sistema RBAC
-- =============================================================================
-- Roles por defecto, permisos y mapeo rol-permiso.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Roles por defecto
-- ---------------------------------------------------------------------------
INSERT INTO roles (name, description) VALUES
  ('Jugador', 'Jugador del club — puede confirmar asistencia a convocatorias'),
  ('Tecnico', 'Cuerpo técnico — gestiona jugadores, partidos y convocatorias'),
  ('Dirigente', 'Dirigente del club — acceso completo a la administración')
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Permisos por defecto
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Role-Permission mappings
-- ---------------------------------------------------------------------------

-- Dirigente: ALL permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Dirigente'
ON CONFLICT DO NOTHING;

-- Tecnico: ver_admin, gestionar_jugadores, gestionar_partidos, tomar_asistencia, realizar_convocatoria
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Tecnico'
  AND p.code IN ('ver_admin', 'gestionar_jugadores', 'gestionar_partidos', 'tomar_asistencia', 'realizar_convocatoria')
ON CONFLICT DO NOTHING;

-- Jugador: confirmar_asistencia
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Jugador'
  AND p.code = 'confirmar_asistencia'
ON CONFLICT DO NOTHING;

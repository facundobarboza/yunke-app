-- =============================================================================
-- MIGRATION: Migrar is_admin a sistema RBAC
-- =============================================================================
-- Asigna el rol 'Dirigente' a todos los usuarios que tienen is_admin = true.
-- Idempotente: safe to run multiple times (ON CONFLICT DO NOTHING).
-- =============================================================================

INSERT INTO user_roles (user_id, role_id, assigned_at)
SELECT p.id, r.id, NOW()
FROM profiles p
JOIN roles r ON r.name = 'Dirigente'
WHERE p.is_admin = true
ON CONFLICT (user_id, role_id) DO NOTHING;

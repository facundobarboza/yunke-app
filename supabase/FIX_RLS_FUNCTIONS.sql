-- Fix: drop old functions with conflicting parameter names, then recreate

DROP FUNCTION IF EXISTS has_role(uuid, text);
DROP FUNCTION IF EXISTS assign_role(uuid, text, uuid);
DROP FUNCTION IF EXISTS remove_role(uuid, text);

CREATE OR REPLACE FUNCTION has_role(user_uuid UUID, role_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
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
  SELECT user_uuid, id, assigned_by_uuid FROM roles WHERE name = role_name
  ON CONFLICT (user_id, role_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION remove_role(user_uuid UUID, role_name TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM user_roles
  WHERE user_id = user_uuid AND role_id = (SELECT id FROM roles WHERE name = role_name);
END;
$$;

// =============================================================================
// Query helpers for the RBAC system
// =============================================================================
// These functions wrap Supabase RPC calls and direct table queries.
// They use the existing supabase client from src/supabase.ts.
// =============================================================================

import { supabase } from '../../supabase';
import type { Role, Permission, UserRole, UserWithRoles } from '../../types/rbac';

// ---------------------------------------------------------------------------
// RPC-based helpers (call SECURITY DEFINER functions)
// ---------------------------------------------------------------------------

export async function getUserRoles(userId: string) {
  const { data, error } = await supabase.rpc('get_user_roles', {
    user_uuid: userId,
  });

  if (error) throw error;
  return data as { role_name: string; role_description: string | null }[];
}

export async function getUserPermissions(userId: string) {
  const { data, error } = await supabase.rpc('get_user_permissions', {
    user_uuid: userId,
  });

  if (error) throw error;
  return data as { permission_code: string; permission_name: string }[];
}

export async function checkPermission(userId: string, code: string) {
  const { data, error } = await supabase.rpc('has_permission', {
    user_uuid: userId,
    perm_code: code,
  });

  if (error) throw error;
  return data as boolean;
}

export async function checkRole(userId: string, roleName: string) {
  const { data, error } = await supabase.rpc('has_role', {
    user_uuid: userId,
    role_name: roleName,
  });

  if (error) throw error;
  return data as boolean;
}

export async function assignRole(
  userId: string,
  roleName: string,
  assignedBy?: string
) {
  const { error } = await supabase.rpc('assign_role', {
    user_uuid: userId,
    role_name: roleName,
    assigned_by_uuid: assignedBy ?? null,
  });

  if (error) throw error;
}

export async function removeRole(userId: string, roleName: string) {
  const { error } = await supabase.rpc('remove_role', {
    user_uuid: userId,
    role_name: roleName,
  });

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Direct table queries
// ---------------------------------------------------------------------------

export async function getAllRoles() {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data as Role[];
}

export async function getAllPermissions() {
  const { data, error } = await supabase
    .from('permissions')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data as Permission[];
}

export async function createRole(data: { name: string; description?: string }) {
  const { data: role, error } = await supabase
    .from('roles')
    .insert({ name: data.name, description: data.description ?? null })
    .select()
    .single();

  if (error) throw error;
  return role as Role;
}

export async function updateRole(id: number, data: Partial<Role>) {
  const { data: role, error } = await supabase
    .from('roles')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return role as Role;
}

export async function deleteRole(id: number) {
  const { error } = await supabase.from('roles').delete().eq('id', id);

  if (error) throw error;
}

export async function createPermission(data: {
  name: string;
  code: string;
  description?: string;
}) {
  const { data: permission, error } = await supabase
    .from('permissions')
    .insert({
      name: data.name,
      code: data.code,
      description: data.description ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return permission as Permission;
}

export async function updatePermission(
  id: number,
  data: Partial<Permission>
) {
  const { data: permission, error } = await supabase
    .from('permissions')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return permission as Permission;
}

export async function deletePermission(id: number) {
  const { error } = await supabase.from('permissions').delete().eq('id', id);

  if (error) throw error;
}

export async function getUsersWithRoles() {
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, nombre, apellido');

  if (profilesError) throw profilesError;

  const usersWithRoles: UserWithRoles[] = await Promise.all(
    (profiles || []).map(async (profile) => {
      const { data: roles, error: rolesError } = await supabase
        .rpc('get_user_roles', { user_uuid: profile.id });

      if (rolesError) throw rolesError;

      type RoleRow = { role_name: string; role_description: string | null };
      const mappedRoles: Role[] = (roles as RoleRow[] || []).map((r) => ({
        id: 0,
        name: r.role_name,
        description: r.role_description,
        created_at: '',
      }));

      return {
        user_id: profile.id,
        email: profile.email ?? '',
        nombre: profile.nombre ?? null,
        apellido: profile.apellido ?? null,
        roles: mappedRoles,
      };
    })
  );

  return usersWithRoles;
}



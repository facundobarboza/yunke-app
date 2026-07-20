// =============================================================================
// TypeScript types for the RBAC system
// =============================================================================

export interface Role {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Permission {
  id: number;
  name: string;
  description: string | null;
  code: string;
  created_at: string;
}

export interface UserRole {
  user_id: string;
  role_id: number;
  assigned_at: string;
  assigned_by: string | null;
}

export interface RolePermission {
  role_id: number;
  permission_id: number;
}

// For joined queries
export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export interface UserWithRoles {
  user_id: string;
  email: string;
  nombre: string | null;
  apellido: string | null;
  roles: Role[];
}

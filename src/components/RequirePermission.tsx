// =============================================================================
// RequirePermission — Declarative route guard component
// =============================================================================
// If the user has the specified permission, renders children.
// Otherwise renders the optional fallback (default: null).
// =============================================================================

import { type ReactNode } from 'react';
import { usePermission } from '../hooks/usePermission';

interface RequirePermissionProps {
  /** Permission code to check (e.g. 'ver_admin', 'gestionar_jugadores') */
  permission: string;
  /** Content to render when the user HAS the permission */
  children: ReactNode;
  /** Content to render when the user does NOT have the permission (default: null) */
  fallback?: ReactNode;
}

export function RequirePermission({
  permission,
  children,
  fallback = null,
}: RequirePermissionProps) {
  const hasPermission = usePermission(permission);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// =============================================================================
// AdminGuard — Wrapper for admin screens that redirects if no permission
// =============================================================================
// Usage: wrap the screen export with AdminGuard(permission, router)
// =============================================================================

import { type ReactNode } from 'react';
import { RequirePermission } from './RequirePermission';

interface AdminGuardProps {
  permission: string;
  children: ReactNode;
}

export function AdminGuard({ permission, children }: AdminGuardProps) {
  return <RequirePermission permission={permission}>{children}</RequirePermission>;
}

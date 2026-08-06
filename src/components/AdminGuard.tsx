// =============================================================================
// AdminGuard — Wrapper for admin screens that redirects if no permission
// =============================================================================
// Usage: wrap the screen export with AdminGuard(permission, router)
// =============================================================================

import { RequirePermission } from './RequirePermission';

interface AdminGuardProps {
  permission: string;
  children: React.ReactNode;
}

export function AdminGuard({ permission, children }: AdminGuardProps) {
  return <RequirePermission permission={permission}>{children}</RequirePermission>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: yunke.surface,
  },
});

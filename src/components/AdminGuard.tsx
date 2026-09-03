// =============================================================================
// AdminGuard — Wrapper for admin screens that redirects if no permission
// =============================================================================
// Usage: wrap the screen export with AdminGuard(permission, router)
// =============================================================================

import { yunke } from '@/constants/Colors';
import { type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { RequirePermission } from './RequirePermission';

interface AdminGuardProps {
  permission: string;
  children: ReactNode;
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

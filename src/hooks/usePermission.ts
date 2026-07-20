// =============================================================================
// usePermission — Check if the current user has a specific permission
// =============================================================================
// Returns true if the user's permissions array includes the given code.
// Returns false if not authenticated or still loading.
// =============================================================================

import { useAuth } from './useAuth';

export function usePermission(code: string): boolean {
  const { permissions, loading, isAuthenticated } = useAuth();

  if (loading || !isAuthenticated) {
    return false;
  }

  return permissions.includes(code);
}

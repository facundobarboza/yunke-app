// =============================================================================
// useAuth — Public hook to consume the AuthProvider context
// =============================================================================
// Throws a descriptive error if used outside <AuthProvider>.
// =============================================================================

export { useAuthContext as useAuth } from '../contexts/AuthContext';
export type { AuthContextType } from '../contexts/AuthContext';

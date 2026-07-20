// =============================================================================
// AuthProvider — Global authentication context for yunke-app
// =============================================================================
// Subscribes to supabase.auth.onAuthStateChange, fetches profile + roles +
// permissions on session change, and provides them via React Context.
// =============================================================================

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';

import { supabase } from '../supabase';
import { getUserPermissions, getUserRoles } from '../lib/queries/roles';

// ---------------------------------------------------------------------------
// Profile type matching the profiles table
// ---------------------------------------------------------------------------
export interface Profile {
  id: string;
  email: string | null;
  nombre: string | null;
  apellido: string | null;
  telefono: string | null;
  dni: string | null;
  is_socio: boolean;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Context type
// ---------------------------------------------------------------------------
export interface AuthContextType {
  /** The Supabase User object (from session) */
  user: User | null;
  /** The user's profile row from the profiles table */
  profile: Profile | null;
  /** Role names the user belongs to (e.g. ['Jugador', 'Dirigente']) */
  roles: string[];
  /** Permission codes the user has (e.g. ['ver_admin', 'gestionar_jugadores']) */
  permissions: string[];
  /** True while the initial session check or a session change is resolving */
  loading: boolean;
  /** Convenience: true when user is logged in */
  isAuthenticated: boolean;
  /** Convenience: true when permissions includes 'ver_admin' */
  isAdmin: boolean;
}

// ---------------------------------------------------------------------------
// Context (internal — consumers should use useAuth() from src/hooks/useAuth)
// ---------------------------------------------------------------------------
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        const userId = session.user.id;

        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileData) {
          setProfile(profileData as Profile);
        } else {
          setProfile(null);
        }

        // Fetch roles & permissions via RPC
        try {
          const [roleRows, permRows] = await Promise.all([
            getUserRoles(userId),
            getUserPermissions(userId),
          ]);

          setRoles(roleRows.map((r) => r.role_name));
          setPermissions(permRows.map((p) => p.permission_code));
        } catch (err) {
          console.error('AuthProvider: Error fetching roles/permissions', err);
          setRoles([]);
          setPermissions([]);
        }
      } else {
        setProfile(null);
        setRoles([]);
        setPermissions([]);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Memoized context value — prevents unnecessary re-renders
  const value = useMemo<AuthContextType>(
    () => ({
      user,
      profile,
      roles,
      permissions,
      loading,
      isAuthenticated: user !== null,
      isAdmin: permissions.includes('ver_admin'),
    }),
    [user, profile, roles, permissions, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// Internal consumer hook (re-exported as useAuth from src/hooks/useAuth)
// ---------------------------------------------------------------------------
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

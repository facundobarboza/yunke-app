// =============================================================================
// RequirePermission — Declarative route guard component
// =============================================================================
// If the user has the specified permission, renders children.
// Otherwise renders the optional fallback or redirects to the profile screen.
// =============================================================================

import { yunke } from '@/constants/Colors';
import type { ThemePalette } from '@/constants/Colors';
import { useTheme } from '@/src/hooks/useTheme';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';
import { useRouter } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';

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
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const { permissions, loading, isAuthenticated } = useAuth();
  const hasPermission = permissions.includes(permission);

  useEffect(() => {
    if (!loading && !hasPermission && !fallback) {
      router.replace('/(tabs)/profile');
    }
  }, [fallback, hasPermission, loading, router]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primaryLight} />
      </View>
    );
  }

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

const createStyles = (theme: ThemePalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.surface,
    },
  });

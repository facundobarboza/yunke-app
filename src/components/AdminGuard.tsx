// =============================================================================
// AdminGuard — Wrapper for admin screens that redirects if no permission
// =============================================================================
// Usage: wrap the screen export with AdminGuard(permission, router)
// =============================================================================

import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { yunke } from '@/constants/Colors';
import { usePermission } from '../hooks/usePermission';

interface AdminGuardProps {
  permission: string;
  children: React.ReactNode;
}

export function AdminGuard({ permission, children }: AdminGuardProps) {
  const router = useRouter();
  const hasPermission = usePermission(permission);

  useEffect(() => {
    // Give a moment for auth to load, then redirect if no permission
    const timer = setTimeout(() => {
      if (!hasPermission) {
        router.replace('/(tabs)/profile');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [hasPermission, router]);

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={yunke.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: yunke.surface,
  },
});

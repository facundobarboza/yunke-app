import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { yunke } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../src/supabase';
import type { Permission } from '../../src/types/rbac';
import { AdminGuard } from '../../src/components/AdminGuard';

export default function AdminPermissionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarPermisos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setPermissions(data || []);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { cargarPermisos(); }, []));

  const eliminarPermiso = (permiso: Permission) => {
    Alert.alert(
      'Eliminar permiso',
      `¿Eliminar el permiso "${permiso.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('permissions').delete().eq('id', permiso.id);
              if (error) throw error;
              cargarPermisos();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const renderPermission = ({ item }: { item: Permission }) => (
    <Card style={styles.card}>
      <Pressable
        style={styles.permisoInfo}
        onPress={() => router.push(`/admin/create-permission?id=${item.id}`)}
      >
        <View style={styles.permisoIcon}>
          <Ionicons name="key-outline" size={18} color={yunke.primary} />
        </View>
        <View style={styles.permisoText}>
          <Text style={styles.permisoName}>{item.name}</Text>
          <Text style={styles.permisoCode}>{item.code}</Text>
          {item.description ? (
            <Text style={styles.permisoDesc} numberOfLines={1}>{item.description}</Text>
          ) : null}
        </View>
      </Pressable>

      <Pressable style={styles.deleteBtn} onPress={() => eliminarPermiso(item)}>
        <Ionicons name="trash-outline" size={16} color={yunke.red} />
      </Pressable>
    </Card>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={yunke.primary} /></View>;

  return (
    <AdminGuard permission="gestionar_permisos">
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <ScreenHeader
          title="Gestionar Permisos"
          subtitle={`${permissions.length} permisos`}
          showBack
          onBack={() => router.back()}
        />

        <FlatList
          data={permissions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPermission}
          contentContainerStyle={{ paddingBottom: 100 + insets.bottom, paddingHorizontal: 24, paddingTop: 16 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState title="No hay permisos registrados" />}
        />

        <Pressable
          style={[styles.fab, { bottom: 30 + insets.bottom }]}
          onPress={() => router.push('/admin/create-permission')}
        >
          <Ionicons name="add" size={28} color={yunke.white} />
        </Pressable>
      </View>
    </AdminGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: yunke.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: yunke.surface },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, marginBottom: 12 },
  permisoInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  permisoIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: yunke.primary + '12', justifyContent: 'center', alignItems: 'center' },
  permisoText: { flex: 1 },
  permisoName: { fontSize: 15, fontFamily: 'Montserrat_600SemiBold', color: yunke.text },
  permisoCode: { fontSize: 12, fontFamily: 'Montserrat_500Medium', color: yunke.primary, marginTop: 1 },
  permisoDesc: { fontSize: 13, fontFamily: 'Montserrat_400Regular', color: yunke.textSecondary, marginTop: 2 },
  deleteBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: yunke.red + '12', marginLeft: 8 },
  fab: { position: 'absolute', bottom: 30, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: yunke.primary, justifyContent: 'center', alignItems: 'center', shadowColor: yunke.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
});

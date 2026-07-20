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
import { AdminGuard } from '../../src/components/AdminGuard';

type RoleInfo = {
  id: number;
  name: string;
  description: string | null;
  permission_count: number;
};

export default function AdminRolesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarRoles = async () => {
    setLoading(true);
    try {
      const { data: rolesData, error } = await supabase
        .from('roles')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      const rolesConConteo = await Promise.all(
        (rolesData || []).map(async (role) => {
          const { count, error: countError } = await supabase
            .from('role_permissions')
            .select('*', { count: 'exact', head: true })
            .eq('role_id', role.id);

          return {
            id: role.id,
            name: role.name,
            description: role.description,
            permission_count: countError || !count ? 0 : count,
          };
        })
      );

      setRoles(rolesConConteo);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { cargarRoles(); }, []));

  const eliminarRole = (role: RoleInfo) => {
    Alert.alert('Eliminar rol', `¿Eliminar el rol "${role.name}"? Esta acción no se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('roles').delete().eq('id', role.id);
            if (error) throw error;
            cargarRoles();
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const renderRole = ({ item }: { item: RoleInfo }) => (
    <Card style={styles.card}>
      <Pressable style={styles.roleInfo} onPress={() => router.push(`/admin/create-role?id=${item.id}`)}>
        <View style={styles.roleIcon}>
          <Ionicons name="shield-outline" size={18} color={yunke.primary} />
        </View>
        <View style={styles.roleText}>
          <Text style={styles.roleName}>{item.name}</Text>
          {item.description ? (
            <Text style={styles.roleDescription} numberOfLines={1}>{item.description}</Text>
          ) : null}
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.permission_count}</Text>
        </View>
      </Pressable>

      <Pressable style={styles.deleteBtn} onPress={() => eliminarRole(item)}>
        <Ionicons name="trash-outline" size={16} color={yunke.red} />
      </Pressable>
    </Card>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={yunke.primary} /></View>;

  return (
    <AdminGuard permission="gestionar_roles">
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <ScreenHeader
          title="Gestionar Roles"
          subtitle={`${roles.length} roles`}
          showBack
          onBack={() => router.back()}
        />

        <FlatList
          data={roles}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderRole}
          contentContainerStyle={{ paddingBottom: 100 + insets.bottom, paddingHorizontal: 24, paddingTop: 16 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState title="No hay roles creados" />}
        />

        <Pressable style={[styles.fab, { bottom: 30 + insets.bottom }]} onPress={() => router.push('/admin/create-role')}>
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
  roleInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  roleIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: yunke.primary + '12', justifyContent: 'center', alignItems: 'center' },
  roleText: { flex: 1 },
  roleName: { fontSize: 15, fontFamily: 'Montserrat_600SemiBold', color: yunke.text },
  roleDescription: { fontSize: 13, fontFamily: 'Montserrat_400Regular', color: yunke.textSecondary, marginTop: 2 },
  badge: { minWidth: 28, height: 28, borderRadius: 14, backgroundColor: yunke.primary + '15', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 },
  badgeText: { fontSize: 13, fontFamily: 'Montserrat_700Bold', color: yunke.primary },
  deleteBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: yunke.red + '12', marginLeft: 8 },
  fab: { position: 'absolute', bottom: 30, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: yunke.primary, justifyContent: 'center', alignItems: 'center', shadowColor: yunke.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
});

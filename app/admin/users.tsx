import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { yunke } from '@/constants/Colors';
import { useTheme } from '@/src/hooks/useTheme';
import type { ThemePalette } from '@/constants/Colors';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/hooks/useAuth';
import { supabase } from '../../src/supabase';
import type { Role, UserWithRoles } from '../../src/types/rbac';
import { AdminGuard } from '../../src/components/AdminGuard';

export default function AdminUsersScreen() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile: currentUser } = useAuth();

  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [userRoleNames, setUserRoleNames] = useState<Set<string>>(new Set());
  const [modalLoading, setModalLoading] = useState(false);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Cargar todos los roles disponibles
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('*')
        .order('name', { ascending: true });

      if (rolesError) throw rolesError;
      setRoles(rolesData || []);

      // Cargar usuarios con sus roles vía RPC
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, nombre, apellido')
        .order('nombre', { ascending: true });

      if (profilesError) throw profilesError;

      const usersWithRoles: UserWithRoles[] = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: userRoles, error: rolesError } = await supabase.rpc('get_user_roles', {
            user_uuid: profile.id,
          });

          if (rolesError) throw rolesError;

          const rolesArray = ((userRoles as { role_name: string; role_description: string | null }[]) || []).map(
            (r) => ({
              id: 0,
              name: r.role_name,
              description: r.role_description,
              created_at: '',
            })
          );

          return {
            user_id: profile.id,
            email: profile.email ?? '',
            nombre: profile.nombre ?? null,
            apellido: profile.apellido ?? null,
            roles: rolesArray,
          };
        })
      );

      setUsers(usersWithRoles);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { cargarDatos(); }, []));

  const abrirModal = (user: UserWithRoles) => {
    setSelectedUser(user);
    setUserRoleNames(new Set(user.roles.map((r) => r.name)));
  };

  const toggleRoleForUser = async (roleName: string, currentlyAssigned: boolean) => {
    if (!selectedUser || !currentUser?.id) return;

    setModalLoading(true);
    try {
      if (currentlyAssigned) {
        const { error } = await supabase.rpc('remove_role', {
          user_uuid: selectedUser.user_id,
          role_name: roleName,
        });
        if (error) throw error;

        setUserRoleNames((prev) => {
          const next = new Set(prev);
          next.delete(roleName);
          return next;
        });
      } else {
        const { error } = await supabase.rpc('assign_role', {
          user_uuid: selectedUser.user_id,
          role_name: roleName,
          assigned_by_uuid: currentUser.id,
        });
        if (error) throw error;

        setUserRoleNames((prev) => new Set(prev).add(roleName));
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
    setModalLoading(false);
  };

  const cerrarModal = () => {
    setSelectedUser(null);
    cargarDatos(); // Refrescar para sincronizar
  };

  const renderUser = ({ item }: { item: UserWithRoles }) => {
    const fullName = [item.nombre, item.apellido].filter(Boolean).join(' ') || 'Sin nombre';
    return (
      <Card style={styles.card}>
        <Pressable style={styles.userInfo} onPress={() => abrirModal(item)}>
          <View style={styles.userIcon}>
            <Ionicons name="person-outline" size={18} color={colors.primaryLight} />
          </View>
          <View style={styles.userText}>
            <Text style={styles.userName}>{fullName}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
            {item.roles.length > 0 && (
              <View style={styles.chipsRow}>
                {item.roles.map((rol, idx) => (
                  <View key={idx} style={styles.chip}>
                    <Text style={styles.chipText}>{rol.name}</Text>
                  </View>
                ))}
              </View>
            )}
            {item.roles.length === 0 && (
              <Text style={styles.noRoles}>Sin roles asignados</Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </Pressable>
      </Card>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primaryLight} /></View>;

  return (
    <AdminGuard permission="gestionar_roles">
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <ScreenHeader
          title="Usuarios y Roles"
          subtitle={`${users.length} usuarios`}
          showBack
          onBack={() => router.back()}
        />

        <FlatList
          data={users}
          keyExtractor={(item) => item.user_id}
          renderItem={renderUser}
          contentContainerStyle={{ paddingBottom: 100 + insets.bottom, paddingHorizontal: 24, paddingTop: 16 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState title="No hay usuarios registrados" />}
        />

        {/* Modal de asignación de roles */}
        <Modal visible={!!selectedUser} transparent animationType="slide" onRequestClose={cerrarModal}>
          <Pressable style={styles.modalOverlay} onPress={cerrarModal}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />

              {selectedUser && (
                <>
                  <Text style={styles.modalTitle}>
                    {[selectedUser.nombre, selectedUser.apellido].filter(Boolean).join(' ') || selectedUser.email}
                  </Text>
                  <Text style={styles.modalSubtitle}>{selectedUser.email}</Text>

                  <View style={styles.modalDivider} />

                  <Text style={styles.modalSectionTitle}>ROLES DISPONIBLES</Text>

                  <View style={styles.rolesList}>
                    {roles.map((rol) => {
                      const isAssigned = userRoleNames.has(rol.name);
                      return (
                        <Pressable
                          key={rol.id}
                          style={[styles.roleToggleRow, isAssigned && styles.roleToggleRowActive]}
                          onPress={() => toggleRoleForUser(rol.name, isAssigned)}
                          disabled={modalLoading}
                        >
                          <View style={styles.roleToggleLeft}>
                            <Ionicons
                              name={isAssigned ? 'checkmark-circle' : 'add-circle-outline'}
                              size={22}
                              color={isAssigned ? yunke.success : colors.textSecondary}
                            />
                            <View style={styles.roleToggleInfo}>
                              <Text style={[styles.roleToggleName, isAssigned && styles.roleToggleNameActive]}>
                                {rol.name}
                              </Text>
                              {rol.description && (
                                <Text style={styles.roleToggleDesc}>{rol.description}</Text>
                              )}
                            </View>
                          </View>
                          {isAssigned && (
                            <Ionicons name="close-circle" size={18} color={yunke.red} />
                          )}
                        </Pressable>
                      );
                    })}
                  </View>

                  {modalLoading && (
                    <ActivityIndicator style={{ marginTop: 16 }} color={colors.primaryLight} />
                  )}

                  <Pressable style={styles.modalCloseButton} onPress={cerrarModal}>
                    <Text style={styles.modalCloseButtonText}>Cerrar</Text>
                  </Pressable>
                </>
              )}
              </Pressable>
            </Pressable>
          </Modal>
      </View>
    </AdminGuard>
  );
}

const createStyles = (theme: ThemePalette) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.surface },

  // Cards de usuario
  card: { padding: 14, marginBottom: 12 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  userIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: yunke.primary + '12', justifyContent: 'center', alignItems: 'center' },
  userText: { flex: 1 },
  userName: { fontSize: 15, fontFamily: 'Montserrat_600SemiBold', color: theme.text },
  userEmail: { fontSize: 13, fontFamily: 'Montserrat_400Regular', color: theme.textSecondary, marginTop: 1 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  chip: { backgroundColor: yunke.primary + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  chipText: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold', color: yunke.primary },
  noRoles: { fontSize: 12, fontFamily: 'Montserrat_400Regular', color: theme.textTertiary, marginTop: 4, fontStyle: 'italic' },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 40 + 20,
    maxHeight: '80%',
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontFamily: 'Montserrat_700Bold', color: theme.text, textAlign: 'center', paddingHorizontal: 24 },
  modalSubtitle: { fontSize: 14, fontFamily: 'Montserrat_400Regular', color: theme.textSecondary, textAlign: 'center', marginTop: 4, paddingHorizontal: 24 },
  modalDivider: { height: 1, backgroundColor: theme.border, marginVertical: 16, marginHorizontal: 24 },
  modalSectionTitle: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, paddingHorizontal: 24 },
  rolesList: { paddingHorizontal: 24 },
  roleToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  roleToggleRowActive: { borderColor: yunke.primary + '30', backgroundColor: yunke.primary + '08' },
  roleToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  roleToggleInfo: { flex: 1 },
  roleToggleName: { fontSize: 15, fontFamily: 'Montserrat_500Medium', color: theme.text },
  roleToggleNameActive: { fontFamily: 'Montserrat_600SemiBold', color: yunke.primary },
  roleToggleDesc: { fontSize: 12, fontFamily: 'Montserrat_400Regular', color: theme.textSecondary, marginTop: 2 },
  modalCloseButton: { marginHorizontal: 24, marginTop: 16, height: 48, borderRadius: 14, backgroundColor: theme.surface, justifyContent: 'center', alignItems: 'center' },
  modalCloseButtonText: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold', color: theme.textSecondary },
});

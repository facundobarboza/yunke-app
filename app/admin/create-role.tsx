import { yunke } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../src/supabase';
import type { Permission } from '../../src/types/rbac';

export default function CreateRoleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const isEditing = !!id;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Cargar todos los permisos disponibles
      const { data: allPermissions, error: permError } = await supabase
        .from('permissions')
        .select('*')
        .order('name', { ascending: true });

      if (permError) throw permError;
      setPermissions(allPermissions || []);

      // Si es edición, cargar datos del rol y sus permisos actuales
      if (id) {
        const { data: roleData, error: roleError } = await supabase
          .from('roles')
          .select('*')
          .eq('id', id)
          .single();

        if (roleError) throw roleError;

        setName(roleData.name);
        setDescription(roleData.description || '');

        const { data: rolePerms, error: rpError } = await supabase
          .from('role_permissions')
          .select('permission_id')
          .eq('role_id', id);

        if (rpError) throw rpError;

        setSelectedIds(new Set((rolePerms || []).map((rp) => rp.permission_id)));
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  const togglePermission = (permissionId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }
      return next;
    });
  };

  const handleGuardar = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre del rol es obligatorio.');
      return;
    }

    setSaving(true);
    try {
      let roleId: number;

      if (isEditing) {
        const { error } = await supabase
          .from('roles')
          .update({ name: name.trim(), description: description.trim() || null })
          .eq('id', id);

        if (error) throw error;
        roleId = Number(id);

        // Eliminar role_permissions existentes
        const { error: deleteError } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role_id', roleId);

        if (deleteError) throw deleteError;
      } else {
        const { data: newRole, error } = await supabase
          .from('roles')
          .insert({ name: name.trim(), description: description.trim() || null })
          .select('id')
          .single();

        if (error) throw error;
        roleId = newRole.id;
      }

      // Insertar nuevos role_permissions
      if (selectedIds.size > 0) {
        const inserts = Array.from(selectedIds).map((permissionId) => ({
          role_id: roleId,
          permission_id: permissionId,
        }));

        const { error: insertError } = await supabase
          .from('role_permissions')
          .insert(inserts);

        if (insertError) throw insertError;
      }

      Alert.alert('Éxito', isEditing ? 'Rol actualizado.' : 'Rol creado.');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={yunke.primary} /></View>;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}>
          <LinearGradient
            colors={yunke.gradientHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.header, { paddingTop: insets.top + 20 }]}
          >
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color={yunke.white} />
              <Text style={styles.backText}>Volver</Text>
            </Pressable>
            <Text style={styles.headerTitle}>{isEditing ? 'Editar Rol' : 'Nuevo Rol'}</Text>
          </LinearGradient>

          {/* Datos del rol */}
          <Text style={styles.sectionTitle}>INFORMACIÓN DEL ROL</Text>
          <View style={styles.inputGroup}>
            <View style={styles.inputRow}>
              <Ionicons name="shield-outline" size={18} color={yunke.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Nombre del rol"
                placeholderTextColor={yunke.textSecondary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.inputDivider} />
            <View style={styles.inputRow}>
              <Ionicons name="document-text-outline" size={18} color={yunke.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Descripción (opcional)"
                placeholderTextColor={yunke.textSecondary}
                value={description}
                onChangeText={setDescription}
              />
            </View>
          </View>

          {/* Permisos */}
          <Text style={styles.sectionTitle}>PERMISOS</Text>
          <Text style={styles.sectionSubtitle}>
            {selectedIds.size} de {permissions.length} seleccionados
          </Text>

          <View style={styles.permissionsContainer}>
            {permissions.map((perm) => {
              const isSelected = selectedIds.has(perm.id);
              return (
                <Pressable
                  key={perm.id}
                  style={[styles.permissionRow, isSelected && styles.permissionRowActive]}
                  onPress={() => togglePermission(perm.id)}
                >
                  <Ionicons
                    name={isSelected ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={isSelected ? yunke.primary : yunke.textTertiary}
                  />
                  <View style={styles.permissionInfo}>
                    <Text style={styles.permissionName}>{perm.name}</Text>
                    <Text style={styles.permissionCode}>{perm.code}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Pressable style={styles.saveButton} onPress={handleGuardar} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={yunke.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color={yunke.white} />
                <Text style={styles.saveButtonText}>{isEditing ? 'Guardar Cambios' : 'Crear Rol'}</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: yunke.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: yunke.surface },
  header: { paddingBottom: 24, paddingHorizontal: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  backButton: { flexDirection: 'row', alignItems: 'center', paddingBottom: 16, gap: 4 },
  backText: { fontSize: 16, fontFamily: 'Montserrat_500Medium', color: yunke.white },
  headerTitle: { fontSize: 26, fontFamily: 'Montserrat_900Black', color: yunke.white, letterSpacing: -0.5 },
  sectionTitle: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold', color: yunke.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 28, marginTop: 24 },
  sectionSubtitle: { fontSize: 13, fontFamily: 'Montserrat_400Regular', color: yunke.textTertiary, marginLeft: 28, marginTop: -8, marginBottom: 12 },
  inputGroup: { backgroundColor: yunke.card, borderRadius: 16, paddingHorizontal: 16, marginHorizontal: 24, shadowColor: yunke.dark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 50 },
  input: { flex: 1, fontSize: 16, fontFamily: 'Montserrat_400Regular', color: yunke.text, paddingVertical: 12 },
  inputDivider: { height: 1, backgroundColor: yunke.border },
  permissionsContainer: { backgroundColor: yunke.card, borderRadius: 16, marginHorizontal: 24, overflow: 'hidden', shadowColor: yunke.dark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  permissionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: yunke.border },
  permissionRowActive: { backgroundColor: yunke.primary + '08' },
  permissionInfo: { flex: 1 },
  permissionName: { fontSize: 15, fontFamily: 'Montserrat_500Medium', color: yunke.text },
  permissionCode: { fontSize: 12, fontFamily: 'Montserrat_400Regular', color: yunke.textSecondary, marginTop: 1 },
  saveButton: { backgroundColor: yunke.primary, marginHorizontal: 24, height: 52, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 32, shadowColor: yunke.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveButtonText: { color: yunke.white, fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
});

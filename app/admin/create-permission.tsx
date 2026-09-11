import { yunke } from '@/constants/Colors';
import { useTheme } from '@/src/hooks/useTheme';
import type { ThemePalette } from '@/constants/Colors';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../src/supabase';
import { AdminGuard } from '../../src/components/AdminGuard';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[á]/g, 'a')
    .replace(/[é]/g, 'e')
    .replace(/[í]/g, 'i')
    .replace(/[ó]/g, 'o')
    .replace(/[ú]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_');
}

export default function CreatePermissionScreen() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const isEditing = !!id;

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    if (isEditing) fetchPermission(id as string);
  }, [id]);

  const fetchPermission = async (permissionId: string) => {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .eq('id', permissionId)
        .single();

      if (error) throw error;

      setName(data.name);
      setCode(data.code);
      setDescription(data.description || '');
      setCodeManuallyEdited(true);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  const handleNameChange = (text: string) => {
    setName(text);
    if (!codeManuallyEdited) {
      setCode(slugify(text));
    }
  };

  const handleCodeChange = (text: string) => {
    setCode(text);
    setCodeManuallyEdited(true);
  };

  const handleGuardar = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre del permiso es obligatorio.');
      return;
    }
    if (!code.trim()) {
      Alert.alert('Error', 'El código del permiso es obligatorio.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        code: code.trim(),
        description: description.trim() || null,
      };

      if (isEditing) {
        const { error } = await supabase.from('permissions').update(payload).eq('id', id);
        if (error) throw error;
        Alert.alert('Éxito', 'Permiso actualizado.');
      } else {
        const { error } = await supabase.from('permissions').insert(payload);
        if (error) throw error;
        Alert.alert('Éxito', 'Permiso creado.');
      }

      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primaryLight} /></View>;

  return (
    <AdminGuard permission="gestionar_permisos">
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
            <Text style={styles.headerTitle}>{isEditing ? 'Editar Permiso' : 'Nuevo Permiso'}</Text>
          </LinearGradient>

          <Text style={styles.sectionTitle}>INFORMACIÓN DEL PERMISO</Text>
          <View style={styles.inputGroup}>
            <View style={styles.inputRow}>
              <Ionicons name="key-outline" size={18} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Nombre del permiso"
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={handleNameChange}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.inputDivider} />
            <View style={styles.inputRow}>
              <Ionicons name="code-outline" size={18} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, styles.codeInput]}
                placeholder="codigo_del_permiso"
                placeholderTextColor={colors.textTertiary}
                value={code}
                onChangeText={handleCodeChange}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={styles.inputDivider} />
            <View style={styles.inputRow}>
              <Ionicons name="document-text-outline" size={18} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Descripción (opcional)"
                placeholderTextColor={colors.textSecondary}
                value={description}
                onChangeText={setDescription}
              />
            </View>
          </View>

          {!isEditing && name.length > 0 && (
            <Text style={styles.autoCodeHint}>
              Código auto-generado: <Text style={styles.autoCodeValue}>{slugify(name)}</Text>
              {'\n'}Toca el campo de código para editarlo manualmente.
            </Text>
          )}

          <Pressable style={styles.saveButton} onPress={handleGuardar} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={yunke.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color={yunke.white} />
                <Text style={styles.saveButtonText}>{isEditing ? 'Guardar Cambios' : 'Crear Permiso'}</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </AdminGuard>
  );
}

const createStyles = (theme: ThemePalette) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.surface },
  header: { paddingBottom: 24, paddingHorizontal: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  backButton: { flexDirection: 'row', alignItems: 'center', paddingBottom: 16, gap: 4 },
  backText: { fontSize: 16, fontFamily: 'Montserrat_500Medium', color: yunke.white },
  headerTitle: { fontSize: 26, fontFamily: 'Montserrat_900Black', color: yunke.white, letterSpacing: -0.5 },
  sectionTitle: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 28, marginTop: 24 },
  inputGroup: { backgroundColor: theme.card, borderRadius: 16, paddingHorizontal: 16, marginHorizontal: 24, shadowColor: theme.dark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 50 },
  input: { flex: 1, fontSize: 16, fontFamily: 'Montserrat_400Regular', color: theme.text, paddingVertical: 12 },
  codeInput: { fontFamily: 'Montserrat_500Medium', letterSpacing: 0.3 },
  inputDivider: { height: 1, backgroundColor: theme.border },
  autoCodeHint: { fontSize: 13, fontFamily: 'Montserrat_400Regular', color: theme.textTertiary, marginHorizontal: 28, marginTop: 12, lineHeight: 20 },
  autoCodeValue: { fontFamily: 'Montserrat_600SemiBold', color: yunke.primary },
  saveButton: { backgroundColor: yunke.primary, marginHorizontal: 24, height: 52, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 32, shadowColor: yunke.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveButtonText: { color: yunke.white, fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
});

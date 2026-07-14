import { yunke } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../src/supabase';

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [dni, setDni] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setProfile(data);
      setNombre(data.nombre || '');
      setApellido(data.apellido || '');
      setTelefono(data.telefono || '');
      setDni(data.dni || '');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!session?.user?.id) return;
    if (!nombre || !apellido) {
      Alert.alert('Error', 'Nombre y apellido son obligatorios');
      return;
    }
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({ nombre, apellido, telefono, dni })
      .eq('id', session.user.id);

    if (error) Alert.alert('Error', 'No se pudieron guardar los cambios.');
    else Alert.alert('Guardado', 'Tus datos se actualizaron correctamente.');

    setSaving(false);
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={yunke.primary} /></View>;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}>

          <ScreenHeader
            title="Datos Personales"
            showBack
            onBack={() => router.back()}
          />

          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{profile?.nombre?.charAt(0) || 'U'}</Text>
            </View>
            <Text style={styles.avatarName}>{profile?.nombre} {profile?.apellido}</Text>
            <Text style={styles.avatarEmail}>{session?.user?.email}</Text>
          </View>

          {/* Campos */}
          <Text style={styles.sectionTitle}>INFORMACIÓN PERSONAL</Text>

          {/* Nombre - editable */}
          <View style={styles.fieldCard}>
            <View style={styles.fieldHeader}>
              <Ionicons name="person-outline" size={16} color={yunke.primary} />
              <Text style={styles.fieldLabel}>Nombre</Text>
            </View>
            <TextInput
              style={styles.fieldInput}
              placeholder="Tu nombre"
              placeholderTextColor={yunke.textTertiary}
              value={nombre}
              onChangeText={setNombre}
            />
          </View>

          {/* Apellido - editable */}
          <View style={styles.fieldCard}>
            <View style={styles.fieldHeader}>
              <Ionicons name="person-outline" size={16} color={yunke.primary} />
              <Text style={styles.fieldLabel}>Apellido</Text>
            </View>
            <TextInput
              style={styles.fieldInput}
              placeholder="Tu apellido"
              placeholderTextColor={yunke.textTertiary}
              value={apellido}
              onChangeText={setApellido}
            />
          </View>

          {/* Email - solo lectura */}
          <View style={styles.fieldCard}>
            <View style={styles.fieldHeader}>
              <Ionicons name="mail-outline" size={16} color={yunke.textSecondary} />
              <Text style={styles.fieldLabel}>Email</Text>
            </View>
            <Text style={styles.fieldValue}>{session?.user?.email}</Text>
          </View>

          {/* DNI - editable */}
          <View style={styles.fieldCard}>
            <View style={styles.fieldHeader}>
              <Ionicons name="card-outline" size={16} color={yunke.primary} />
              <Text style={styles.fieldLabel}>DNI</Text>
            </View>
            <TextInput
              style={styles.fieldInput}
              placeholder="Tu DNI"
              placeholderTextColor={yunke.textTertiary}
              value={dni}
              onChangeText={setDni}
              keyboardType="numeric"
              maxLength={8}
            />
          </View>

          {/* Teléfono - editable */}
          <View style={styles.fieldCard}>
            <View style={styles.fieldHeader}>
              <Ionicons name="call-outline" size={16} color={yunke.primary} />
              <Text style={styles.fieldLabel}>Teléfono</Text>
            </View>
            <TextInput
              style={styles.fieldInput}
              placeholder="Tu teléfono"
              placeholderTextColor={yunke.textTertiary}
              value={telefono}
              onChangeText={setTelefono}
              keyboardType="phone-pad"
            />
          </View>

          <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={yunke.white} /> : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color={yunke.white} />
                <Text style={styles.saveButtonText}>Guardar Cambios</Text>
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

  avatarSection: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: yunke.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontFamily: 'Montserrat_700Bold',
    color: yunke.primary,
  },
  avatarName: {
    fontSize: 20,
    fontFamily: 'Montserrat_700Bold',
    color: yunke.text,
  },
  avatarEmail: {
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
    color: yunke.textSecondary,
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    color: yunke.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 28,
    marginTop: 24,
  },

  fieldCard: {
    backgroundColor: yunke.card,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginHorizontal: 24,
    marginBottom: 12,
    shadowColor: yunke.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: 'Montserrat_600SemiBold',
    color: yunke.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 16,
    fontFamily: 'Montserrat_500Medium',
    color: yunke.text,
  },
  fieldInput: {
    fontSize: 16,
    fontFamily: 'Montserrat_400Regular',
    color: yunke.text,
    paddingVertical: 4,
  },

  saveButton: {
    backgroundColor: yunke.primary,
    marginHorizontal: 24,
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    shadowColor: yunke.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: yunke.white,
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
  },
});

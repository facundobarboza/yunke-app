import { yunke } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/ScreenHeader';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
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
      setAvatarUrl(data.avatar_url || null);
    }
    setLoading(false);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería para cambiar la foto.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!session?.user?.id) return;
    if (!nombre || !apellido) {
      Alert.alert('Error', 'Nombre y apellido son obligatorios');
      return;
    }
    setSaving(true);

    // Upload avatar if a new image was picked
    let newAvatarUrl = avatarUrl;
    if (imageUri && !imageUri.startsWith('http')) {
      try {
        const fileName = `avatar-${session.user.id}.jpg`;
        const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });
        const arrayBuffer = decode(base64);
        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, arrayBuffer, { contentType: 'image/jpeg', upsert: true });
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
        newAvatarUrl = publicUrlData.publicUrl;
      } catch (e: any) {
        Alert.alert('Error', 'No se pudo subir la imagen: ' + e.message);
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({ nombre, apellido, telefono, dni, avatar_url: newAvatarUrl })
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
            <Pressable onPress={pickImage} style={styles.avatarContainer}>
              {imageUri || avatarUrl ? (
                <Image source={{ uri: imageUri || avatarUrl! }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{profile?.nombre?.charAt(0) || 'U'}</Text>
                </View>
              )}
              <View style={styles.avatarEditBadge}>
                <Ionicons name="camera" size={14} color={yunke.white} />
              </View>
            </Pressable>
            <Text style={styles.avatarHint}>Tocá para cambiar la foto</Text>
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
  avatarContainer: {
    width: 88,
    height: 88,
    marginBottom: 8,
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: yunke.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 34,
    fontFamily: 'Montserrat_700Bold',
    color: yunke.primary,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: yunke.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: yunke.surface,
  },
  avatarHint: {
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
    color: yunke.primary,
    marginBottom: 4,
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

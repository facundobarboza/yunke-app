import { Ionicons } from '@expo/vector-icons';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../../src/supabase';

export default function CreateSponsorScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEditing = !!id;

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [webUrl, setWebUrl] = useState('');
  const [instagram, setInstagram] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [horarios, setHorarios] = useState('');

  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [portadaUri, setPortadaUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) fetchSponsor(id as string);
  }, [id]);

  const fetchSponsor = async (sponsorId: string) => {
    const { data } = await supabase.from('sponsors').select('*').eq('id', sponsorId).single();
    if (data) {
      setNombre(data.nombre); setDescripcion(data.descripcion || ''); setWebUrl(data.web_url || '');
      setInstagram(data.instagram || ''); setTelefono(data.telefono || ''); setDireccion(data.direccion || '');
      setHorarios(data.horarios || ''); setLogoUri(data.logo_url); setPortadaUri(data.portada_url);
    }
  };

  const pickImage = async (type: 'logo' | 'portada') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permiso denegado'); return; }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'logo' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      if (type === 'logo') setLogoUri(result.assets[0].uri);
      else setPortadaUri(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string, bucket: string) => {
    if (uri.startsWith('http')) return uri; // Si ya es URL, no la subimos de nuevo
    const fileName = `${Date.now()}.jpg`;
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const arrayBuffer = decode(base64);
    await supabase.storage.from(bucket).upload(fileName, arrayBuffer, { contentType: 'image/jpeg' });
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleGuardar = async () => {
    if (!nombre) { Alert.alert('Error', 'El nombre es obligatorio'); return; }
    setSaving(true);

    try {
      const finalLogoUrl = logoUri ? await uploadImage(logoUri, 'sponsors') : null;
      const finalPortadaUrl = portadaUri ? await uploadImage(portadaUri, 'sponsors') : null;

      const payload = {
        nombre, descripcion, web_url: webUrl, instagram, telefono, direccion, horarios,
        logo_url: finalLogoUrl, portada_url: finalPortadaUrl
      };

      if (isEditing) {
        const { error } = await supabase.from('sponsors').update(payload).eq('id', id);
        if (error) throw error;
        Alert.alert('Éxito', 'Sponsor actualizado.');
      } else {
        const { error } = await supabase.from('sponsors').insert({ ...payload, is_active: true });
        if (error) throw error;
        Alert.alert('Éxito', 'Sponsor creado.');
      }
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
          
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#007AFF" />
            <Text style={styles.backText}>Volver</Text>
          </Pressable>

          <Text style={styles.headerTitle}>{isEditing ? 'Editar Sponsor' : 'Nuevo Sponsor'}</Text>

          {/* Portada */}
          <Pressable style={styles.portadaContainer} onPress={() => pickImage('portada')}>
            {portadaUri ? (
              <Image source={{ uri: portadaUri }} style={styles.portada} />
            ) : (
              <View style={[styles.portada, styles.placeholder]}>
                <Ionicons name="image-outline" size={40} color="#C7C7CC" />
                <Text style={styles.photoText}>Foto de Portada (16:9)</Text>
              </View>
            )}
          </Pressable>

          {/* Logo */}
          <Pressable style={styles.logoContainer} onPress={() => pickImage('logo')}>
            {logoUri ? (
              <Image source={{ uri: logoUri }} style={styles.logo} />
            ) : (
              <View style={[styles.logo, styles.placeholder]}>
                <Ionicons name="business-outline" size={30} color="#C7C7CC" />
                <Text style={styles.photoText}>Logo</Text>
              </View>
            )}
          </Pressable>

          <View style={styles.inputGroup}>
            <TextInput style={styles.input} placeholder="Nombre del comercio" placeholderTextColor="#8E8E93" value={nombre} onChangeText={setNombre} />
            <View style={styles.inputDivider} />
            <TextInput style={styles.input} placeholder="Descripción" placeholderTextColor="#8E8E93" value={descripcion} onChangeText={setDescripcion} multiline />
            <View style={styles.inputDivider} />
            <TextInput style={styles.input} placeholder="Sitio Web (https://...)" placeholderTextColor="#8E8E93" value={webUrl} onChangeText={setWebUrl} autoCapitalize="none" />
            <View style={styles.inputDivider} />
            <TextInput style={styles.input} placeholder="Instagram (usuario sin @)" placeholderTextColor="#8E8E93" value={instagram} onChangeText={setInstagram} autoCapitalize="none" />
          </View>

          <Text style={styles.sectionTitle}>CONTACTO</Text>
          <View style={styles.inputGroup}>
            <TextInput style={styles.input} placeholder="Teléfono" placeholderTextColor="#8E8E93" value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
            <View style={styles.inputDivider} />
            <TextInput style={styles.input} placeholder="Dirección" placeholderTextColor="#8E8E93" value={direccion} onChangeText={setDireccion} />
            <View style={styles.inputDivider} />
            <TextInput style={styles.input} placeholder="Horarios de atención" placeholderTextColor="#8E8E93" value={horarios} onChangeText={setHorarios} />
          </View>

          <Pressable style={styles.saveButton} onPress={handleGuardar} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>{isEditing ? 'Guardar Cambios' : 'Crear Sponsor'}</Text>}
          </Pressable>

        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  backButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 10 },
  backText: { fontSize: 17, color: '#007AFF', marginLeft: -4 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1C1C1E', paddingHorizontal: 24, letterSpacing: -1, marginBottom: 20 },
  
  portadaContainer: { marginHorizontal: 24, marginBottom: 15 },
  portada: { width: '100%', height: 160, borderRadius: 16, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  
  logoContainer: { alignItems: 'center', marginBottom: 30 },
  logo: { width: 100, height: 100, borderRadius: 20, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E5EA' },
  
  placeholder: { borderWidth: 2, borderColor: '#E5E5EA', borderStyle: 'dashed' },
  photoText: { fontSize: 12, color: '#8E8E93', marginTop: 6, fontWeight: '600' },

  inputGroup: { backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 15, marginHorizontal: 24, marginBottom: 20 },
  input: { minHeight: 50, fontSize: 16, color: '#1C1C1E', paddingVertical: 10 },
  inputDivider: { height: 1, backgroundColor: '#E5E5EA' },
  
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#8E8E93', textTransform: 'uppercase', marginBottom: 10, marginLeft: 28 },
  
  saveButton: { backgroundColor: '#FF3B30', marginHorizontal: 24, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
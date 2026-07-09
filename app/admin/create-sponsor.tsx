import { yunke } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../src/supabase';

type GalleryImage = {
  id: string;
  url: string;
  caption: string | null;
  isNew?: boolean;
  localUri?: string;
};

export default function CreateSponsorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (isEditing) fetchSponsor(id as string); }, [id]);

  const fetchSponsor = async (sponsorId: string) => {
    const { data } = await supabase.from('sponsors').select('*').eq('id', sponsorId).single();
    if (data) { setNombre(data.nombre); setDescripcion(data.descripcion || ''); setWebUrl(data.web_url || ''); setInstagram(data.instagram || ''); setTelefono(data.telefono || ''); setDireccion(data.direccion || ''); setHorarios(data.horarios || ''); setLogoUri(data.logo_url); setPortadaUri(data.portada_url); }

    const { data: images } = await supabase.from('sponsor_images').select('id, url, caption').eq('sponsor_id', sponsorId).order('orden', { ascending: true });
    if (images) setGalleryImages(images);
  };

  const pickImage = async (type: 'logo' | 'portada') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permiso denegado'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: type === 'logo' ? [1, 1] : [16, 9], quality: 0.8 });
    if (!result.canceled) { if (type === 'logo') setLogoUri(result.assets[0].uri); else setPortadaUri(result.assets[0].uri); }
  };

  const pickGalleryImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permiso denegado'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.8 });
    if (!result.canceled) {
      const newImage: GalleryImage = {
        id: `new-${Date.now()}`,
        url: result.assets[0].uri,
        caption: null,
        isNew: true,
        localUri: result.assets[0].uri,
      };
      setGalleryImages(prev => [...prev, newImage]);
    }
  };

  const removeGalleryImage = (imageId: string) => {
    setGalleryImages(prev => prev.filter(img => img.id !== imageId));
  };

  const uploadImage = async (uri: string, bucket: string) => {
    if (uri.startsWith('http')) return uri;
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
      const payload = { nombre, descripcion, web_url: webUrl, instagram, telefono, direccion, horarios, logo_url: finalLogoUrl, portada_url: finalPortadaUrl };

      let sponsorId = id;

      if (isEditing) {
        const { error } = await supabase.from('sponsors').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('sponsors').insert({ ...payload, is_active: true }).select('id').single();
        if (error) throw error;
        sponsorId = data.id;
      }

      // Handle gallery images
      if (isEditing) {
        // Get current images from DB to find deleted ones
        const { data: currentImages } = await supabase.from('sponsor_images').select('id').eq('sponsor_id', sponsorId);
        const currentIds = currentImages?.map(img => img.id) || [];
        const keptIds = galleryImages.filter(img => !img.isNew).map(img => img.id);
        const deletedIds = currentIds.filter(id => !keptIds.includes(id));

        // Delete removed images
        if (deletedIds.length > 0) {
          await supabase.from('sponsor_images').delete().in('id', deletedIds);
        }
      }

      // Upload and insert new images
      const newImages = galleryImages.filter(img => img.isNew);
      for (let i = 0; i < newImages.length; i++) {
        const img = newImages[i];
        if (img.localUri) {
          const uploadedUrl = await uploadImage(img.localUri, 'sponsors');
          await supabase.from('sponsor_images').insert({
            sponsor_id: sponsorId,
            url: uploadedUrl,
            caption: img.caption,
            orden: i,
          });
        }
      }

      Alert.alert('Éxito', isEditing ? 'Sponsor actualizado.' : 'Sponsor creado.');
      router.back();
    } catch (error: any) { Alert.alert('Error', error.message); } finally { setSaving(false); }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}>
          <LinearGradient colors={yunke.gradientHeader} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color={yunke.white} />
              <Text style={styles.backText}>Volver</Text>
            </Pressable>
            <Text style={styles.headerTitle}>{isEditing ? 'Editar Sponsor' : 'Nuevo Sponsor'}</Text>
          </LinearGradient>

          <Pressable style={styles.portadaContainer} onPress={() => pickImage('portada')}>
            {portadaUri ? <Image source={{ uri: portadaUri }} style={styles.portada} /> : (
              <View style={[styles.portada, styles.placeholder]}><Ionicons name="image-outline" size={36} color={yunke.textSecondary} /><Text style={styles.photoText}>Foto de Portada (16:9)</Text></View>
            )}
          </Pressable>

          <Pressable style={styles.logoContainer} onPress={() => pickImage('logo')}>
            {logoUri ? <Image source={{ uri: logoUri }} style={styles.logo} /> : (
              <View style={[styles.logo, styles.placeholder]}><Ionicons name="business-outline" size={28} color={yunke.textSecondary} /><Text style={styles.photoText}>Logo</Text></View>
            )}
          </Pressable>

          <View style={styles.inputGroup}>
            <View style={styles.inputRow}><Ionicons name="storefront-outline" size={18} color={yunke.textSecondary} /><TextInput style={styles.input} placeholder="Nombre del comercio" placeholderTextColor={yunke.textSecondary} value={nombre} onChangeText={setNombre} /></View>
            <View style={styles.inputDivider} />
            <View style={styles.inputRow}><Ionicons name="document-text-outline" size={18} color={yunke.textSecondary} /><TextInput style={styles.input} placeholder="Descripción" placeholderTextColor={yunke.textSecondary} value={descripcion} onChangeText={setDescripcion} multiline /></View>
            <View style={styles.inputDivider} />
            <View style={styles.inputRow}><Ionicons name="globe-outline" size={18} color={yunke.textSecondary} /><TextInput style={styles.input} placeholder="Sitio Web" placeholderTextColor={yunke.textSecondary} value={webUrl} onChangeText={setWebUrl} autoCapitalize="none" /></View>
            <View style={styles.inputDivider} />
            <View style={styles.inputRow}><Ionicons name="logo-instagram" size={18} color={yunke.textSecondary} /><TextInput style={styles.input} placeholder="Instagram" placeholderTextColor={yunke.textSecondary} value={instagram} onChangeText={setInstagram} autoCapitalize="none" /></View>
          </View>

          <Text style={styles.sectionTitle}>CONTACTO</Text>
          <View style={styles.inputGroup}>
            <View style={styles.inputRow}><Ionicons name="call-outline" size={18} color={yunke.textSecondary} /><TextInput style={styles.input} placeholder="Teléfono" placeholderTextColor={yunke.textSecondary} value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" /></View>
            <View style={styles.inputDivider} />
            <View style={styles.inputRow}><Ionicons name="location-outline" size={18} color={yunke.textSecondary} /><TextInput style={styles.input} placeholder="Dirección" placeholderTextColor={yunke.textSecondary} value={direccion} onChangeText={setDireccion} /></View>
            <View style={styles.inputDivider} />
            <View style={styles.inputRow}><Ionicons name="time-outline" size={18} color={yunke.textSecondary} /><TextInput style={styles.input} placeholder="Horarios" placeholderTextColor={yunke.textSecondary} value={horarios} onChangeText={setHorarios} /></View>
          </View>

          {/* GALERÍA DE IMÁGENES */}
          <Text style={styles.sectionTitle}>GALERÍA</Text>
          <View style={styles.galleryContainer}>
            {galleryImages.map((img) => (
              <View key={img.id} style={styles.galleryItem}>
                <Image source={{ uri: img.localUri || img.url }} style={styles.galleryThumbnail} resizeMode="cover" />
                <Pressable style={styles.galleryRemoveBtn} onPress={() => removeGalleryImage(img.id)}>
                  <Ionicons name="close-circle" size={22} color={yunke.red} />
                </Pressable>
              </View>
            ))}
            <Pressable style={styles.galleryAddBtn} onPress={pickGalleryImage}>
              <Ionicons name="add" size={28} color={yunke.textSecondary} />
              <Text style={styles.galleryAddText}>Agregar</Text>
            </Pressable>
          </View>

          <Pressable style={styles.saveButton} onPress={handleGuardar} disabled={saving}>
            {saving ? <ActivityIndicator color={yunke.white} /> : (
              <><Ionicons name="checkmark-circle-outline" size={18} color={yunke.white} /><Text style={styles.saveButtonText}>{isEditing ? 'Guardar Cambios' : 'Crear Sponsor'}</Text></>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: yunke.surface },
  header: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  backButton: { flexDirection: 'row', alignItems: 'center', paddingBottom: 16, gap: 4 },
  backText: { fontSize: 16, fontFamily: 'Montserrat_500Medium', color: yunke.white },
  headerTitle: { fontSize: 26, fontFamily: 'Montserrat_900Black', color: yunke.white, letterSpacing: -0.5 },
  portadaContainer: { marginHorizontal: 24, marginTop: 20, marginBottom: 16 },
  portada: { width: '100%', height: 160, borderRadius: 16, backgroundColor: yunke.card, justifyContent: 'center', alignItems: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 24 },
  logo: { width: 100, height: 100, borderRadius: 20, backgroundColor: yunke.card, justifyContent: 'center', alignItems: 'center' },
  placeholder: { borderWidth: 2, borderColor: yunke.border, borderStyle: 'dashed' },
  photoText: { fontSize: 12, fontFamily: 'Montserrat_500Medium', color: yunke.textSecondary, marginTop: 6 },
  inputGroup: { backgroundColor: yunke.card, borderRadius: 16, paddingHorizontal: 16, marginHorizontal: 24, marginBottom: 16, shadowColor: yunke.dark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 50 },
  input: { flex: 1, fontSize: 16, fontFamily: 'Montserrat_400Regular', color: yunke.text, paddingVertical: 12 },
  inputDivider: { height: 1, backgroundColor: yunke.border },
  sectionTitle: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold', color: yunke.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 28 },
  galleryContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginHorizontal: 24, marginBottom: 24 },
  galleryItem: { position: 'relative' },
  galleryThumbnail: { width: 80, height: 80, borderRadius: 12 },
  galleryRemoveBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: yunke.card, borderRadius: 11 },
  galleryAddBtn: { width: 80, height: 80, borderRadius: 12, borderWidth: 2, borderColor: yunke.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  galleryAddText: { fontSize: 10, fontFamily: 'Montserrat_500Medium', color: yunke.textSecondary, marginTop: 2 },
  saveButton: { backgroundColor: yunke.primary, marginHorizontal: 24, height: 52, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 8, shadowColor: yunke.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveButtonText: { color: yunke.white, fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
});

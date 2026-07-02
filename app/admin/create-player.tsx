import { yunke } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../../src/supabase';

export default function CreatePlayerScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEditing = !!id;
  
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [dorsal, setDorsal] = useState('');
  const [posicion, setPosicion] = useState('');
  const [categorias, setCategorias] = useState<any[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<number | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategorias();
    if (isEditing) fetchJugadorData(id as string);
  }, [id]);

  const fetchCategorias = async () => {
    const { data } = await supabase.from('categorias').select('*').eq('is_active', true).order('orden');
    if (data && data.length > 0) { setCategorias(data); setSelectedCategoria(data[0].id); }
  };

  const fetchJugadorData = async (jugadorId: string) => {
    const { data } = await supabase.from('jugadores').select('*').eq('id', jugadorId).single();
    if (data) {
      setNombre(data.nombre); setApellido(data.apellido || ''); setDorsal(data.dorsal?.toString() || '');
      setPosicion(data.posicion || ''); setSelectedCategoria(data.categoria_id); setImageUri(data.foto_url);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permiso denegado'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const handleGuardar = async () => {
    if (!nombre || !selectedCategoria) { Alert.alert('Error', 'El nombre y la categoría son obligatorios.'); return; }
    setSaving(true);
    let fotoUrl = null;

    try {
      if (imageUri && !imageUri.startsWith('http')) {
        const fileName = `${Date.now()}.jpg`;
        const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });
        const arrayBuffer = decode(base64);
        const { error: uploadError } = await supabase.storage.from('jugadores').upload(fileName, arrayBuffer, { contentType: 'image/jpeg' });
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('jugadores').getPublicUrl(fileName);
        fotoUrl = publicUrlData.publicUrl;
      } else if (imageUri) {
        fotoUrl = imageUri;
      }

      if (isEditing) {
        const { error } = await supabase.from('jugadores').update({ nombre, apellido: apellido || null, dorsal: dorsal ? parseInt(dorsal) : null, posicion: posicion || null, categoria_id: selectedCategoria, foto_url: fotoUrl }).eq('id', id);
        if (error) throw error;
        Alert.alert('Éxito', 'Jugador actualizado.');
      } else {
        const { error } = await supabase.from('jugadores').insert({ nombre, apellido: apellido || null, dorsal: dorsal ? parseInt(dorsal) : null, posicion: posicion || null, categoria_id: selectedCategoria, foto_url: fotoUrl, is_active: true });
        if (error) throw error;
        Alert.alert('Éxito', 'Jugador creado.');
      }
      router.back();
    } catch (error: any) { Alert.alert('Error', error.message); } finally { setSaving(false); }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
          <LinearGradient colors={yunke.gradientHeader} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color={yunke.white} />
              <Text style={styles.backText}>Volver</Text>
            </Pressable>
            <Text style={styles.headerTitle}>{isEditing ? 'Editar Jugador' : 'Nuevo Jugador'}</Text>
          </LinearGradient>

          <Pressable style={styles.photoContainer} onPress={pickImage}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.profilePhoto} />
            ) : (
              <View style={[styles.profilePhoto, styles.placeholderPhoto]}>
                <Ionicons name="camera-outline" size={36} color={yunke.textSecondary} />
                <Text style={styles.photoText}>Agregar Foto</Text>
              </View>
            )}
          </Pressable>

          <View style={styles.inputGroup}>
            <View style={styles.inputRow}><Ionicons name="person-outline" size={18} color={yunke.textSecondary} /><TextInput style={styles.input} placeholder="Nombre" placeholderTextColor={yunke.textSecondary} value={nombre} onChangeText={setNombre} /></View>
            <View style={styles.inputDivider} />
            <View style={styles.inputRow}><Ionicons name="person-outline" size={18} color={yunke.textSecondary} /><TextInput style={styles.input} placeholder="Apellido" placeholderTextColor={yunke.textSecondary} value={apellido} onChangeText={setApellido} /></View>
            <View style={styles.inputDivider} />
            <View style={styles.inputRow}><Ionicons name="keypad-outline" size={18} color={yunke.textSecondary} /><TextInput style={styles.input} placeholder="Dorsal" placeholderTextColor={yunke.textSecondary} value={dorsal} onChangeText={setDorsal} keyboardType="numeric" /></View>
            <View style={styles.inputDivider} />
            <View style={styles.inputRow}><Ionicons name="football-outline" size={18} color={yunke.textSecondary} /><TextInput style={styles.input} placeholder="Posición" placeholderTextColor={yunke.textSecondary} value={posicion} onChangeText={setPosicion} /></View>
          </View>

          <Text style={styles.sectionTitle}>CATEGORÍA</Text>
          <View style={styles.categoriesContainer}>
            {categorias.map((cat) => (
              <Pressable key={cat.id} style={[styles.categoryPill, selectedCategoria === cat.id && styles.categoryPillActive]} onPress={() => setSelectedCategoria(cat.id)}>
                <Text style={[styles.categoryText, selectedCategoria === cat.id && styles.categoryTextActive]}>{cat.nombre}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.saveButton} onPress={handleGuardar} disabled={saving}>
            {saving ? <ActivityIndicator color={yunke.white} /> : (
              <><Ionicons name="checkmark-circle-outline" size={18} color={yunke.white} /><Text style={styles.saveButtonText}>{isEditing ? 'Guardar Cambios' : 'Crear Jugador'}</Text></>
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
  photoContainer: { alignItems: 'center', marginTop: 24, marginBottom: 24 },
  profilePhoto: { width: 120, height: 120, borderRadius: 60, backgroundColor: yunke.card, justifyContent: 'center', alignItems: 'center' },
  placeholderPhoto: { borderWidth: 2, borderColor: yunke.border, borderStyle: 'dashed' },
  photoText: { fontSize: 13, fontFamily: 'Montserrat_500Medium', color: yunke.textSecondary, marginTop: 6 },
  inputGroup: { backgroundColor: yunke.card, borderRadius: 16, paddingHorizontal: 16, marginHorizontal: 24, shadowColor: yunke.dark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 50 },
  input: { flex: 1, fontSize: 16, fontFamily: 'Montserrat_400Regular', color: yunke.text, paddingVertical: 12 },
  inputDivider: { height: 1, backgroundColor: yunke.border },
  sectionTitle: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold', color: yunke.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 28, marginTop: 24 },
  categoriesContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, gap: 10, marginBottom: 24 },
  categoryPill: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, backgroundColor: yunke.card, borderWidth: 1, borderColor: yunke.border, shadowColor: yunke.dark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  categoryPillActive: { backgroundColor: yunke.primary, borderColor: yunke.primary },
  categoryText: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold', color: yunke.textSecondary },
  categoryTextActive: { color: yunke.white },
  saveButton: { backgroundColor: yunke.primary, marginHorizontal: 24, height: 52, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, shadowColor: yunke.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveButtonText: { color: yunke.white, fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
});

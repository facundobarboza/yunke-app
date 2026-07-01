import { Ionicons } from '@expo/vector-icons';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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

  // Cargar categorías para el selector
  useEffect(() => {
    fetchCategorias();
    if (isEditing) fetchJugadorData(id as string);
  }, [id]);

  const fetchCategorias = async () => {
    const { data } = await supabase.from('categorias').select('*').eq('is_active', true).order('orden');
    if (data && data.length > 0) {
      setCategorias(data);
      setSelectedCategoria(data[0].id);
    }
  };

  const fetchJugadorData = async (jugadorId: string) => {
    const { data, error } = await supabase
      .from('jugadores')
      .select('*')
      .eq('id', jugadorId)
      .single();
    
    if (data) {
      setNombre(data.nombre);
      setApellido(data.apellido || '');
      setDorsal(data.dorsal?.toString() || '');
      setPosicion(data.posicion || '');
      setSelectedCategoria(data.categoria_id);
      setImageUri(data.foto_url); // Cargamos la foto actual
    }
  };

  // Elegir foto de la galería
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería para subir fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1], // Forzar cuadrado
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Guardar jugador en Supabase
  const handleGuardar = async () => {
    if (!nombre || !selectedCategoria) {
      Alert.alert('Error', 'El nombre y la categoría son obligatorios.');
      return;
    }

    setSaving(true);
    let fotoUrl = null;

    try {
      // 1. Manejo de la imagen
      // Si la imagen NO empieza con "http", significa que es una foto nueva elegida de la galería
      if (imageUri && !imageUri.startsWith('http')) {
        const fileName = `${Date.now()}.jpg`;
        
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        const arrayBuffer = decode(base64);

        const { error: uploadError } = await supabase.storage
          .from('jugadores')
          .upload(fileName, arrayBuffer, {
            contentType: 'image/jpeg',
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('jugadores')
          .getPublicUrl(fileName);

        fotoUrl = publicUrlData.publicUrl;
      } else if (imageUri) {
        // Si la imagen ya empieza con "http", es la foto que ya tenía, la dejamos tal cual
        fotoUrl = imageUri;
      }

      // 2. Guardamos o Actualizamos el registro
      if (isEditing) {
        // ACTUALIZAR
        const { error: updateError } = await supabase
          .from('jugadores')
          .update({
            nombre,
            apellido: apellido || null,
            dorsal: dorsal ? parseInt(dorsal) : null,
            posicion: posicion || null,
            categoria_id: selectedCategoria,
            foto_url: fotoUrl
          })
          .eq('id', id);
        if (updateError) throw updateError;
        Alert.alert('Éxito', 'Jugador actualizado correctamente.');
      } else {
        // CREAR
        const { error: insertError } = await supabase
          .from('jugadores')
          .insert({
            nombre,
            apellido: apellido || null,
            dorsal: dorsal ? parseInt(dorsal) : null,
            posicion: posicion || null,
            categoria_id: selectedCategoria,
            foto_url: fotoUrl,
            is_active: true
          });
        if (insertError) throw insertError;
        Alert.alert('Éxito', 'Jugador creado correctamente.');
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
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#007AFF" />
          <Text style={styles.backText}>Volver</Text>
        </Pressable>

        <Text style={styles.headerTitle}>{isEditing ? 'Editar Jugador' : 'Nuevo Jugador'}</Text>

        {/* Selector de Foto */}
        <Pressable style={styles.photoContainer} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.profilePhoto} />
          ) : (
            <View style={[styles.profilePhoto, styles.placeholderPhoto]}>
              <Ionicons name="camera-outline" size={40} color="#C7C7CC" />
              <Text style={styles.photoText}>Agregar Foto</Text>
            </View>
          )}
        </Pressable>

        {/* Formulario Agrupado (Estilo iOS) */}
        <View style={styles.inputGroup}>
          <TextInput style={styles.input} placeholder="Nombre" placeholderTextColor="#8E8E93" value={nombre} onChangeText={setNombre} />
          <View style={styles.inputDivider} />
          <TextInput style={styles.input} placeholder="Apellido" placeholderTextColor="#8E8E93" value={apellido} onChangeText={setApellido} />
          <View style={styles.inputDivider} />
          <TextInput style={styles.input} placeholder="Dorsal" placeholderTextColor="#8E8E93" value={dorsal} onChangeText={setDorsal} keyboardType="numeric" />
          <View style={styles.inputDivider} />
          <TextInput style={styles.input} placeholder="Posición (Ej: Pívot)" placeholderTextColor="#8E8E93" value={posicion} onChangeText={setPosicion} />
        </View>

        {/* Selector de Categoría */}
        <Text style={styles.sectionTitle}>CATEGORÍA</Text>
        <View style={styles.categoriesContainer}>
          {categorias.map((cat) => (
            <Pressable 
              key={cat.id} 
              style={[styles.categoryPill, selectedCategoria === cat.id && styles.categoryPillActive]}
              onPress={() => setSelectedCategoria(cat.id)}
            >
              <Text style={[styles.categoryText, selectedCategoria === cat.id && styles.categoryTextActive]}>
                {cat.nombre}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Botón Guardar */}
        <Pressable style={styles.saveButton} onPress={handleGuardar} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>{isEditing ? 'Guardar Cambios' : 'Crear Jugador'}</Text>}
        </Pressable>

      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  backButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 10 },
  backText: { fontSize: 17, color: '#007AFF', marginLeft: -4 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1C1C1E', paddingHorizontal: 24, letterSpacing: -1, marginBottom: 20 },

  // Foto
  photoContainer: { alignItems: 'center', marginBottom: 30 },
  profilePhoto: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  placeholderPhoto: { borderWidth: 2, borderColor: '#E5E5EA', borderStyle: 'dashed' },
  photoText: { fontSize: 14, color: '#8E8E93', marginTop: 8, fontWeight: '600' },

  // Inputs
  inputGroup: { backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 15, marginHorizontal: 24, marginBottom: 30 },
  input: { height: 50, fontSize: 16, color: '#1C1C1E' },
  inputDivider: { height: 1, backgroundColor: '#E5E5EA' },

  // Categorías
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#8E8E93', textTransform: 'uppercase', marginBottom: 10, marginLeft: 28 },
  categoriesContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, gap: 10, marginBottom: 40 },
  categoryPill: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E5EA' },
  categoryPillActive: { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  categoryText: { fontSize: 14, fontWeight: '600', color: '#8E8E93' },
  categoryTextActive: { color: '#FFFFFF' },

  // Guardar
  saveButton: { backgroundColor: '#FF3B30', marginHorizontal: 24, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
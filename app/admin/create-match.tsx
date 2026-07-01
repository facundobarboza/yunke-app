
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../../src/supabase';

export default function CreateMatchScreen() {
  const router = useRouter();

  const { id } = useLocalSearchParams();
  const isEditing = !!id;

  const [categorias, setCategorias] = useState<any[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<number | null>(null);
  
  const [rival, setRival] = useState('');
  const [competicion, setCompeticion] = useState('');
  const [esLocal, setEsLocal] = useState(true);
  const [escudoUri, setEscudoUri] = useState<string | null>(null);
  const [rivales, setRivales] = useState<any[]>([]);
  
  // AQUÍ ESTÁN LOS ESTADOS DE FECHA
  const [fecha, setFecha] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [mode, setMode] = useState<'date' | 'time'>('date');
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategorias();
    fetchRivales();
    if (isEditing) fetchMatchData(id as string);
  }, [id]);

  const fetchRivales = async () => {
    const { data } = await supabase.from('rivales').select('id, nombre, escudo_url').order('nombre');
    if (data) setRivales(data);
  };

  const fetchCategorias = async () => {
    const { data } = await supabase.from('categorias').select('*').eq('is_active', true).order('orden');
    if (data && data.length > 0) {
      setCategorias(data);
      setSelectedCategoria(data[0].id);
    }
  };

  const fetchMatchData = async (matchId: string) => {
    const { data, error } = await supabase
      .from('partidos')
      .select('*')
      .eq('id', matchId)
      .single();
    
    if (data) {
      setRival(data.rival);
      setCompeticion(data.competicion || '');
      setEsLocal(data.es_local);
      setFecha(new Date(data.fecha));
      setSelectedCategoria(data.categoria_id);
      setEscudoUri(data.escudo_url);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'dismissed') return;
    }
    
    const currentDate = selectedDate || fecha;
    setFecha(currentDate);

    if (Platform.OS === 'android' && mode === 'date') {
      setTimeout(() => {
        setMode('time');
        setShowPicker(true);
      }, 100);
    }
  };

  const showDatepicker = () => {
    if (Platform.OS === 'ios') {
      setShowPicker(true);
    } else {
      setMode('date');
      setShowPicker(true);
    }
  };

    const handleGuardar = async () => {
    if (!rival || !selectedCategoria) {
      Alert.alert('Error', 'El rival y la categoría son obligatorios.');
      return;
    }

    setSaving(true);

    // 1. Corrección de zona horaria para Android
    let fechaParaGuardar = fecha;
    if (Platform.OS === 'android') {
      const offset = fecha.getTimezoneOffset() * 60000;
      fechaParaGuardar = new Date(fecha.getTime() - offset);
    }

    // 2. Lógica para el escudo del rival
    let finalEscudoUrl = escudoUri;

    // Si el escudo es una imagen nueva (no empieza con http), la subimos
    if (escudoUri && !escudoUri.startsWith('http')) {
      try {
        const fileName = `${Date.now()}.jpg`;
        const base64 = await FileSystem.readAsStringAsync(escudoUri, { encoding: FileSystem.EncodingType.Base64 });
        const arrayBuffer = decode(base64);
        
        await supabase.storage.from('escudos').upload(fileName, arrayBuffer, { contentType: 'image/jpeg' });
        const { data } = supabase.storage.from('escudos').getPublicUrl(fileName);
        finalEscudoUrl = data.publicUrl;

        // Guardamos el rival en la tabla 'rivales' para futuros partidos
        const rivalExistente = rivales.find(r => r.nombre.toLowerCase() === rival.toLowerCase());
        if (!rivalExistente) {
          await supabase.from('rivales').insert({ nombre: rival, escudo_url: finalEscudoUrl });
        }
      } catch (uploadError: any) {
        Alert.alert('Error al subir escudo', uploadError.message);
        setSaving(false);
        return;
      }
    }

    // 3. Guardar o Actualizar el Partido
    try {
      if (isEditing) {
        const { error } = await supabase.from('partidos').update({
          categoria_id: selectedCategoria,
          rival,
          competicion: competicion || null,
          es_local: esLocal,
          fecha: fechaParaGuardar.toISOString(),
          escudo_url: finalEscudoUrl,
        }).eq('id', id);

        if (error) throw error;
        Alert.alert('Éxito', 'Partido actualizado correctamente.');
      } else {
        const { error } = await supabase.from('partidos').insert({
          categoria_id: selectedCategoria,
          rival,
          competicion: competicion || null,
          es_local: esLocal,
          fecha: fechaParaGuardar.toISOString(),
          jugado: false,
          is_active: true,
          escudo_url: finalEscudoUrl,
        });

        if (error) throw error;
        Alert.alert('Éxito', 'Partido creado correctamente.');
      }
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  // Cuando el admin termina de escribir el rival, buscamos si ya tiene escudo
  const handleRivalChange = (text: string) => {
    setRival(text);
    const rivalExistente = rivales.find(r => r.nombre.toLowerCase() === text.toLowerCase());
    if (rivalExistente) {
      setEscudoUri(rivalExistente.escudo_url);
    } else {
      setEscudoUri(null); // Si no existe, limpiamos el escudo
    }
  };

  const pickEscudo = async () => {
    // Pedimos permiso explícitamente para Android
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería para subir el escudo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) setEscudoUri(result.assets[0].uri);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#007AFF" />
          <Text style={styles.backText}>Volver</Text>
        </Pressable>

        <Text style={styles.headerTitle}>{isEditing ? 'Editar Partido' : 'Nuevo Partido'}</Text>

        <Text style={styles.sectionTitle}>LOCALÍA</Text>
        <View style={styles.localiaContainer}>
          <Pressable style={[styles.localiaBtn, esLocal && styles.localiaActive]} onPress={() => setEsLocal(true)}>
            <Text style={[styles.localiaText, esLocal && styles.localiaTextActive]}>Local</Text>
          </Pressable>
          <Pressable style={[styles.localiaBtn, !esLocal && styles.localiaActive]} onPress={() => setEsLocal(false)}>
            <Text style={[styles.localiaText, !esLocal && styles.localiaTextActive]}>Visitante</Text>
          </Pressable>
        </View>

        <View style={styles.inputGroup}>
          <TextInput style={styles.input} placeholder="Rival" placeholderTextColor="#8E8E93" value={rival} onChangeText={setRival} />
          <View style={styles.inputDivider} />
          <TextInput style={styles.input} placeholder="Competición (Ej: Liga, Copa)" placeholderTextColor="#8E8E93" value={competicion} onChangeText={setCompeticion} />
        </View>

                {/* GALERÍA DE RIVALES Y SELECTOR DE ESCUDO */}
        <Text style={styles.sectionTitle}>ESCUDO DEL RIVAL</Text>
        
        {/* Galería de rivales ya cargados */}
        {rivales.length > 0 && (
          <View style={styles.rivalesGallery}>
            <Text style={styles.galleryHint}>Elige un rival existente:</Text>
            <FlatList
              data={rivales}
              horizontal
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 10, gap: 15 }}
              renderItem={({ item }) => (
                <Pressable 
                  style={[styles.rivalCard, rival.toLowerCase() === item.nombre.toLowerCase() && styles.rivalCardActive]} 
                  onPress={() => {
                    setRival(item.nombre);
                    setEscudoUri(item.escudo_url);
                  }}
                >
                  {item.escudo_url ? (
                    <Image source={{ uri: item.escudo_url }} style={styles.rivalEscudo} />
                  ) : (
                    <View style={[styles.rivalEscudo, styles.placeholder]}><Ionicons name="shield-outline" size={20} color="#C7C7CC" /></View>
                  )}
                  <Text style={styles.rivalName} numberOfLines={1}>{item.nombre}</Text>
                </Pressable>
              )}
            />
          </View>
        )}

        {/* Botón para subir un escudo nuevo si el rival no está en la galería */}
        <Text style={styles.galleryHint}>O sube uno nuevo (se guardará para el futuro):</Text>
        <Pressable style={styles.escudoContainer} onPress={pickEscudo}>
          {escudoUri ? (
            <Image source={{ uri: escudoUri }} style={styles.escudoImage} />
          ) : (
            <View style={[styles.escudoImage, styles.placeholder]}>
              <Ionicons name="shield-outline" size={30} color="#C7C7CC" />
              <Text style={styles.photoText}>Subir Escudo</Text>
            </View>
          )}
        </Pressable>

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

        <Text style={styles.sectionTitle}>FECHA Y HORA</Text>
        <View style={styles.dateButtonsContainer}>
          <Pressable style={styles.dateBtn} onPress={showDatepicker}>
            <Ionicons name="calendar-outline" size={20} color="#007AFF" />
            <Text style={styles.dateText}>
              {fecha.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          </Pressable>

          <Pressable style={styles.dateBtn} onPress={showDatepicker}>
            <Ionicons name="time-outline" size={20} color="#007AFF" />
            <Text style={styles.dateText}>
              {fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </Pressable>
        </View>

        {showPicker && (
          <DateTimePicker
            value={fecha}
            mode={Platform.OS === 'ios' ? 'datetime' : mode}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            locale="es-ES"
          />
        )}

        <Pressable style={styles.saveButton} onPress={handleGuardar} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>{isEditing ? 'Guardar Cambios' : 'Crear Partido'}</Text>}
        </Pressable>

      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  backButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 10 },
  backText: { fontSize: 17, color: '#007AFF', marginLeft: -4 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1C1C1E', paddingHorizontal: 24, letterSpacing: -1, marginBottom: 30 },
  
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#8E8E93', textTransform: 'uppercase', marginBottom: 10, marginLeft: 28, marginTop: 20 },
  
  localiaContainer: { flexDirection: 'row', paddingHorizontal: 24, gap: 10, marginBottom: 10 },
  localiaBtn: { flex: 1, height: 48, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E5EA', justifyContent: 'center', alignItems: 'center' },
  localiaActive: { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  localiaText: { fontSize: 15, fontWeight: '600', color: '#8E8E93' },
  localiaTextActive: { color: '#FFFFFF' },

  inputGroup: { backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 15, marginHorizontal: 24, marginBottom: 10, marginTop: 20 },
  input: { height: 50, fontSize: 16, color: '#1C1C1E' },
  inputDivider: { height: 1, backgroundColor: '#E5E5EA' },

  rivalesGallery: { marginBottom: 20, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 10, marginHorizontal: 24 },
  galleryHint: { fontSize: 13, color: '#8E8E93', marginLeft: 28, marginBottom: 5 },
  rivalCard: { alignItems: 'center', width: 70, paddingVertical: 8, borderRadius: 10, borderWidth: 2, borderColor: 'transparent' },
  rivalCardActive: { borderColor: '#007AFF', backgroundColor: '#F0F8FF' },
  rivalEscudo: { width: 40, height: 40, marginBottom: 5, borderRadius: 20 },
  rivalName: { fontSize: 11, color: '#1C1C1E', textAlign: 'center', fontWeight: '500' },
  
  escudoContainer: { alignItems: 'center', marginBottom: 20 },
  escudoImage: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E5EA' },
  placeholder: { borderWidth: 2, borderStyle: 'dashed' },
  photoText: { fontSize: 12, color: '#8E8E93', marginTop: 6, fontWeight: '600' },

  categoriesContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, gap: 10 },
  categoryPill: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E5EA' },
  categoryPillActive: { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  categoryText: { fontSize: 14, fontWeight: '600', color: '#8E8E93' },
  categoryTextActive: { color: '#FFFFFF' },

  dateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 24, borderRadius: 12, padding: 16, gap: 10 },
  dateText: { fontSize: 15, color: '#1C1C1E', fontWeight: '500', textTransform: 'capitalize' },

  dateButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 24,
  },

  saveButton: { backgroundColor: '#FF3B30', marginHorizontal: 24, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
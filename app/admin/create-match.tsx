import { yunke } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../src/supabase';

export default function CreateMatchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEditing = !!id;

  const [categorias, setCategorias] = useState<any[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<number | null>(null);
  const [rival, setRival] = useState('');
  const [competicion, setCompeticion] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [esLocal, setEsLocal] = useState(true);
  const [escudoUri, setEscudoUri] = useState<string | null>(null);
  const [rivales, setRivales] = useState<any[]>([]);
  const [fecha, setFecha] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [mode, setMode] = useState<'date' | 'time'>('date');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCategorias(); fetchRivales(); if (isEditing) fetchMatchData(id as string); }, [id]);

  const fetchRivales = async () => { const { data } = await supabase.from('rivales').select('id, nombre, escudo_url').order('nombre'); if (data) setRivales(data); };
  const fetchCategorias = async () => { const { data } = await supabase.from('categorias').select('*').eq('is_active', true).order('orden'); if (data && data.length > 0) { setCategorias(data); setSelectedCategoria(data[0].id); } };

  const fetchMatchData = async (matchId: string) => {
    const { data } = await supabase.from('partidos').select('*').eq('id', matchId).single();
    if (data) { setRival(data.rival); setCompeticion(data.competicion || ''); setUbicacion(data.ubicacion || ''); setEsLocal(data.es_local); setFecha(new Date(data.fecha)); setSelectedCategoria(data.categoria_id); setEscudoUri(data.escudo_url); }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') { setShowPicker(false); if (event.type === 'dismissed') return; }
    const currentDate = selectedDate || fecha; setFecha(currentDate);
    if (Platform.OS === 'android' && mode === 'date') { setTimeout(() => { setMode('time'); setShowPicker(true); }, 100); }
  };

  const showDatepicker = () => { if (Platform.OS === 'ios') { setShowPicker(true); } else { setMode('date'); setShowPicker(true); } };

  const handleGuardar = async () => {
    if (!rival || !selectedCategoria) { Alert.alert('Error', 'El rival y la categoría son obligatorios.'); return; }
    setSaving(true);
    let fechaParaGuardar = fecha;
    if (Platform.OS === 'android') { const offset = fecha.getTimezoneOffset() * 60000; fechaParaGuardar = new Date(fecha.getTime() - offset); }

    let finalEscudoUrl = escudoUri;
    if (escudoUri && !escudoUri.startsWith('http')) {
      try {
        const fileName = `${Date.now()}.jpg`;
        const base64 = await FileSystem.readAsStringAsync(escudoUri, { encoding: FileSystem.EncodingType.Base64 });
        const arrayBuffer = decode(base64);
        await supabase.storage.from('escudos').upload(fileName, arrayBuffer, { contentType: 'image/jpeg' });
        const { data } = supabase.storage.from('escudos').getPublicUrl(fileName);
        finalEscudoUrl = data.publicUrl;
        const rivalExistente = rivales.find(r => r.nombre.toLowerCase() === rival.toLowerCase());
        if (!rivalExistente) await supabase.from('rivales').insert({ nombre: rival, escudo_url: finalEscudoUrl });
      } catch (uploadError: any) { Alert.alert('Error al subir escudo', uploadError.message); setSaving(false); return; }
    }

    try {
      if (isEditing) {
        const { error } = await supabase.from('partidos').update({ categoria_id: selectedCategoria, rival, competicion: competicion || null, ubicacion: ubicacion || null, es_local: esLocal, fecha: fechaParaGuardar.toISOString(), escudo_url: finalEscudoUrl }).eq('id', id);
        if (error) throw error; Alert.alert('Éxito', 'Partido actualizado.');
      } else {
        const { error } = await supabase.from('partidos').insert({ categoria_id: selectedCategoria, rival, competicion: competicion || null, ubicacion: ubicacion || null, es_local: esLocal, fecha: fechaParaGuardar.toISOString(), jugado: false, is_active: true, escudo_url: finalEscudoUrl });
        if (error) throw error; Alert.alert('Éxito', 'Partido creado.');
      }
      router.back();
    } catch (error: any) { Alert.alert('Error', error.message); } finally { setSaving(false); }
  };

  const handleRivalChange = (text: string) => {
    setRival(text);
    const rivalExistente = rivales.find(r => r.nombre.toLowerCase() === text.toLowerCase());
    if (rivalExistente) setEscudoUri(rivalExistente.escudo_url); else setEscudoUri(null);
  };

  const pickEscudo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permiso denegado'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled) setEscudoUri(result.assets[0].uri);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}>
        <LinearGradient colors={yunke.gradientHeader} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={yunke.white} />
            <Text style={styles.backText}>Volver</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{isEditing ? 'Editar Partido' : 'Nuevo Partido'}</Text>
        </LinearGradient>

        <Text style={styles.sectionTitle}>LOCALÍA</Text>
        <View style={styles.localiaContainer}>
          <Pressable style={[styles.localiaBtn, esLocal && styles.localiaActive]} onPress={() => setEsLocal(true)}>
            <Ionicons name="home-outline" size={16} color={esLocal ? yunke.white : yunke.textSecondary} />
            <Text style={[styles.localiaText, esLocal && styles.localiaTextActive]}>Local</Text>
          </Pressable>
          <Pressable style={[styles.localiaBtn, !esLocal && styles.localiaActive]} onPress={() => setEsLocal(false)}>
            <Ionicons name="airplane-outline" size={16} color={!esLocal ? yunke.white : yunke.textSecondary} />
            <Text style={[styles.localiaText, !esLocal && styles.localiaTextActive]}>Visitante</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>DATOS DEL PARTIDO</Text>
        <View style={styles.inputGroup}>
          <View style={styles.inputRow}><Ionicons name="people-outline" size={18} color={yunke.textSecondary} /><TextInput style={styles.input} placeholder="Rival" placeholderTextColor={yunke.textSecondary} value={rival} onChangeText={handleRivalChange} /></View>
          <View style={styles.inputDivider} />
          <View style={styles.inputRow}><Ionicons name="trophy-outline" size={18} color={yunke.textSecondary} /><TextInput style={styles.input} placeholder="Competición" placeholderTextColor={yunke.textSecondary} value={competicion} onChangeText={setCompeticion} /></View>
          <View style={styles.inputDivider} />
          <View style={styles.inputRow}><Ionicons name="location-outline" size={18} color={yunke.textSecondary} /><TextInput style={styles.input} placeholder="Ubicación" placeholderTextColor={yunke.textSecondary} value={ubicacion} onChangeText={setUbicacion} /></View>
        </View>

        <Text style={styles.sectionTitle}>ESCUDO DEL RIVAL</Text>
        {rivales.length > 0 && (
          <View style={styles.rivalesGallery}>
            <FlatList data={rivales} horizontal keyExtractor={(item) => item.id} showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 10, gap: 12 }}
              renderItem={({ item }) => (
                <Pressable style={[styles.rivalCard, rival.toLowerCase() === item.nombre.toLowerCase() && styles.rivalCardActive]} onPress={() => { setRival(item.nombre); setEscudoUri(item.escudo_url); }}>
                  {item.escudo_url ? <Image source={{ uri: item.escudo_url }} style={styles.rivalEscudo} /> : <View style={[styles.rivalEscudo, styles.placeholder]}><Ionicons name="shield-outline" size={18} color={yunke.textTertiary} /></View>}
                  <Text style={styles.rivalName} numberOfLines={1}>{item.nombre}</Text>
                </Pressable>
              )} />
          </View>
        )}
        <Pressable style={styles.escudoContainer} onPress={pickEscudo}>
          {escudoUri ? <Image source={{ uri: escudoUri }} style={styles.escudoImage} /> : (
            <View style={[styles.escudoImage, styles.placeholder]}><Ionicons name="shield-outline" size={28} color={yunke.textSecondary} /><Text style={styles.photoText}>Subir Escudo</Text></View>
          )}
        </Pressable>

        <Text style={styles.sectionTitle}>CATEGORÍA</Text>
        <View style={styles.categoriesContainer}>
          {categorias.map((cat) => (
            <Pressable key={cat.id} style={[styles.categoryPill, selectedCategoria === cat.id && styles.categoryPillActive]} onPress={() => setSelectedCategoria(cat.id)}>
              <Text style={[styles.categoryText, selectedCategoria === cat.id && styles.categoryTextActive]}>{cat.nombre}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>FECHA Y HORA</Text>
        <View style={styles.dateButtonsContainer}>
          <Pressable style={styles.dateBtn} onPress={showDatepicker}>
            <Ionicons name="calendar-outline" size={18} color={yunke.primary} />
            <Text style={styles.dateText}>{fecha.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</Text>
          </Pressable>
          <Pressable style={styles.dateBtn} onPress={showDatepicker}>
            <Ionicons name="time-outline" size={18} color={yunke.primary} />
            <Text style={styles.dateText}>{fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</Text>
          </Pressable>
        </View>

        {showPicker && <DateTimePicker value={fecha} mode={Platform.OS === 'ios' ? 'datetime' : mode} display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onDateChange} locale="es-ES" />}

        <Pressable style={styles.saveButton} onPress={handleGuardar} disabled={saving}>
          {saving ? <ActivityIndicator color={yunke.white} /> : (
            <><Ionicons name="checkmark-circle-outline" size={18} color={yunke.white} /><Text style={styles.saveButtonText}>{isEditing ? 'Guardar Cambios' : 'Crear Partido'}</Text></>
          )}
        </Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: yunke.surface },
  header: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  backButton: { flexDirection: 'row', alignItems: 'center', paddingBottom: 16, gap: 4 },
  backText: { fontSize: 16, fontFamily: 'Montserrat_500Medium', color: yunke.white },
  headerTitle: { fontSize: 26, fontFamily: 'Montserrat_900Black', color: yunke.white, letterSpacing: -0.5 },
  sectionTitle: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold', color: yunke.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 28, marginTop: 24 },
  localiaContainer: { flexDirection: 'row', paddingHorizontal: 24, gap: 10 },
  localiaBtn: { flex: 1, flexDirection: 'row', height: 48, borderRadius: 14, backgroundColor: yunke.card, borderWidth: 1, borderColor: yunke.border, justifyContent: 'center', alignItems: 'center', gap: 6, shadowColor: yunke.dark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  localiaActive: { backgroundColor: yunke.primary, borderColor: yunke.primary },
  localiaText: { fontSize: 15, fontFamily: 'Montserrat_600SemiBold', color: yunke.textSecondary },
  localiaTextActive: { color: yunke.white },
  inputGroup: { backgroundColor: yunke.card, borderRadius: 16, paddingHorizontal: 16, marginHorizontal: 24, shadowColor: yunke.dark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 50 },
  input: { flex: 1, fontSize: 16, fontFamily: 'Montserrat_400Regular', color: yunke.text, paddingVertical: 12 },
  inputDivider: { height: 1, backgroundColor: yunke.border },
  rivalesGallery: { marginBottom: 16, backgroundColor: yunke.card, borderRadius: 16, padding: 10, marginHorizontal: 24, shadowColor: yunke.dark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  rivalCard: { alignItems: 'center', width: 70, paddingVertical: 8, borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  rivalCardActive: { borderColor: yunke.primary, backgroundColor: yunke.primary + '10' },
  rivalEscudo: { width: 40, height: 40, marginBottom: 5, borderRadius: 20 },
  rivalName: { fontSize: 11, fontFamily: 'Montserrat_500Medium', color: yunke.text, textAlign: 'center' },
  placeholder: { borderWidth: 2, borderStyle: 'dashed', borderColor: yunke.border, justifyContent: 'center', alignItems: 'center' },
  escudoContainer: { alignItems: 'center', marginBottom: 16 },
  escudoImage: { width: 100, height: 100, borderRadius: 50, backgroundColor: yunke.card, justifyContent: 'center', alignItems: 'center' },
  photoText: { fontSize: 12, fontFamily: 'Montserrat_500Medium', color: yunke.textSecondary, marginTop: 6 },
  categoriesContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, gap: 10 },
  categoryPill: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, backgroundColor: yunke.card, borderWidth: 1, borderColor: yunke.border, shadowColor: yunke.dark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  categoryPillActive: { backgroundColor: yunke.primary, borderColor: yunke.primary },
  categoryText: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold', color: yunke.textSecondary },
  categoryTextActive: { color: yunke.white },
  dateButtonsContainer: { flexDirection: 'row', gap: 10, marginHorizontal: 24 },
  dateBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: yunke.card, borderRadius: 14, padding: 16, gap: 10, shadowColor: yunke.dark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  dateText: { fontSize: 14, fontFamily: 'Montserrat_500Medium', color: yunke.text, textTransform: 'capitalize', flex: 1 },
  saveButton: { backgroundColor: yunke.primary, marginHorizontal: 24, height: 52, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 32, shadowColor: yunke.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveButtonText: { color: yunke.white, fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
});

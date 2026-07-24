import { yunke } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AdminGuard } from '../../src/components/AdminGuard';
import { supabase } from '../../src/supabase';

export default function CreatePlayerScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEditing = !!id;

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [posicion, setPosicion] = useState('');
  const [dorsal, setDorsal] = useState('');
  const [dni, setDni] = useState('');
  const [nacionalidad, setNacionalidad] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [instagram, setInstagram] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [isCapitan, setIsCapitan] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<number | null>(null);
  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
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
      setNombre(data.nombre);
      setApellido(data.apellido || '');
      setPosicion(data.posicion || '');
      setDorsal(data.dorsal?.toString() || '');
      setDni(data.dni || '');
      setNacionalidad(data.nacionalidad || '');
      setFechaNacimiento(data.fecha_nacimiento || '');
      setInstagram(data.instagram || '');
      setDescripcion(data.descripcion || '');
      setIsCapitan(data.is_capitan || false);
      setSelectedCategoria(data.categoria_id);
      setImageUri(data.foto_url);
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

      // Lógica de capitán: solo uno por categoría
      if (isCapitan) {
        // Buscar el capitán actual de esta categoría
        const { data: capitanActual } = await supabase
          .from('jugadores')
          .select('id')
          .eq('categoria_id', selectedCategoria)
          .eq('is_capitan', true)
          .eq('is_active', true)
          .maybeSingle();

        // Si hay un capitán distinto al jugador actual, quitarle la capitanía
        if (capitanActual && capitanActual.id !== id) {
          await supabase.from('jugadores').update({ is_capitan: false }).eq('id', capitanActual.id);
        }
      }

      const payload = {
        nombre,
        apellido: apellido || null,
        posicion: posicion || null,
        dorsal: dorsal ? parseInt(dorsal, 10) : null,
        dni: dni || null,
        nacionalidad: nacionalidad || null,
        fecha_nacimiento: fechaNacimiento || null,
        instagram: instagram || null,
        descripcion: descripcion || null,
        is_capitan: isCapitan,
        categoria_id: selectedCategoria,
        foto_url: fotoUrl,
      };

      if (isEditing) {
        const { error } = await supabase.from('jugadores').update(payload).eq('id', id);
        if (error) throw error;
        Alert.alert('Éxito', 'Jugador actualizado.');
      } else {
        const { error } = await supabase.from('jugadores').insert({ ...payload, is_active: true });
        if (error) throw error;
        Alert.alert('Éxito', 'Jugador creado.');
      }
      router.back();
    } catch (error: any) { Alert.alert('Error', error.message); } finally { setSaving(false); }
  };

  const getCategoriaNombre = () => {
    const cat = categorias.find(c => c.id === selectedCategoria);
    return cat ? cat.nombre : 'Seleccionar categoría';
  };

  return (
    <AdminGuard permission="gestionar_jugadores">
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

          {/* Campos de texto */}
          <Text style={styles.sectionTitle}>DATOS PERSONALES</Text>
          <View style={styles.inputGroup}>
            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={18} color={yunke.textSecondary} />
              <TextInput style={styles.input} placeholder="Nombre" placeholderTextColor={yunke.textSecondary} value={nombre} onChangeText={setNombre} />
            </View>
            <View style={styles.inputDivider} />
            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={18} color={yunke.textSecondary} />
              <TextInput style={styles.input} placeholder="Apellido" placeholderTextColor={yunke.textSecondary} value={apellido} onChangeText={setApellido} />
            </View>
            <View style={styles.inputDivider} />
            <View style={styles.inputRow}>
              <Ionicons name="card-outline" size={18} color={yunke.textSecondary} />
              <TextInput style={styles.input} placeholder="DNI" placeholderTextColor={yunke.textSecondary} value={dni} onChangeText={setDni} keyboardType="numeric" />
            </View>
            <View style={styles.inputDivider} />
            <View style={styles.inputRow}>
              <Ionicons name="globe-outline" size={18} color={yunke.textSecondary} />
              <TextInput style={styles.input} placeholder="Nacionalidad" placeholderTextColor={yunke.textSecondary} value={nacionalidad} onChangeText={setNacionalidad} />
            </View>
            <View style={styles.inputDivider} />
            <Pressable style={styles.inputRow} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={18} color={yunke.textSecondary} />
              <Text style={[styles.input, !fechaNacimiento && { color: yunke.textSecondary }]}>
                {fechaNacimiento ? fechaNacimiento.split('-').reverse().join('-') : 'Fecha de nacimiento'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={yunke.textSecondary} />
            </Pressable>
          </View>

          {showDatePicker && Platform.OS === 'ios' && (
            <Modal visible={showDatePicker} transparent animationType="slide">
              <Pressable style={styles.dateModalOverlay} onPress={() => setShowDatePicker(false)}>
                <View style={styles.dateModalContent}>
                  <View style={styles.dateModalHeader}>
                    <Pressable onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.dateModalCancel}>Cancelar</Text>
                    </Pressable>
                    <Text style={styles.dateModalTitle}>Fecha de nacimiento</Text>
                    <Pressable onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.dateModalDone}>Listo</Text>
                    </Pressable>
                  </View>
                  <DateTimePicker
                    value={fechaNacimiento ? new Date(fechaNacimiento + 'T00:00:00') : new Date(2000, 0, 1)}
                    mode="date"
                    display="spinner"
                    maximumDate={new Date()}
                    minimumDate={new Date(1950, 0, 1)}
                    onChange={(_, date) => {
                      if (date) {
                        const iso = date.toISOString().split('T')[0];
                        setFechaNacimiento(iso);
                      }
                    }}
                  />
                </View>
              </Pressable>
            </Modal>
          )}

          {showDatePicker && Platform.OS === 'android' && (
            <DateTimePicker
              value={fechaNacimiento ? new Date(fechaNacimiento + 'T00:00:00') : new Date(2000, 0, 1)}
              mode="date"
              display="default"
              maximumDate={new Date()}
              minimumDate={new Date(1950, 0, 1)}
              onChange={(_, date) => {
                setShowDatePicker(false);
                if (date) {
                  const iso = date.toISOString().split('T')[0];
                  setFechaNacimiento(iso);
                }
              }}
            />
          )}

          {/* Datos deportivos */}
          <Text style={styles.sectionTitle}>DATOS DEPORTIVOS</Text>
          <View style={styles.inputGroup}>
            <View style={styles.inputRow}>
              <Ionicons name="football-outline" size={18} color={yunke.textSecondary} />
              <TextInput style={styles.input} placeholder="Posición" placeholderTextColor={yunke.textSecondary} value={posicion} onChangeText={setPosicion} />
            </View>
            <View style={styles.inputDivider} />
            <View style={styles.inputRow}>
              <Ionicons name="keypad-outline" size={18} color={yunke.textSecondary} />
              <TextInput style={styles.input} placeholder="Dorsal" placeholderTextColor={yunke.textSecondary} value={dorsal} onChangeText={setDorsal} keyboardType="numeric" />
            </View>
          </View>

          {/* Instagram */}
          <Text style={styles.sectionTitle}>REDES SOCIALES</Text>
          <View style={styles.inputGroup}>
            <View style={styles.inputRow}>
              <Ionicons name="logo-instagram" size={18} color={yunke.textSecondary} />
              <TextInput style={styles.input} placeholder="Instagram (usuario)" placeholderTextColor={yunke.textSecondary} value={instagram} onChangeText={setInstagram} autoCapitalize="none" />
            </View>
          </View>

          {/* Descripción */}
          <Text style={styles.sectionTitle}>DESCRIPCIÓN</Text>
          <View style={styles.inputGroup}>
            <View style={[styles.inputRow, { alignItems: 'flex-start', minHeight: 80, paddingTop: 12 }]}>
              <Ionicons name="document-text-outline" size={18} color={yunke.textSecondary} style={{ marginTop: 12 }} />
              <TextInput
                style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]}
                placeholder="Breve descripción del jugador..."
                placeholderTextColor={yunke.textSecondary}
                value={descripcion}
                onChangeText={setDescripcion}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Categoría - desplegable */}
          <Text style={styles.sectionTitle}>CATEGORÍA</Text>
          <Pressable style={styles.dropdown} onPress={() => setShowCategoriaModal(true)}>
            <Ionicons name="grid-outline" size={18} color={yunke.textSecondary} />
            <Text style={[styles.dropdownText, !selectedCategoria && styles.dropdownPlaceholder]}>
              {getCategoriaNombre()}
            </Text>
            <Ionicons name="chevron-down" size={18} color={yunke.textSecondary} />
          </Pressable>

          {/* Capitán - toggle */}
          <Text style={styles.sectionTitle}>CAPITÁN</Text>
          <Pressable style={styles.toggleRow} onPress={() => setIsCapitan(!isCapitan)}>
            <View style={styles.toggleLeft}>
              <Ionicons name="ribbon-outline" size={20} color={isCapitan ? yunke.gold : yunke.textSecondary} />
              <Text style={styles.toggleLabel}>Es capitán del equipo</Text>
            </View>
            <View style={[styles.toggleSwitch, isCapitan && styles.toggleSwitchActive]}>
              <View style={[styles.toggleKnob, isCapitan && styles.toggleKnobActive]} />
            </View>
          </Pressable>

          {/* Modal de categorías */}
          <Modal visible={showCategoriaModal} transparent animationType="slide">
            <Pressable style={styles.modalOverlay} onPress={() => setShowCategoriaModal(false)}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Seleccionar Categoría</Text>
                <FlatList
                  data={categorias}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <Pressable
                      style={[styles.modalItem, selectedCategoria === item.id && styles.modalItemActive]}
                      onPress={() => { setSelectedCategoria(item.id); setShowCategoriaModal(false); }}
                    >
                      <Text style={[styles.modalItemText, selectedCategoria === item.id && styles.modalItemTextActive]}>
                        {item.nombre}
                      </Text>
                      {selectedCategoria === item.id && <Ionicons name="checkmark" size={20} color={yunke.primary} />}
                    </Pressable>
                  )}
                />
              </View>
            </Pressable>
          </Modal>

          <Pressable style={styles.saveButton} onPress={handleGuardar} disabled={saving}>
            {saving ? <ActivityIndicator color={yunke.white} /> : (
              <><Ionicons name="checkmark-circle-outline" size={18} color={yunke.white} /><Text style={styles.saveButtonText}>{isEditing ? 'Guardar Cambios' : 'Crear Jugador'}</Text></>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </AdminGuard>
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

  // Dropdown
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: yunke.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: 24,
    gap: 10,
    shadowColor: yunke.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  dropdownText: { flex: 1, fontSize: 16, fontFamily: 'Montserrat_500Medium', color: yunke.text },
  dropdownPlaceholder: { color: yunke.textTertiary },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: yunke.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: 24,
    shadowColor: yunke.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggleLabel: { fontSize: 16, fontFamily: 'Montserrat_500Medium', color: yunke.text },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: yunke.border,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleSwitchActive: { backgroundColor: yunke.primary },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: yunke.white,
    shadowColor: yunke.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleKnobActive: { alignSelf: 'flex-end' },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: yunke.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingBottom: 40, maxHeight: '60%' },
  modalTitle: { fontSize: 18, fontFamily: 'Montserrat_700Bold', color: yunke.text, textAlign: 'center', marginBottom: 16, paddingHorizontal: 24 },
  modalItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: yunke.border },
  modalItemActive: { backgroundColor: yunke.primary + '10' },
  modalItemText: { fontSize: 16, fontFamily: 'Montserrat_500Medium', color: yunke.text },
  modalItemTextActive: { color: yunke.primary, fontFamily: 'Montserrat_600SemiBold' },

  // Date picker modal
  dateModalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  dateModalContent: { backgroundColor: yunke.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 20 },
  dateModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: yunke.border },
  dateModalTitle: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold', color: yunke.text },
  dateModalCancel: { fontSize: 16, fontFamily: 'Montserrat_400Regular', color: yunke.textSecondary },
  dateModalDone: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold', color: yunke.primary },

  // Save
  saveButton: { backgroundColor: yunke.primary, marginHorizontal: 24, height: 52, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 32, shadowColor: yunke.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveButtonText: { color: yunke.white, fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
});

import { yunke } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '../components/EmptyState';
import { FadeInUp } from '../components/FadeInUp';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAuth } from '../src/hooks/useAuth';
import { usePermission } from '../src/hooks/usePermission';
import { RequirePermission } from '../src/components/RequirePermission';
import { supabase } from '../src/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Categoria = {
  id: number;
  nombre: string;
};

type Jugador = {
  id: string;
  nombre: string;
  apellido: string | null;
  posicion: string | null;
  foto_url: string | null;
};

/** jugador_id → true = presente, false = ausente, null = sin marcar */
type AttendanceState = Record<string, boolean | null>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDisplayDate(date: Date): string {
  const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  return `${days[date.getDay()]} ${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
}

// ---------------------------------------------------------------------------
// Content (rendered only when permission is granted)
// ---------------------------------------------------------------------------
function AttendanceContent() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<number | null>(null);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [attendance, setAttendance] = useState<AttendanceState>({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // -----------------------------------------------------------------------
  // Load on mount
  // -----------------------------------------------------------------------
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    const { data: cats } = await supabase
      .from('categorias')
      .select('*')
      .order('orden', { ascending: true });

    if (cats && cats.length > 0) {
      setCategorias(cats);
      const firstId = cats[0].id;
      setSelectedCategoria(firstId);
      await loadJugadores(firstId);
    } else {
      setLoading(false);
    }
  };

  // -----------------------------------------------------------------------
  // Data loading
  // -----------------------------------------------------------------------
  const loadJugadores = async (categoriaId: number) => {
    setLoading(true);
    const { data: jugs } = await supabase
      .from('jugadores')
      .select('*')
      .eq('categoria_id', categoriaId)
      .eq('is_active', true)
      .order('nombre', { ascending: true });

    setJugadores(jugs || []);

    if (jugs && jugs.length > 0) {
      await loadAsistencias(jugs.map((j) => j.id));
    } else {
      setAttendance({});
      setLoading(false);
    }
  };

  const loadAsistencias = async (jugadorIds: string[]) => {
    const dateStr = formatISODate(selectedDate);
    const { data: asistencias } = await supabase
      .from('asistencias')
      .select('jugador_id, presente')
      .in('jugador_id', jugadorIds)
      .eq('fecha', dateStr);

    const state: AttendanceState = {};
    if (asistencias) {
      for (const a of asistencias) {
        state[a.jugador_id] = a.presente;
      }
    }
    setAttendance(state);
    setLoading(false);
  };

  const reloadAsistencias = useCallback(async () => {
    if (jugadores.length === 0) return;
    setLoading(true);
    await loadAsistencias(jugadores.map((j) => j.id));
  }, [jugadores, selectedDate]);

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------
  const handleCategoriaPress = async (id: number) => {
    setSelectedCategoria(id);
    await loadJugadores(id);
  };

  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && date) {
      setSelectedDate(date);
    }
  };

  // Reload asistencias when date actually changes (effect, not on every render)
  useEffect(() => {
    if (!loading) {
      reloadAsistencias();
    }
  }, [selectedDate]);

  const toggleAttendance = (jugadorId: string) => {
    setAttendance((prev) => {
      const current = prev[jugadorId];
      // Cycle: sin marcar → presente → ausente → sin marcar
      let next: boolean | null;
      if (current === null) next = true;
      else if (current === true) next = false;
      else next = null;
      return { ...prev, [jugadorId]: next };
    });
  };

  // -----------------------------------------------------------------------
  // Save
  // -----------------------------------------------------------------------
  const handleSave = async () => {
    if (!selectedCategoria || !user) return;
    setSaving(true);

    const dateStr = formatISODate(selectedDate);
    const records = jugadores.map((j) => ({
      jugador_id: j.id,
      categoria_id: selectedCategoria,
      fecha: dateStr,
      presente: attendance[j.id] ?? false,
      created_by: user.id,
    }));

    const { error } = await supabase
      .from('asistencias')
      .upsert(records, {
        onConflict: 'jugador_id,fecha',
        ignoreDuplicates: false,
      });

    setSaving(false);

    if (error) {
      Alert.alert('Error', `No se pudo guardar la asistencia: ${error.message}`);
    } else {
      Alert.alert('Guardado', 'Asistencia registrada correctamente.');
    }
  };

  // -----------------------------------------------------------------------
  // Derived values
  // -----------------------------------------------------------------------
  const presentes = jugadores.filter((j) => attendance[j.id] === true).length;
  const total = jugadores.length;

  const getStatusIcon = (jugadorId: string): { name: keyof typeof Ionicons.glyphMap; color: string } => {
    const state = attendance[jugadorId];
    if (state === true) return { name: 'checkmark-circle', color: yunke.success };
    if (state === false) return { name: 'close-circle', color: yunke.red };
    return { name: 'remove-outline', color: yunke.textTertiary };
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  const renderJugador = ({ item, index }: { item: Jugador; index: number }) => {
    const status = getStatusIcon(item.id);
    return (
      <FadeInUp delay={index * 60}>
        <Pressable style={styles.playerCard} onPress={() => toggleAttendance(item.id)}>
          <View style={styles.playerPhotoContainer}>
            {item.foto_url ? (
              <Image source={{ uri: item.foto_url }} style={styles.playerPhoto} />
            ) : (
              <View style={[styles.playerPhoto, styles.placeholderPhoto]}>
                <Text style={styles.placeholderText}>{item.nombre.charAt(0)}</Text>
              </View>
            )}
          </View>

          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>
              {item.nombre} {item.apellido || ''}
            </Text>
            {item.posicion && (
              <View style={styles.positionContainer}>
                <Ionicons name="football-outline" size={12} color={yunke.textSecondary} />
                <Text style={styles.playerPosition}>{item.posicion}</Text>
              </View>
            )}
          </View>

          <Ionicons name={status.name} size={28} color={status.color} />
        </Pressable>
      </FadeInUp>
    );
  };

  // -- Loading state (first load) --
  if (loading && categorias.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={yunke.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Tomar Asistencia" showBack onBack={() => router.back()} />

      {/* Category pills */}
      <View>
        <FlatList
          data={categorias}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.categoriesList}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleCategoriaPress(item.id)}
              style={[
                styles.categoryPill,
                selectedCategoria === item.id ? styles.categoryPillActive : null,
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategoria === item.id ? styles.categoryTextActive : null,
                ]}
              >
                {item.nombre}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {/* Date picker row */}
      <Pressable style={styles.dateRow} onPress={() => setShowDatePicker(true)}>
        <Ionicons name="calendar-outline" size={20} color={yunke.primary} />
        <Text style={styles.dateText}>{formatDisplayDate(selectedDate)}</Text>
        <Ionicons name="chevron-down" size={18} color={yunke.textTertiary} />
      </Pressable>

      {showDatePicker && Platform.OS === 'ios' && (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowDatePicker(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="inline"
                onChange={handleDateChange}
              />
              <Pressable style={styles.modalCloseButton} onPress={() => setShowDatePicker(false)}>
                <Text style={styles.modalCloseText}>Listo</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      )}
      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          onTouchCancel={() => setShowDatePicker(false)}
        />
      )}

      {/* Count header */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          {presentes}/{total} presentes
        </Text>
      </View>

      {/* Player list */}
      <FlatList
        data={jugadores}
        keyExtractor={(item) => item.id}
        renderItem={renderJugador}
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom, paddingTop: 10 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? <EmptyState title="No hay jugadores en esta categoría" icon="people-outline" /> : null
        }
      />

      {/* Save button (fixed at bottom) */}
      {jugadores.length > 0 && (
        <View style={[styles.saveButtonContainer, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={yunke.white} />
            ) : (
              <Text style={styles.saveButtonText}>Guardar Asistencia</Text>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Exported screen (wrapped with permission guard)
// ---------------------------------------------------------------------------
export default function AttendanceScreen() {
  return (
    <RequirePermission permission="tomar_asistencia">
      <AttendanceContent />
    </RequirePermission>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: yunke.surface,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: yunke.surface,
  },

  // -- Categories --
  categoriesList: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  categoryPill: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: yunke.card,
    marginRight: 10,
    borderWidth: 1,
    borderColor: yunke.border,
    shadowColor: yunke.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryPillActive: {
    backgroundColor: yunke.primary,
    borderColor: yunke.primary,
    shadowColor: yunke.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryText: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: yunke.textSecondary,
  },
  categoryTextActive: {
    color: yunke.white,
  },

  // -- Date row --
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: yunke.card,
    marginHorizontal: 24,
    marginBottom: 4,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
    shadowColor: yunke.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  dateText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Montserrat_500Medium',
    color: yunke.text,
    textTransform: 'capitalize',
  },

  // -- Count --
  countContainer: {
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  countText: {
    fontSize: 13,
    fontFamily: 'Montserrat_600SemiBold',
    color: yunke.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // -- Player card --
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: yunke.card,
    marginHorizontal: 24,
    marginBottom: 12,
    borderRadius: 16,
    padding: 14,
    shadowColor: yunke.dark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  playerPhotoContainer: {
    marginRight: 14,
  },
  playerPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  placeholderPhoto: {
    backgroundColor: yunke.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 22,
    fontFamily: 'Montserrat_700Bold',
    color: yunke.textSecondary,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 17,
    fontFamily: 'Montserrat_700Bold',
    color: yunke.text,
  },
  positionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  playerPosition: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: yunke.textSecondary,
    textTransform: 'capitalize',
  },

  // -- Save button --
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: yunke.surface,
  },
  saveButton: {
    backgroundColor: yunke.primary,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: yunke.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: yunke.white,
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
  },

  // -- Modal (iOS date picker) --
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: yunke.card,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 24,
    shadowColor: yunke.dark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalCloseButton: {
    marginTop: 16,
    backgroundColor: yunke.primary,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    color: yunke.white,
    fontSize: 15,
    fontFamily: 'Montserrat_600SemiBold',
  },
});

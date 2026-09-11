import { yunke } from '@/constants/Colors';
import { useTheme } from '@/src/hooks/useTheme';
import type { ThemePalette } from '@/constants/Colors';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../src/supabase';
import { AdminGuard } from '../../src/components/AdminGuard';

type Partido = {
  id: string;
  fecha: string;
  rival: string;
  es_local: boolean;
  resultado_local: number | null;
  resultado_visitante: number | null;
  penales_local: number | null;
  penales_visitante: number | null;
  jugado: boolean;
  competicion: string | null;
  ubicacion: string | null;
  escudo_url: string | null;
  categorias: { nombre: string } | null;
};

export default function AdminMatchesScreen() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [partidoActual, setPartidoActual] = useState<Partido | null>(null);
  const [golesLocal, setGolesLocal] = useState('');
  const [golesVisitante, setGolesVisitante] = useState('');
  const [huboPenales, setHuboPenales] = useState(false);
  const [penalesLocal, setPenalesLocal] = useState('');
  const [penalesVisitante, setPenalesVisitante] = useState('');
  const [savingResult, setSavingResult] = useState(false);

  const cargarPartidos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('partidos')
      .select('id, fecha, rival, es_local, resultado_local, resultado_visitante, penales_local, penales_visitante, jugado, competicion, ubicacion, escudo_url, categorias:categoria_id(nombre)')
      .order('fecha', { ascending: false });
    if (error) Alert.alert('Error', error.message);
    else setPartidos(data || []);
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { cargarPartidos(); }, []));

  const abrirModalResultado = (partido: Partido) => {
    setPartidoActual(partido);
    setGolesLocal(partido.resultado_local?.toString() || '');
    setGolesVisitante(partido.resultado_visitante?.toString() || '');
    setHuboPenales(partido.penales_local != null && partido.penales_visitante != null);
    setPenalesLocal(partido.penales_local?.toString() || '');
    setPenalesVisitante(partido.penales_visitante?.toString() || '');
    setModalVisible(true);
  };

  const guardarResultado = async () => {
    if (!partidoActual) return;
    if (golesLocal === '' || golesVisitante === '') {
      Alert.alert('Error', 'Debes ingresar el resultado del partido.');
      return;
    }
    if (huboPenales && (penalesLocal === '' || penalesVisitante === '')) {
      Alert.alert('Error', 'Debes ingresar el resultado de los penales.');
      return;
    }

    setSavingResult(true);
    const { error } = await supabase.from('partidos').update({
      resultado_local: parseInt(golesLocal),
      resultado_visitante: parseInt(golesVisitante),
      penales_local: huboPenales ? parseInt(penalesLocal) : null,
      penales_visitante: huboPenales ? parseInt(penalesVisitante) : null,
      jugado: true
    }).eq('id', partidoActual.id);

    if (error) {
      Alert.alert('Error', 'No se pudo guardar el resultado.');
    } else {
      setPartidos(prev => prev.map(p => p.id === partidoActual.id ? {
        ...p,
        resultado_local: parseInt(golesLocal),
        resultado_visitante: parseInt(golesVisitante),
        penales_local: huboPenales ? parseInt(penalesLocal) : null,
        penales_visitante: huboPenales ? parseInt(penalesVisitante) : null,
        jugado: true
      } : p));
      setModalVisible(false);
    }
    setSavingResult(false);
  };

  const renderPartido = ({ item }: { item: Partido }) => {
    const esPasado = new Date(item.fecha) < new Date();
  const nombreLocal = item.es_local ? 'Yunke FC' : item.rival;
  const nombreVisitante = item.es_local ? item.rival : 'Yunke FC';
    const escudoLocal = item.es_local ? require('../../assets/images/yunke-logo.png') : (item.escudo_url ? { uri: item.escudo_url } : null);
    const escudoVisitante = item.es_local ? (item.escudo_url ? { uri: item.escudo_url } : null) : require('../../assets/images/yunke-logo.png');
    const tienePenales = item.penales_local != null && item.penales_visitante != null;

    return (
      <View style={styles.card}>
        {/* Header: categoría y competición */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardCategory}>{item.categorias?.nombre || 'General'}</Text>
          {item.competicion && <Text style={styles.cardCompeticion}>{item.competicion}</Text>}
        </View>

        {/* Match principal */}
        <Pressable style={styles.matchContent} onPress={() => router.push(`/admin/create-match?id=${item.id}`)}>
          {/* Local */}
          <View style={styles.teamColumn}>
            {escudoLocal ? (
              <Image source={escudoLocal} style={styles.teamEscudo} resizeMode="contain" />
            ) : (
              <View style={[styles.teamEscudo, styles.escudoPlaceholder]}>
                <Ionicons name="shield-outline" size={20} color={colors.textTertiary} />
              </View>
            )}
            <Text style={styles.teamName} numberOfLines={1}>{nombreLocal}</Text>
          </View>

          {/* Score */}
          <View style={styles.scoreColumn}>
            {item.jugado ? (
              <View style={styles.scoreRow}>
                {tienePenales && (
                  <Text style={styles.penalesSide}>({item.penales_local})</Text>
                )}
                <Text style={styles.scoreNumber}>{item.resultado_local}</Text>
                <Text style={styles.scoreDash}>-</Text>
                <Text style={styles.scoreNumber}>{item.resultado_visitante}</Text>
                {tienePenales && (
                  <Text style={styles.penalesSide}>({item.penales_visitante})</Text>
                )}
              </View>
            ) : (
              <View style={styles.scheduledBadge}>
                <Text style={styles.scheduledText}>VS</Text>
              </View>
            )}
          </View>

          {/* Visitante */}
          <View style={styles.teamColumn}>
            {escudoVisitante ? (
              <Image source={escudoVisitante} style={styles.teamEscudo} resizeMode="contain" />
            ) : (
              <View style={[styles.teamEscudo, styles.escudoPlaceholder]}>
                <Ionicons name="shield-outline" size={20} color={colors.textTertiary} />
              </View>
            )}
            <Text style={styles.teamName} numberOfLines={1}>{nombreVisitante}</Text>
          </View>
        </Pressable>

        {/* Footer: fecha, ubicación, acción */}
        <View style={styles.cardFooter}>
          <View style={styles.cardInfo}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
              <Text style={styles.infoText}>
                {new Date(item.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Text>
              <Ionicons name="time-outline" size={12} color={colors.textSecondary} style={{ marginLeft: 8 }} />
              <Text style={styles.infoText}>
                {new Date(item.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            {item.ubicacion && (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                <Text style={styles.infoText} numberOfLines={1}>{item.ubicacion}</Text>
              </View>
            )}
          </View>

          {item.jugado ? (
            <Pressable style={styles.editBtn} onPress={() => abrirModalResultado(item)}>
              <Ionicons name="create-outline" size={14} color={yunke.white} />
              <Text style={styles.editBtnText}>Editar</Text>
            </Pressable>
          ) : esPasado ? (
            <Pressable style={styles.loadResultBtn} onPress={() => abrirModalResultado(item)}>
              <Ionicons name="clipboard-outline" size={14} color={yunke.white} />
              <Text style={styles.loadResultText}>Cargar</Text>
            </Pressable>
          ) : (
            <View style={styles.scheduledContainer}>
              <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
              <Text style={styles.scheduledLabel}>Programado</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primaryLight} /></View>;

  return (
    <AdminGuard permission="gestionar_partidos">
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <ScreenHeader
          title="Gestionar Partidos"
          subtitle={`${partidos.length} partidos`}
          showBack
          onBack={() => router.back()}
        />

        <FlatList data={partidos} keyExtractor={(item) => item.id} renderItem={renderPartido}
          contentContainerStyle={{ paddingBottom: 100 + insets.bottom, paddingHorizontal: 24, paddingTop: 16 }} showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.emptyText}>No hay partidos registrados.</Text>} />

        <Pressable style={[styles.fab, { bottom: 30 + insets.bottom }]} onPress={() => router.push('/admin/create-match')}>
          <Ionicons name="add" size={28} color={yunke.white} />
        </Pressable>

        {/* Modal de carga de resultado */}
        <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Cargar Resultado</Text>

              {/* Inputs de goles */}
              <View style={styles.scoreInputsContainer}>
                <View style={styles.scoreInputGroup}>
                  <Text style={styles.scoreInputLabel}>{partidoActual?.es_local ? 'Yunke FC' : partidoActual?.rival}</Text>
                  <TextInput style={styles.scoreInput} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textTertiary} value={golesLocal} onChangeText={setGolesLocal} maxLength={2} />
                </View>
                <Text style={styles.scoreDashModal}>-</Text>
                <View style={styles.scoreInputGroup}>
                  <Text style={styles.scoreInputLabel}>{partidoActual?.es_local ? partidoActual?.rival : 'Yunke FC'}</Text>
                  <TextInput style={styles.scoreInput} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textTertiary} value={golesVisitante} onChangeText={setGolesVisitante} maxLength={2} />
                </View>
              </View>

              {/* Toggle penales */}
              <Pressable style={[styles.penalesToggle, huboPenales && styles.penalesToggleActive]} onPress={() => setHuboPenales(!huboPenales)}>
                <Text style={[styles.penalesToggleText, huboPenales && styles.penalesToggleTextActive]}>{'¿Hubo penales?'}</Text>
                <View style={[styles.toggleTrack, huboPenales && styles.toggleTrackActive]}>
                  <View style={[styles.toggleThumb, huboPenales && styles.toggleThumbActive]} />
                </View>
              </Pressable>

              {/* Inputs de penales */}
              {huboPenales && (
                <View style={styles.penalesContainer}>
                  <View style={styles.scoreInputsContainer}>
                    <TextInput style={styles.penalesInput} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textTertiary} value={penalesLocal} onChangeText={setPenalesLocal} maxLength={2} />
                    <Text style={styles.scoreDashModal}>-</Text>
                    <TextInput style={styles.penalesInput} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textTertiary} value={penalesVisitante} onChangeText={setPenalesVisitante} maxLength={2} />
                  </View>
                </View>
              )}

              {/* Botones */}
              <View style={styles.modalButtons}>
                <Pressable style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </Pressable>
                <Pressable style={[styles.modalBtn, styles.saveBtn]} onPress={guardarResultado} disabled={savingResult}>
                  {savingResult ? <ActivityIndicator color={yunke.white} /> : <Text style={styles.saveBtnText}>Guardar</Text>}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </AdminGuard>
  );
}

const createStyles = (theme: ThemePalette) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.surface },

  // Card del partido
  card: {
    backgroundColor: theme.card,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: theme.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  cardCategory: {
    fontSize: 11,
    fontFamily: 'Montserrat_600SemiBold',
    color: theme.textSecondary,
    textTransform: 'uppercase',
  },
  cardCompeticion: {
    fontSize: 11,
    fontFamily: 'Montserrat_500Medium',
    color: theme.primaryLight,
  },

  // Match content
  matchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  teamColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  teamEscudo: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  escudoPlaceholder: {
    backgroundColor: theme.surface,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamName: {
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    color: theme.text,
    textAlign: 'center',
    maxWidth: 80,
  },

  // Score
  scoreColumn: {
    alignItems: 'center',
    minWidth: 80,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreNumber: {
    fontSize: 28,
    fontFamily: 'Montserrat_600SemiBold',
  },
  scoreDash: {
    fontSize: 20,
    fontFamily: 'Montserrat_700Bold',
    color: theme.textSecondary,
  },
  penalesSide: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: theme.text,
  },
  scheduledBadge: {
    backgroundColor: theme.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scheduledText: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: theme.textSecondary,
  },

  // Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 11,
    fontFamily: 'Montserrat_400Regular',
    color: theme.textSecondary,
  },

  // Botones de acción
  loadResultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: yunke.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  loadResultText: {
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    color: yunke.white,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: yunke.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  editBtnText: {
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    color: yunke.white,
  },
  scheduledContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  scheduledLabel: {
    fontSize: 12,
    fontFamily: 'Montserrat_500Medium',
    color: theme.textSecondary,
  },

  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 16, fontFamily: 'Montserrat_400Regular', color: theme.textSecondary },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: yunke.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: yunke.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '90%', backgroundColor: theme.card, borderRadius: 20, padding: 24, shadowColor: theme.dark, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  modalTitle: { fontSize: 20, fontFamily: 'Montserrat_700Bold', color: theme.text, textAlign: 'center', marginBottom: 24 },

  // Score inputs
  scoreInputsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 24 },
  scoreInputGroup: { alignItems: 'center', gap: 8 },
  scoreInputLabel: { fontSize: 12, fontFamily: 'Montserrat_500Medium', color: theme.textSecondary },
  scoreInput: { width: 70, height: 70, borderWidth: 1, borderColor: theme.border, borderRadius: 16, textAlign: 'center', fontSize: 32, fontFamily: 'Montserrat_700Bold', color: theme.text, backgroundColor: theme.surface },
  scoreDashModal: { fontSize: 30, fontFamily: 'Montserrat_700Bold', color: theme.textSecondary },

  // Penales toggle
  penalesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    backgroundColor: theme.surface,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  penalesToggleActive: {
    backgroundColor: yunke.primary + '10',
    borderColor: yunke.primary,
  },
  penalesToggleText: {
    fontSize: 14,
    fontFamily: 'Montserrat_500Medium',
    color: theme.textSecondary,
  },
  penalesToggleTextActive: {
    color: theme.primaryLight,
  },
  toggleTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.border,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleTrackActive: {
    backgroundColor: yunke.primary,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: yunke.white,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },

  // Penales inputs
  penalesContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: yunke.gold + '10',
    borderWidth: 1,
    borderColor: yunke.gold + '30',
  },
  penalesInput: { width: 60, height: 50, borderWidth: 1, borderColor: yunke.gold + '50', borderRadius: 12, textAlign: 'center', fontSize: 22, fontFamily: 'Montserrat_700Bold', color: theme.text, backgroundColor: theme.surface },

  // Modal buttons
  modalButtons: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 8 },
  modalBtn: { flex: 1, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cancelBtn: { backgroundColor: theme.surface },
  cancelBtnText: { color: theme.textSecondary, fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  saveBtn: { backgroundColor: yunke.primary },
  saveBtnText: { color: yunke.white, fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
});

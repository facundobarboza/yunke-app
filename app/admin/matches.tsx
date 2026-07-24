import { yunke } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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
  jugado: boolean;
  categorias: { nombre: string } | null;
};

export default function AdminMatchesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [partidoActual, setPartidoActual] = useState<Partido | null>(null);
  const [golesLocal, setGolesLocal] = useState('');
  const [golesVisitante, setGolesVisitante] = useState('');
  const [savingResult, setSavingResult] = useState(false);

  const cargarPartidos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('partidos')
      .select('id, fecha, rival, es_local, resultado_local, resultado_visitante, jugado, categorias:categoria_id(nombre)')
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
    setModalVisible(true);
  };

  const guardarResultado = async () => {
    if (!partidoActual) return;
    setSavingResult(true);
    const { error } = await supabase.from('partidos').update({
      resultado_local: golesLocal === '' ? null : parseInt(golesLocal),
      resultado_visitante: golesVisitante === '' ? null : parseInt(golesVisitante),
      jugado: true
    }).eq('id', partidoActual.id);

    if (error) {
      Alert.alert('Error', 'No se pudo guardar el resultado.');
    } else {
      setPartidos(prev => prev.map(p => p.id === partidoActual.id ? { ...p, resultado_local: golesLocal === '' ? null : parseInt(golesLocal), resultado_visitante: golesVisitante === '' ? null : parseInt(golesVisitante), jugado: true } : p));
      setModalVisible(false);
    }
    setSavingResult(false);
  };

  const renderPartido = ({ item }: { item: Partido }) => {
    const esPasado = new Date(item.fecha) < new Date();
    return (
      <View style={styles.card}>
        <Pressable style={styles.matchInfo} onPress={() => router.push(`/admin/create-match?id=${item.id}`)}>
          <Text style={styles.teamText}>
            {item.es_local ? 'YUNKE' : item.rival}
            <Text style={styles.vsText}> vs </Text>
            {item.es_local ? item.rival : 'YUNKE'}
          </Text>
          <Text style={styles.categoryText}>
            {item.categorias?.nombre || 'General'} • {new Date(item.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
          </Text>
        </Pressable>

        {item.jugado ? (
          <View style={styles.resultContainer}>
            <Text style={styles.scoreText}>{item.resultado_local} - {item.resultado_visitante}</Text>
            <Pressable onPress={() => abrirModalResultado(item)}>
              <Text style={styles.editText}>Editar</Text>
            </Pressable>
          </View>
        ) : esPasado ? (
          <Pressable style={styles.loadResultBtn} onPress={() => abrirModalResultado(item)}>
            <Ionicons name="create-outline" size={14} color={yunke.primary} />
            <Text style={styles.loadResultText}>Cargar</Text>
          </Pressable>
        ) : (
          <View style={styles.scheduledContainer}>
            <Text style={styles.scheduledText}>Programado</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={yunke.primary} /></View>;

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

        <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Cargar Resultado</Text>
              <Text style={styles.modalSubtitle}>
                {partidoActual?.es_local ? 'YUNKE' : partidoActual?.rival} vs {partidoActual?.es_local ? partidoActual?.rival : 'YUNKE'}
              </Text>
              <View style={styles.scoreInputsContainer}>
                <TextInput style={styles.scoreInput} keyboardType="numeric" placeholder="0" placeholderTextColor={yunke.textTertiary} value={golesLocal} onChangeText={setGolesLocal} maxLength={2} />
                <Text style={styles.scoreDash}>-</Text>
                <TextInput style={styles.scoreInput} keyboardType="numeric" placeholder="0" placeholderTextColor={yunke.textTertiary} value={golesVisitante} onChangeText={setGolesVisitante} maxLength={2} />
              </View>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: yunke.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: yunke.surface },

  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: yunke.card, padding: 14, borderRadius: 16, marginBottom: 12, shadowColor: yunke.dark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  matchInfo: { flex: 1, marginRight: 10 },
  teamText: { fontSize: 15, fontFamily: 'Montserrat_600SemiBold', color: yunke.text },
  vsText: { fontFamily: 'Montserrat_400Regular', color: yunke.textSecondary },
  categoryText: { fontSize: 12, fontFamily: 'Montserrat_400Regular', color: yunke.textSecondary, marginTop: 4 },
  resultContainer: { alignItems: 'center' },
  scoreText: { fontSize: 20, fontFamily: 'Montserrat_700Bold', color: yunke.text },
  editText: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold', color: yunke.primary, marginTop: 4 },
  scheduledContainer: { backgroundColor: yunke.surface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  scheduledText: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold', color: yunke.textSecondary },
  loadResultBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: yunke.primary + '12', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 4 },
  loadResultText: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold', color: yunke.primary },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 16, fontFamily: 'Montserrat_400Regular', color: yunke.textSecondary },
  fab: { position: 'absolute', bottom: 30, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: yunke.primary, justifyContent: 'center', alignItems: 'center', shadowColor: yunke.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '85%', backgroundColor: yunke.card, borderRadius: 20, padding: 24, alignItems: 'center', shadowColor: yunke.dark, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  modalTitle: { fontSize: 20, fontFamily: 'Montserrat_700Bold', color: yunke.text, marginBottom: 4 },
  modalSubtitle: { fontSize: 14, fontFamily: 'Montserrat_400Regular', color: yunke.textSecondary, marginBottom: 24, textTransform: 'capitalize' },
  scoreInputsContainer: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 30 },
  scoreInput: { width: 70, height: 70, borderWidth: 1, borderColor: yunke.border, borderRadius: 16, textAlign: 'center', fontSize: 32, fontFamily: 'Montserrat_700Bold', color: yunke.text },
  scoreDash: { fontSize: 30, fontFamily: 'Montserrat_700Bold', color: yunke.textSecondary },
  modalButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtn: { flex: 1, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cancelBtn: { backgroundColor: yunke.surface },
  cancelBtnText: { color: yunke.textSecondary, fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  saveBtn: { backgroundColor: yunke.primary },
  saveBtnText: { color: yunke.white, fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
});

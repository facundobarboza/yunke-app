import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../../src/supabase';

type Partido = {
  id: string;
  fecha: string;
  rival: string;
  es_local: boolean;
  resultado_local: number | null;
  resultado_visitante: number | null;
  jugado: boolean;
  categorias: { nombre: string }[] | null;
};

export default function AdminMatchesScreen() {
  const router = useRouter();
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para el Modal de Cargar Resultado
  const [modalVisible, setModalVisible] = useState(false);
  const [partidoActual, setPartidoActual] = useState<Partido | null>(null);
  const [golesLocal, setGolesLocal] = useState('');
  const [golesVisitante, setGolesVisitante] = useState('');
  const [savingResult, setSavingResult] = useState(false);

  const cargarPartidos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('partidos')
      .select('id, fecha, rival, es_local, resultado_local, resultado_visitante, jugado, categorias(nombre)')
      .order('fecha', { ascending: false }); // Los más recientes arriba

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

    const { error } = await supabase
      .from('partidos')
      .update({
        resultado_local: golesLocal === '' ? null : parseInt(golesLocal),
        resultado_visitante: golesVisitante === '' ? null : parseInt(golesVisitante),
        jugado: true
      })
      .eq('id', partidoActual.id);

    if (error) {
      Alert.alert('Error', 'No se pudo guardar el resultado.');
    } else {
      // Actualizamos la lista localmente para que se vea el cambio al instante
      setPartidos(prev => prev.map(p => p.id === partidoActual.id ? {
        ...p,
        resultado_local: golesLocal === '' ? null : parseInt(golesLocal),
        resultado_visitante: golesVisitante === '' ? null : parseInt(golesVisitante),
        jugado: true
      } : p));
      setModalVisible(false);
    }
    setSavingResult(false);
  };

  const renderPartido = ({ item }: { item: Partido }) => {
    // Comprobamos si la fecha del partido ya pasó
    const esPasado = new Date(item.fecha) < new Date();

    return (
      <View style={styles.card}>
        <Pressable 
          style={styles.matchInfo} 
          onPress={() => router.push(`/admin/create-match?id=${item.id}`)}
        >
          <Text style={styles.teamText}>
            {item.es_local ? 'YUNKE' : item.rival} 
            <Text style={styles.vsText}> vs </Text> 
            {item.es_local ? item.rival : 'YUNKE'}
          </Text>
          <Text style={styles.categoryText}>
            {item.categorias?.[0]?.nombre || 'General'} • {new Date(item.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
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
          // Si ya pasó la fecha pero no tiene resultado, permitimos cargarlo
          <Pressable style={styles.loadResultBtn} onPress={() => abrirModalResultado(item)}>
            <Text style={styles.loadResultText}>Cargar Resultado</Text>
          </Pressable>
        ) : (
          // Si es en el futuro, solo mostramos este texto
          <View style={styles.scheduledContainer}>
            <Text style={styles.scheduledText}>Programado</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#FF3B30" /></View>;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#007AFF" />
          <Text style={styles.backText}>Volver</Text>
        </Pressable>

        <Text style={styles.headerTitle}>Gestionar Partidos</Text>

        <FlatList
          data={partidos}
          keyExtractor={(item) => item.id}
          renderItem={renderPartido}
          contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 24 }}
          showsVerticalScrollIndicator={false}
        />

        <Pressable style={styles.fab} onPress={() => router.push('/admin/create-match')}>
          <Ionicons name="add" size={32} color="#fff" />
        </Pressable>

        {/* MODAL PARA CARGAR RESULTADO */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Cargar Resultado</Text>
              <Text style={styles.modalSubtitle}>
                {partidoActual?.es_local ? 'YUNKE' : partidoActual?.rival} vs {partidoActual?.es_local ? partidoActual?.rival : 'YUNKE'}
              </Text>

              <View style={styles.scoreInputsContainer}>
                <TextInput
                  style={styles.scoreInput}
                  keyboardType="numeric"
                  placeholder="0"
                  value={golesLocal}
                  onChangeText={setGolesLocal}
                  maxLength={2}
                />
                <Text style={styles.scoreDash}>-</Text>
                <TextInput
                  style={styles.scoreInput}
                  keyboardType="numeric"
                  placeholder="0"
                  value={golesVisitante}
                  onChangeText={setGolesVisitante}
                  maxLength={2}
                />
              </View>

              <View style={styles.modalButtons}>
                <Pressable style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </Pressable>
                <Pressable style={[styles.modalBtn, styles.saveBtn]} onPress={guardarResultado} disabled={savingResult}>
                  {savingResult ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Guardar</Text>}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7' },
  backButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 10 },
  backText: { fontSize: 17, color: '#007AFF', marginLeft: -4 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1C1C1E', paddingHorizontal: 24, letterSpacing: -1, marginBottom: 20 },
  
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  scheduledContainer: { 
    backgroundColor: '#F2F2F7', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 8 
  },
  scheduledText: { 
    fontSize: 13, 
    color: '#8E8E93', 
    fontWeight: '600' 
  },

  matchInfo: { flex: 1, marginRight: 10 },
  teamText: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  vsText: { color: '#8E8E93', fontWeight: '400' },
  categoryText: { fontSize: 13, color: '#8E8E93', marginTop: 4 },
  
  resultContainer: { alignItems: 'center' },
  scoreText: { fontSize: 20, fontWeight: 'bold', color: '#1C1C1E' },
  editText: { fontSize: 12, color: '#007AFF', marginTop: 4, fontWeight: '600' },
  
  loadResultBtn: { backgroundColor: '#F2F2F7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  loadResultText: { fontSize: 13, color: '#007AFF', fontWeight: '600' },

  fab: {
    position: 'absolute', bottom: 30, right: 24, width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#FF3B30', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#FF3B30', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },

  // Modal Styles
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '85%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 4 },
  modalSubtitle: { fontSize: 14, color: '#8E8E93', marginBottom: 24, textTransform: 'capitalize' },
  scoreInputsContainer: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 30 },
  scoreInput: { width: 70, height: 70, borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 16, textAlign: 'center', fontSize: 32, fontWeight: 'bold', color: '#1C1C1E' },
  scoreDash: { fontSize: 30, fontWeight: 'bold', color: '#8E8E93' },
  modalButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtn: { flex: 1, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cancelBtn: { backgroundColor: '#F2F2F7' },
  cancelBtnText: { color: '#8E8E93', fontSize: 16, fontWeight: '600' },
  saveBtn: { backgroundColor: '#FF3B30' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
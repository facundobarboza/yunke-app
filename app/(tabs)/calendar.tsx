import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../../src/supabase';

type Partido = {
  id: string;
  fecha: string;
  rival: string;
  es_local: boolean;
  competicion: string | null;
  resultado_local: number | null;
  resultado_visitante: number | null;
  jugado: boolean;
  // Ojo: En Supabase un join devuelve un array, así que lo tipamos como array
  categorias: { nombre: string }[] | null; 
};

export default function CalendarScreen() {
  const [proximos, setProximos] = useState<Partido[]>([]);
  const [resultados, setResultados] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estado para el selector: 'proximos' o 'resultados'
  const [filtro, setFiltro] = useState<'proximos' | 'resultados'>('proximos');

  const cargarPartidos = async () => {
    const ahora = new Date().toISOString();

    const { data: dataProximos } = await supabase
      .from('partidos')
      .select('*, categorias(nombre)')
      .gte('fecha', ahora)
      .order('fecha', { ascending: true });

    const { data: dataResultados } = await supabase
      .from('partidos')
      .select('*, categorias(nombre)')
      .lt('fecha', ahora)
      .order('fecha', { ascending: false });

    setProximos(dataProximos || []);
    setResultados(dataResultados || []);
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      cargarPartidos();
    }, [])
  );

  const formatearFecha = (fechaISO: string) => {
    const opciones: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
    return new Date(fechaISO).toLocaleDateString('es-ES', opciones);
  };

  const formatearHora = (fechaISO: string) => {
    return new Date(fechaISO).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const getColorResultado = (partido: Partido) => {
    if (!partido.resultado_local || !partido.resultado_visitante) return '#1C1C1E';
    const golesYunke = partido.es_local ? partido.resultado_local : partido.resultado_visitante;
    const golesRival = partido.es_local ? partido.resultado_visitante : partido.resultado_local;

    if (golesYunke > golesRival) return '#34C759'; // Verde Victoria
    if (golesYunke < golesRival) return '#FF3B30'; // Rojo Derrota
    return '#FF9500'; // Naranja Empate
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#000" /></View>;
  }

  const renderPartido = ({ item }: { item: Partido }) => {
    const esResultado = filtro === 'resultados';
    const colorResultado = getColorResultado(item);

    return (
      <View style={styles.card}>
        {/* Columna Izquierda: Fecha */}
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{formatearFecha(item.fecha)}</Text>
          <Text style={styles.timeText}>{formatearHora(item.fecha)}</Text>
        </View>

        {/* Línea separadora vertical sutil */}
        <View style={styles.divider} />

        {/* Columna Central: Equipos y Competición */}
        <View style={styles.matchInfo}>
          <Text style={styles.teamText}>
            {item.es_local ? 'Club Yunke' : item.rival}
          </Text>
          <Text style={styles.vsText}>vs</Text>
          <Text style={styles.teamText}>
            {item.es_local ? item.rival : 'Club Yunke'}
          </Text>
          {item.competicion && (
            <Text style={styles.competitionText}>
              {item.competicion} • {item.categorias?.[0]?.nombre || 'General'}
            </Text>
          )}
        </View>

        {/* Columna Derecha: Resultado o Localidad */}
        <View style={styles.resultContainer}>
          {esResultado ? (
            <Text style={[styles.scoreText, { color: colorResultado }]}>
              {item.resultado_local} - {item.resultado_visitante}
            </Text>
          ) : (
            <Text style={styles.locationText}>{item.es_local ? 'Casa' : 'Fuera'}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Encabezado */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Partidos</Text>
      </View>

      {/* Selector Horizontal (Pills) */}
      <View style={styles.filterContainer}>
        <Pressable 
          style={[styles.filterPill, filtro === 'proximos' && styles.filterPillActive]} 
          onPress={() => setFiltro('proximos')}
        >
          <Text style={[styles.filterText, filtro === 'proximos' && styles.filterTextActive]}>
            Próximos
          </Text>
        </Pressable>
        <Pressable 
          style={[styles.filterPill, filtro === 'resultados' && styles.filterPillActive]} 
          onPress={() => setFiltro('resultados')}
        >
          <Text style={[styles.filterText, filtro === 'resultados' && styles.filterTextActive]}>
            Resultados
          </Text>
        </Pressable>
      </View>

      {/* Lista de Partidos filtrada */}
      <FlatList
        data={filtro === 'proximos' ? proximos : resultados}
        keyExtractor={(item) => item.id}
        renderItem={renderPartido}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => { setRefreshing(true); cargarPartidos(); }} 
            tintColor="#8E8E93" 
          />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No hay {filtro === 'proximos' ? 'partidos programados' : 'resultados'}.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7' },
  
  // Header
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 10 },
  screenTitle: { fontSize: 34, fontWeight: 'bold', color: '#1C1C1E', letterSpacing: -1 },
  
  // Filtro Pills
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 15,
    gap: 10,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
  },
  filterPillActive: {
    backgroundColor: '#1C1C1E',
    borderColor: '#1C1C1E',
  },
  filterText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8E8E93',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },

  // Cards de Partidos
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 12,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  dateContainer: {
    width: 65,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  timeText: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 12,
  },
  matchInfo: {
    flex: 1,
  },
  teamText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  vsText: {
    fontSize: 12,
    color: '#8E8E93',
    marginVertical: 2,
    fontStyle: 'italic',
  },
  competitionText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 6,
  },
  resultContainer: {
    width: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'capitalize',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 60,
    fontSize: 16,
    color: '#8E8E93',
  },
});
import { FadeInUp } from '@/components/FadeInUp';
import { yunke } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
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
  escudo_url?: string | null;
  categorias: { nombre: string }[] | null;
};

export default function CalendarScreen() {
  const [proximos, setProximos] = useState<Partido[]>([]);
  const [resultados, setResultados] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  const getResultadoData = (partido: Partido) => {
    if (!partido.resultado_local || !partido.resultado_visitante) {
      return { color: yunke.text, label: '—' };
    }
    const golesYunke = partido.es_local ? partido.resultado_local : partido.resultado_visitante;
    const golesRival = partido.es_local ? partido.resultado_visitante : partido.resultado_local;

    if (golesYunke > golesRival) return { color: yunke.success, label: 'V' };
    if (golesYunke < golesRival) return { color: yunke.red, label: 'D' };
    return { color: yunke.gold, label: 'E' };
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={yunke.primary} /></View>;
  }

  const renderPartido = ({ item, index }: { item: Partido; index: number }) => {
    const esResultado = filtro === 'resultados';
    const resultado = getResultadoData(item);

    return (
      <FadeInUp delay={index * 80}>
        <View style={styles.card}>
          {/* Indicador de resultado (solo en resultados) */}
          {esResultado && (
            <View style={[styles.resultIndicator, { backgroundColor: resultado.color }]}>
              <Text style={styles.resultIndicatorText}>{resultado.label}</Text>
            </View>
          )}

          {/* Columna Izquierda: Fecha */}
          <View style={styles.dateContainer}>
            <Text style={[styles.dateText, esResultado && { color: resultado.color }]}>
              {formatearFecha(item.fecha)}
            </Text>
            <Text style={styles.timeText}>{formatearHora(item.fecha)}</Text>
          </View>

          {/* Línea separadora */}
          <View style={styles.divider} />

                  {/* Columna Central: Equipos y Competición */}
        <View style={styles.matchInfo}>
          <View style={styles.teamRowCalendar}>
            {item.es_local ? (
              <Image source={require('../../assets/images/yunke-logo.png')} style={styles.escudoCalendar} resizeMode="contain" />
            ) : (
              item.escudo_url ? <Image source={{ uri: item.escudo_url }} style={styles.escudoCalendar} resizeMode="contain" /> : <View style={[styles.escudoCalendar, styles.placeholderEscudoCal]}><Ionicons name="shield-outline" size={14} color="#C7C7CC" /></View>
            )}
            <Text style={styles.teamText} numberOfLines={1}>{item.es_local ? 'Club Yunke' : item.rival}</Text>
          </View>
          
          <Text style={styles.vsText}>vs</Text>
          
          <View style={styles.teamRowCalendar}>
            {!item.es_local ? (
              <Image source={require('../../assets/images/yunke-logo.png')} style={styles.escudoCalendar} resizeMode="contain" />
            ) : (
              item.escudo_url ? <Image source={{ uri: item.escudo_url }} style={styles.escudoCalendar} resizeMode="contain" /> : <View style={[styles.escudoCalendar, styles.placeholderEscudoCal]}><Ionicons name="shield-outline" size={14} color="#C7C7CC" /></View>
            )}
            <Text style={styles.teamText} numberOfLines={1}>{!item.es_local ? 'Club Yunke' : item.rival}</Text>
          </View>
          
          {item.competicion && (
            <Text style={styles.competitionText}>
              {item.competicion} • {item.categorias?.[0]?.nombre || 'General'}
            </Text>
          )}
        </View>

          {/* Columna Derecha: Resultado o Localidad */}
          <View style={styles.resultContainer}>
            {esResultado ? (
              <Text style={[styles.scoreText, { color: resultado.color }]}>
                {item.resultado_local} - {item.resultado_visitante}
              </Text>
            ) : (
              <View style={[styles.locationBadge, item.es_local ? styles.locationHome : styles.locationAway]}>
                <Text style={styles.locationText}>{item.es_local ? 'CASA' : 'FUERA'}</Text>
              </View>
            )}
          </View>
        </View>
      </FadeInUp>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Partidos</Text>
      </View>

      {/* Selector de filtro */}
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
            tintColor={yunke.primary}
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
  container: { flex: 1, backgroundColor: yunke.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: yunke.surface },
  
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 10 },
  screenTitle: { fontSize: 34, fontFamily: 'Montserrat_900Black', color: yunke.text, letterSpacing: -1 },
  
  // Filtro
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 15,
    gap: 10,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: yunke.card,
    borderWidth: 1,
    borderColor: yunke.border,
    alignItems: 'center',
  },
  filterPillActive: {
    backgroundColor: yunke.primary,
    borderColor: yunke.primary,
  },
  filterText: {
    fontSize: 15,
    fontWeight: '600',
    color: yunke.textSecondary,
  },
  filterTextActive: {
    color: yunke.white,
  },

  // Cards
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: yunke.card,
    marginHorizontal: 24,
    marginBottom: 12,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: yunke.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  resultIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderBottomRightRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  resultIndicatorText: {
    color: yunke.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  dateContainer: {
    width: 65,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 15,
    fontWeight: '700',
    color: yunke.text,
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  timeText: {
    fontSize: 13,
    color: yunke.textSecondary,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: yunke.border,
    marginHorizontal: 12,
  },
  matchInfo: {
    flex: 1,
  },
  teamText: {
    fontSize: 16,
    fontWeight: '600',
    color: yunke.text,
  },
  vsText: {
    fontSize: 12,
    color: yunke.textSecondary,
    marginVertical: 2,
    fontStyle: 'italic',
  },
  competitionText: {
    fontSize: 12,
    color: yunke.textSecondary,
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
  locationBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  locationHome: {
    backgroundColor: yunke.primary + '15',
  },
  locationAway: {
    backgroundColor: yunke.surface,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '700',
    color: yunke.primary,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 60,
    fontSize: 16,
    color: yunke.textSecondary,
  },
  teamRowCalendar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  escudoCalendar: {
    width: 24,
    height: 24
  },
  placeholderEscudoCal: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
});

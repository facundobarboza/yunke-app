import { FadeInUp } from '@/components/FadeInUp';
import { yunke } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  ubicacion?: string | null;
  categoria_id: number | null;
  categoria_nombre: string | null;
};

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const [proximos, setProximos] = useState<Partido[]>([]);
  const [resultados, setResultados] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtro, setFiltro] = useState<'proximos' | 'resultados'>('proximos');

  const cargarPartidos = async () => {
    const ahora = new Date().toISOString();

    // Cargar categorías por separado
    const { data: categoriasData } = await supabase
      .from('categorias')
      .select('id, nombre');

    const categoriasMap = new Map<number, string>();
    if (categoriasData) {
      categoriasData.forEach((cat) => categoriasMap.set(cat.id, cat.nombre));
    }

    const { data: dataProximos } = await supabase
      .from('partidos')
      .select('*')
      .gte('fecha', ahora)
      .order('fecha', { ascending: true });

    const { data: dataResultados } = await supabase
      .from('partidos')
      .select('*')
      .lt('fecha', ahora)
      .order('fecha', { ascending: false });

    // Mapear categoría_id a nombre
    const mapCategoria = (partidos: any[]) =>
      partidos.map((p) => ({
        ...p,
        categoria_nombre: p.categoria_id ? categoriasMap.get(p.categoria_id) || null : null,
      }));

    setProximos(mapCategoria(dataProximos || []));
    setResultados(mapCategoria(dataResultados || []));
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
    return { color: yunke.text, label: 'E' };
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

          {/* Categoría centrada arriba */}
          <Text style={styles.categoryTop}>
            {item.categoria_nombre || 'General'}
          </Text>

          <View style={styles.cardBody}>
            {/* Columna Izquierda: Fecha */}
            <View style={styles.dateContainer}>
              <Text style={styles.dateText}>
                {formatearFecha(item.fecha)}
              </Text>
              <Text style={styles.timeText}>{formatearHora(item.fecha)}</Text>
            </View>

            {/* Línea separadora */}
            <View style={styles.divider} />

            {/* Columna Central: Equipos */}
            <View style={styles.matchInfo}>
              <View style={styles.teamRowCalendar}>
                {item.es_local ? (
                  <Image source={require('../../assets/images/yunke-logo.png')} style={styles.escudoCalendar} resizeMode="contain" />
                ) : (
                  item.escudo_url ? <Image source={{ uri: item.escudo_url }} style={styles.escudoCalendar} resizeMode="contain" /> : <View style={[styles.escudoCalendar, styles.placeholderEscudoCal]}><Ionicons name="shield-outline" size={14} color={yunke.textTertiary} /></View>
                )}
                <Text style={styles.teamText} numberOfLines={1}>{item.es_local ? 'Club Yunke' : item.rival}</Text>
              </View>

              <Text style={styles.vsText}>vs</Text>

              <View style={styles.teamRowCalendar}>
                {!item.es_local ? (
                  <Image source={require('../../assets/images/yunke-logo.png')} style={styles.escudoCalendar} resizeMode="contain" />
                ) : (
                  item.escudo_url ? <Image source={{ uri: item.escudo_url }} style={styles.escudoCalendar} resizeMode="contain" /> : <View style={[styles.escudoCalendar, styles.placeholderEscudoCal]}><Ionicons name="shield-outline" size={14} color={yunke.textTertiary} /></View>
                )}
                <Text style={styles.teamText} numberOfLines={1}>{!item.es_local ? 'Club Yunke' : item.rival}</Text>
              </View>

            </View>

            {/* Columna Derecha: Resultado */}
            <View style={styles.resultContainer}>
              {esResultado && (
                <Text style={[styles.scoreText, { color: resultado.color }]}>
                  {item.resultado_local} - {item.resultado_visitante}
                </Text>
              )}
            </View>
          </View>

          {/* Competición y ubicación */}
          {(item.competicion || item.ubicacion) && (
            <View style={styles.cardFooter}>
              {item.competicion && (
                <Text style={styles.cardFooterText}>{item.competicion}</Text>
              )}
              {item.competicion && item.ubicacion && (
                <Text style={styles.cardFooterDot}>•</Text>
              )}
              {item.ubicacion && (
                <Text style={styles.cardFooterText}>{item.ubicacion}</Text>
              )}
            </View>
          )}
        </View>
      </FadeInUp>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER CON GRADIENTE */}
      <LinearGradient
        colors={yunke.gradientHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <Text style={styles.screenTitle}>Calendario</Text>
        <Text style={styles.headerSubtitle}>Próximos partidos y resultados</Text>
      </LinearGradient>

      {/* Selector de filtro */}
      <View style={styles.filterContainer}>
        <Pressable 
          style={[styles.filterPill, filtro === 'proximos' && styles.filterPillActive]} 
          onPress={() => setFiltro('proximos')}
        >
          <Ionicons name="calendar-outline" size={16} color={filtro === 'proximos' ? yunke.white : yunke.textSecondary} />
          <Text style={[styles.filterText, filtro === 'proximos' && styles.filterTextActive]}>
            Próximos
          </Text>
        </Pressable>
        <Pressable 
          style={[styles.filterPill, filtro === 'resultados' && styles.filterPillActive]} 
          onPress={() => setFiltro('resultados')}
        >
          <Ionicons name="trophy-outline" size={16} color={filtro === 'resultados' ? yunke.white : yunke.textSecondary} />
          <Text style={[styles.filterText, filtro === 'resultados' && styles.filterTextActive]}>
            Resultados
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={filtro === 'proximos' ? proximos : resultados}
        keyExtractor={(item) => item.id}
        renderItem={renderPartido}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom, paddingTop: 10 }}
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
  
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: yunke.dark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  screenTitle: {
    fontSize: 34,
    fontFamily: 'Montserrat_900Black',
    color: yunke.white,
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  
  // Filtro premium
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 10,
  },
  filterPill: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: yunke.card,
    borderWidth: 1,
    borderColor: yunke.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: yunke.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  filterPillActive: {
    backgroundColor: yunke.primary,
    borderColor: yunke.primary,
    shadowColor: yunke.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  filterText: {
    fontSize: 15,
    fontFamily: 'Montserrat_600SemiBold',
    color: yunke.textSecondary,
  },
  filterTextActive: {
    color: yunke.white,
  },

  // Cards premium
  card: {
    backgroundColor: yunke.card,
    marginHorizontal: 24,
    marginBottom: 12,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: yunke.dark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  categoryTop: {
    fontSize: 10,
    fontFamily: 'Montserrat_600SemiBold',
    color: yunke.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
    paddingBottom: 10,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: yunke.border,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderBottomRightRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  resultIndicatorText: {
    color: yunke.white,
    fontSize: 11,
    fontFamily: 'Montserrat_700Bold',
  },
  dateContainer: {
    width: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: yunke.text,
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
    color: yunke.textSecondary,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 44,
    backgroundColor: yunke.border,
    marginHorizontal: 12,
  },
  matchInfo: {
    flex: 1,
  },
  teamText: {
    fontSize: 15,
    fontFamily: 'Montserrat_600SemiBold',
    color: yunke.text,
  },
  vsText: {
    fontSize: 11,
    fontFamily: 'Montserrat_400Regular',
    color: yunke.textSecondary,
    marginVertical: 2,
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: yunke.border,
  },
  cardFooterText: {
    fontSize: 11,
    fontFamily: 'Montserrat_400Regular',
    color: yunke.textSecondary,
  },
  cardFooterDot: {
    fontSize: 11,
    color: yunke.textTertiary,
  },
  resultContainer: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 20,
    fontFamily: 'Montserrat_700Bold',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  locationHome: {
    backgroundColor: yunke.primary + '15',
  },
  locationAway: {
    backgroundColor: yunke.surface,
    borderWidth: 1,
    borderColor: yunke.border,
  },
  locationText: {
    fontSize: 11,
    fontFamily: 'Montserrat_700Bold',
    color: yunke.primary,
  },
  locationTextAway: {
    color: yunke.textSecondary,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 60,
    fontSize: 16,
    fontFamily: 'Montserrat_400Regular',
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
    backgroundColor: yunke.surface,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
});

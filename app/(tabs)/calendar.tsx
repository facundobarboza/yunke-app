import { EmptyState } from '@/components/EmptyState';
import { FadeInUp } from '@/components/FadeInUp';
import { ScreenHeader } from '@/components/ScreenHeader';
import { yunke } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
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
  penales_local: number | null;
  penales_visitante: number | null;
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

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={yunke.primary} /></View>;
  }

  const renderPartido = ({ item, index }: { item: Partido; index: number }) => {
    const esResultado = filtro === 'resultados';
    const nombreLocal = item.es_local ? 'Yunke FC' : item.rival;
    const nombreVisitante = item.es_local ? item.rival : 'Yunke FC';
    const escudoLocal = item.es_local ? require('../../assets/images/yunke-logo.png') : (item.escudo_url ? { uri: item.escudo_url } : null);
    const escudoVisitante = item.es_local ? (item.escudo_url ? { uri: item.escudo_url } : null) : require('../../assets/images/yunke-logo.png');
    const tienePenales = item.penales_local != null && item.penales_visitante != null;

    return (
      <FadeInUp delay={index * 80}>
        <View style={styles.card}>
          {/* Header: categoría */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardCategory}>{item.categoria_nombre || 'General'}</Text>
            {item.competicion && <Text style={styles.cardCompeticion}>{item.competicion}</Text>}
          </View>

          {/* Match principal: equipos lado a lado */}
          <View style={styles.matchContent}>
            {/* Local */}
            <View style={styles.teamColumn}>
              {escudoLocal ? (
                <Image source={escudoLocal} style={styles.teamEscudo} resizeMode="contain" />
              ) : (
                <View style={[styles.teamEscudo, styles.escudoPlaceholder]}>
                  <Ionicons name="shield-outline" size={18} color={yunke.textTertiary} />
                </View>
              )}
              <Text style={styles.teamName} numberOfLines={1}>{nombreLocal}</Text>
            </View>

            {/* Score / VS */}
            <View style={styles.scoreColumn}>
              {esResultado ? (
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
                <View style={styles.vsBadge}>
                  <Text style={styles.vsText}>VS</Text>
                </View>
              )}
            </View>

            {/* Visitante */}
            <View style={styles.teamColumn}>
              {escudoVisitante ? (
                <Image source={escudoVisitante} style={styles.teamEscudo} resizeMode="contain" />
              ) : (
                <View style={[styles.teamEscudo, styles.escudoPlaceholder]}>
                  <Ionicons name="shield-outline" size={18} color={yunke.textTertiary} />
                </View>
              )}
              <Text style={styles.teamName} numberOfLines={1}>{nombreVisitante}</Text>
            </View>
          </View>

          {/* Footer: fecha, ubicación */}
          <View style={styles.cardFooter}>
            <View style={styles.footerInfo}>
              <Ionicons name="calendar-outline" size={11} color={yunke.textSecondary} />
              <Text style={styles.footerText}>{formatearFecha(item.fecha)}</Text>
              <Ionicons name="time-outline" size={11} color={yunke.textSecondary} style={{ marginLeft: 6 }} />
              <Text style={styles.footerText}>{formatearHora(item.fecha)}</Text>
            </View>
            {item.ubicacion && (
              <View style={styles.footerInfo}>
                <Ionicons name="location-outline" size={11} color={yunke.textSecondary} />
                <Text style={styles.footerText} numberOfLines={1}>{item.ubicacion}</Text>
              </View>
            )}
          </View>
        </View>
      </FadeInUp>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Calendario"
        subtitle="Próximos partidos y resultados"
      />

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
          <EmptyState
            title={filtro === 'proximos' ? 'No hay partidos programados' : 'No hay resultados'}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: yunke.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: yunke.surface },
  
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

  // Card del partido
  card: {
    backgroundColor: yunke.card,
    marginHorizontal: 24,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: yunke.dark,
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
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: yunke.border,
  },
  cardCategory: {
    fontSize: 10,
    fontFamily: 'Montserrat_600SemiBold',
    color: yunke.textSecondary,
    textTransform: 'uppercase',
  },
  cardCompeticion: {
    fontSize: 10,
    fontFamily: 'Montserrat_500Medium',
    color: yunke.primary,
  },

  // Match content
  matchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  teamColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  teamEscudo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  escudoPlaceholder: {
    backgroundColor: yunke.surface,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: yunke.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamName: {
    fontSize: 11,
    fontFamily: 'Montserrat_600SemiBold',
    color: yunke.text,
    textAlign: 'center',
    maxWidth: 70,
  },

  // Score
  scoreColumn: {
    alignItems: 'center',
    minWidth: 70,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreNumber: {
    fontSize: 24,
    fontFamily: 'Montserrat_600SemiBold',
    color: yunke.text,
  },
  scoreDash: {
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
    color: yunke.textSecondary,
  },
  penalesSide: {
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    color: yunke.text,
  },
  vsBadge: {
    backgroundColor: yunke.surface,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  vsText: {
    fontSize: 13,
    fontFamily: 'Montserrat_700Bold',
    color: yunke.textSecondary,
  },

  // Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: yunke.border,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 10,
    fontFamily: 'Montserrat_400Regular',
    color: yunke.textSecondary,
  },
});

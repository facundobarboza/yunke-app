import { FadeInUp } from '@/components/FadeInUp';
import { yunke } from '@/constants/Colors';
import { useTheme } from '@/src/hooks/useTheme';
import type { ThemePalette } from '@/constants/Colors';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFeatureFlag } from '../../src/hooks/useFeatureFlag';
import { supabase } from '../../src/supabase';

const { width } = Dimensions.get('window');

// Foto fija de la camiseta del club — vive como asset porque es intencionalmente estática
const HEADER_IMAGE = require('../../assets/images/home-header.jpeg');

type Partido = {
  id: string;
  fecha: string;
  rival: string;
  es_local: boolean;
  competicion: string | null;
  ubicacion: string | null;
  categoria_id: number | null;
  escudo_url: string | null;
  categoria_nombre: string | null;
};

type Sponsor = {
  id: string;
  nombre: string;
  logo_url: string | null;
  portada_url: string | null;
};

type Categoria = {
  id: number;
  nombre: string;
  foto_url: string | null;
  jugadores_count?: number;
};

/** "RRGGBB" hex -> rgba string, for translucent gradient overlays */
const withOpacity = (hex: string, opacity: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
};

const CATEGORY_GRADIENTS: readonly (readonly [string, string])[] = [
  ['#1A2858', '#2E4694'] as const, // azul
  ['#6d0202', '#E01020'] as const, // rojo
  ['#D4941C', '#F5A623'] as const, // dorado
  ['#0F4C3A', '#1B8A5A'] as const, // verde
  ['#4A1A6B', '#7B2D8E'] as const, // púrpura
  ['#1A3A4A', '#2D7D9A'] as const, // teal
];

export default function HomeScreen() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [proximosPartidos, setProximosPartidos] = useState<Partido[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { isEnabled: showMembershipBanner } = useFeatureFlag('show_membership_banner');

  const flatListRef = useRef<FlatList>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [])
  );

  // Efecto para el carrusel automático de sponsors
  useEffect(() => {
    if (sponsors.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => {
          const next = prev + 1 === sponsors.length ? 0 : prev + 1;
          flatListRef.current?.scrollToIndex({ index: next, animated: true });
          return next;
        });
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [sponsors]);

  const cargarDatos = async () => {
    setLoading(true);

    // Cargar categorías por separado
    const { data: categoriasData } = await supabase
      .from('categorias')
      .select('id, nombre');

    const categoriasMap = new Map<number, string>();
    if (categoriasData) {
      categoriasData.forEach((cat) => categoriasMap.set(cat.id, cat.nombre));
    }

    // Cargar categorías con conteo de jugadores para las tarjetas
    const { data: catsConCount } = await supabase
      .from('categorias')
      .select('id, nombre, foto_url');

    if (catsConCount) {
      const counts = await Promise.all(
        catsConCount.map(async (cat) => {
          const { count } = await supabase
            .from('jugadores')
            .select('*', { count: 'exact', head: true })
            .eq('categoria_id', cat.id)
            .eq('is_active', true);
          return { ...cat, jugadores_count: count ?? 0 };
        })
      );
      setCategorias(counts);
    }

    const { data: partidosData } = await supabase
      .from('partidos')
      .select('id, fecha, rival, es_local, competicion, escudo_url, categoria_id, ubicacion')
      .gte('fecha', new Date().toISOString())
      .order('fecha', { ascending: true })
      .limit(5);

    // Mapear categoría_id a nombre
    const partidosConCategoria = (partidosData || []).map((p) => ({
      ...p,
      categoria_nombre: p.categoria_id ? categoriasMap.get(p.categoria_id) || null : null,
    }));

    const { data: sponsorsData } = await supabase
      .from('sponsors')
      .select('id, nombre, logo_url, portada_url')
      .eq('is_active', true)
      .order('orden', { ascending: true });

    setProximosPartidos(partidosConCategoria);
    setSponsors(sponsorsData || []);
    setLoading(false);
  };

  const formatearFecha = (fechaISO: string) => {
    const opciones: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
    return new Date(fechaISO).toLocaleDateString('es-ES', opciones);
  };

  const formatearHora = (fechaISO: string) => {
    return new Date(fechaISO).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  // Renderizado del Carrusel de Sponsors Premium
  const renderSponsor = ({ item }: { item: Sponsor }) => (
    <Pressable 
      style={styles.sponsorCard} 
      onPress={() => router.push(`/sponsor/${item.id}`)}
    >
      {item.portada_url ? (
        <>
          <Image source={{ uri: item.portada_url }} style={styles.sponsorCover} resizeMode="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.sponsorOverlay}
          />
          <Text style={styles.sponsorOverlayText}>{item.nombre}</Text>
        </>
      ) : item.logo_url ? (
        <Image source={{ uri: item.logo_url }} style={styles.sponsorLogo} resizeMode="contain" />
      ) : (
        <Text style={styles.sponsorNameText}>{item.nombre}</Text>
      )}
    </Pressable>
  );

  // Renderizado de las tarjetas de Partidos
  const renderPartido = ({ item, index }: { item: Partido; index: number }) => (
    <FadeInUp delay={index * 100}>
      <View style={styles.matchCard}>
        
        <View style={styles.matchTop}>
          <Text style={styles.matchCategory}>
            {item.categoria_nombre || 'General'}
          </Text>
          <Text style={styles.matchCompeticion}>
            {item.competicion ? `${item.competicion}` : ''}
          </Text>
        </View>
        
        <View style={styles.matchTeamsContainer}>
          <View style={styles.teamColumn}>
            <Image 
              source={require('../../assets/images/yunke-logo.png')} 
              style={styles.teamEscudo} 
              resizeMode="contain" 
            />
            <Text style={styles.teamNameShort} numberOfLines={1}>YUNKE FC</Text>
          </View>
          
          <View style={styles.vsContainer}>
            <View style={styles.vsCircle}>
              <Text style={styles.vsText}>VS</Text>
            </View>
          </View>
          
          <View style={styles.teamColumn}>
            {item.escudo_url ? (
              <Image source={{ uri: item.escudo_url }} style={styles.teamEscudo} resizeMode="contain" />
            ) : (
              <View style={[styles.teamEscudo, styles.placeholderEscudo]}>
                <Ionicons name="shield-outline" size={24} color={colors.textTertiary} />
              </View>
            )}
            <Text style={styles.teamNameShort} numberOfLines={1}>{item.rival.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.matchFooter}>
          <View style={styles.matchDateContainer}>
            <Ionicons name="calendar-outline" size={10} color={colors.textSecondary} />
            <Text style={styles.matchDateText}>{formatearFecha(item.fecha)},</Text>
            <Text style={styles.matchTimeText}>{formatearHora(item.fecha)} HS.</Text>
          </View>
          {item.ubicacion ? (
          <View style={styles.matchTimeContainer}>
            <Ionicons name="location-outline" size={10} color={colors.textSecondary} />
            <Text style={styles.matchUbicationText}>{item.ubicacion}</Text>
          </View>
          ) : null}
        </View>
      </View>
    </FadeInUp>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primaryLight} /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}>
      {/* HEADER CON FOTO DE FONDO + OVERLAY AZUL */}
      <ImageBackground
        source={HEADER_IMAGE}
        style={[styles.header, { paddingTop: insets.top }]}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(26,40,88,0.85)', 'rgba(32,48,112,0.78)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Image 
          source={require('../../assets/images/yunke-logo.png')} 
          style={styles.headerLogo} 
          resizeMode="contain" 
        />
        <Text style={styles.clubTitle}>YUNKE</Text>
        <Text style={styles.clubSubtitle}>FÚTBOL CLUB</Text>
      </ImageBackground>

      {/* CARRUSEL DE SPONSORS */}
      {sponsors.length > 0 && (
        <View style={styles.sponsorsSection}>
          <Text style={styles.sectionTitle}>Nuestros Sponsors</Text>
          <FlatList
            ref={flatListRef}
            data={sponsors}
            renderItem={renderSponsor}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScrollToIndexFailed={(info) => {
              setTimeout(() => flatListRef.current?.scrollToIndex({ index: info.index, animated: true }), 100);
            }}
          />
          {/* Dots indicadores */}
          {sponsors.length > 1 && (
            <View style={styles.dotsContainer}>
              {sponsors.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === currentSlide && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* PRÓXIMOS PARTIDOS */}
      <View style={styles.matchesSection}>
        <Text style={styles.sectionTitle}>Próximos Partidos</Text>
        {proximosPartidos.length > 0 ? (
          <FlatList
            data={proximosPartidos}
            renderItem={renderPartido}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 15 }}
          />
        ) : (
          <Text style={styles.emptyText}>No hay partidos programados.</Text>
        )}
      </View>

      {/* BANNER HACERTE SOCIO - Solo visible si el flag está habilitado */}
      {showMembershipBanner && (
        <Pressable style={styles.socioBanner} onPress={() => router.push('/benefits')}>
          <LinearGradient
            colors={yunke.gradientHeaderDark}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Estrella gigante como marca de agua */}
          <Ionicons name="star" size={140} color="rgba(245,166,35,0.08)" style={styles.bannerWatermark} />
          <View style={styles.bannerIconContainer}>
            <Ionicons name="gift-outline" size={28} color={yunke.gold} />
          </View>
          <View style={styles.bannerContent}>
            <View style={styles.bannerBadge}>
              <Text style={styles.bannerBadgeText}>SOCIOS</Text>
            </View>
            <Text style={styles.bannerTitle}>Beneficios Exclusivos</Text>
            <Text style={styles.bannerSubtitle}>Descubrí todo lo que ganás por ser socio del club</Text>
          </View>
        </Pressable>
      )}

      {/* SECCIÓN DE CATEGORÍAS */}
      {categorias.length > 0 && (
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Nuestros Equipos</Text>
          <View style={styles.categoriesGrid}>
            {categorias.map((cat, index) => {
              const gradient = CATEGORY_GRADIENTS[index % CATEGORY_GRADIENTS.length];
              return (
                <FadeInUp key={cat.id} delay={index * 80}>
                  <Pressable
                    style={styles.categoryCard}
                    onPress={() => router.push({ pathname: '/team', params: { categoria: cat.id } })}
                  >
                    {cat.foto_url && (
                      <Image
                        source={{ uri: cat.foto_url }}
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                      />
                    )}
                    <LinearGradient
                      colors={
                        cat.foto_url
                          ? [withOpacity(gradient[0], 0.78), withOpacity(gradient[1], 0.72)]
                          : gradient
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.categoryGradient}
                    >
                      {/* Icono badge arriba a la izquierda */}
                      <View style={styles.categoryIconBadge}>
                        <Ionicons name="football" size={16} color={yunke.white} />
                      </View>

                      {/* Escudo Yunke asomándose desde la derecha */}
                      <Image
                        source={require('../../assets/images/yunke-logo.png')}
                        style={styles.categoryShield}
                        resizeMode="contain"
                      />

                      {/* Nombre abajo a la izquierda */}
                      <Text style={styles.categoryName}>{cat.nombre}</Text>
                    </LinearGradient>
                  </Pressable>
                </FadeInUp>
              );
            })}
          </View>
        </View>
      )}

    </ScrollView>
  );
}

const createStyles = (theme: ThemePalette) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.surface },
  
  // Header con foto de fondo + overlay azul
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden', // aplica el radio al ImageBackground
    backgroundColor: yunke.primary, // fallback mientras carga la foto
    shadowColor: theme.dark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  headerLogo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  clubTitle: {
    fontSize: 36,
    fontFamily: 'Montserrat_900Black',
    color: yunke.white,
    letterSpacing: -1,
    textAlign: 'center',
  },
  clubSubtitle: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  
  // Sponsors
  sponsorsSection: { marginTop: 24, marginBottom: 10 },
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'Montserrat_700Bold',
    color: theme.isDark ? yunke.red : yunke.primary,
    marginBottom: 15,
    paddingHorizontal: 24,
  },
  sponsorCard: {
    width: width - 48,
    height: 180,
    backgroundColor: theme.card,
    borderRadius: 20,
    marginHorizontal: 24,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
  },
  sponsorLogo: { width: '70%', height: '70%' },
  sponsorCover: { 
    width: '100%', 
    height: '100%', 
    borderRadius: 20 
  },
  sponsorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  sponsorOverlayText: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    color: yunke.white,
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  sponsorNameText: { 
    fontSize: 20, 
    fontFamily: 'Montserrat_700Bold', 
    color: theme.text 
  },

  // Dots del carrusel
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: yunke.primary,
    borderRadius: 4,
  },

  // Partidos
  matchesSection: { marginTop: 24, marginBottom: 10 },
  matchCard: {
    width: 350,
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 10,
    paddingTop: 0,
    shadowColor: theme.dark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
  },
  matchTop: {
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    paddingBottom: 12,
    marginTop: 10,
    marginBottom: 10,
  },
  matchCategory: {
    textAlign: 'center',
    fontSize: 10,
    fontFamily: 'Montserrat_600SemiBold',
    color: theme.textSecondary,
    textTransform: 'uppercase',
  },
  matchCompeticion: {
    textAlign: 'center',
    fontSize: 10,
    fontFamily: 'Montserrat_600SemiBold',
    color: theme.textSecondary,
    letterSpacing: 0.5,
  },
  matchTeamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  teamColumn: {
    flex: 1,
    alignItems: 'center',
  },
  teamNameShort: {
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
    color: theme.text,
    marginTop: 6,
  },
  vsContainer: {
    paddingHorizontal: 5,
  },
  vsCircle: {
    width: 20,
    height: 20,
    borderRadius: 25,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vsText: {
    fontSize: 8,
    fontFamily: 'Montserrat_900Black',
    color: theme.textSecondary,
  },
  matchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingTop: 15,
  },
  matchDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  matchDateText: {
    fontSize: 10,
    fontFamily: 'Montserrat_600SemiBold',
    color: theme.textSecondary,
    textTransform: 'capitalize',
  },
  matchTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchTimeText: {
    fontSize: 10,
    fontFamily: 'Montserrat_600SemiBold',
    color: theme.textSecondary,
  },
  matchUbicationText: {
    fontSize: 10,
    fontFamily: 'Montserrat_600SemiBold',
    color: theme.textSecondary,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 10,
    color: theme.textSecondary,
    paddingHorizontal: 24,
  },
  teamEscudo: { 
    width: 50,
    height: 50,
  },
  placeholderEscudo: {
    backgroundColor: theme.surface,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center'
  },

  // Banner Socio
  socioBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    marginBottom: 10,
    shadowColor: yunke.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  bannerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245,166,35,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.45)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 6,
  },
  bannerBadgeText: {
    color: yunke.gold,
    fontSize: 10,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 1,
  },
  bannerWatermark: {
    position: 'absolute',
    right: -14,
    bottom: -14,
  },
  bannerIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(245,166,35,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
    color: yunke.white,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },

  // Categorías
  categoriesSection: { marginTop: 24, marginBottom: 10 },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryCard: {
    width: (width - 52) / 2,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: theme.dark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  categoryGradient: {
    paddingTop: 14,
    paddingBottom: 18,
    paddingLeft: 16,
    paddingRight: 16,
    minHeight: 130,
    justifyContent: 'space-between',
  },
  categoryIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryShield: {
    position: 'absolute',
    right: -12,
    bottom: 28,
    width: 90,
    height: 90,
    opacity: 0.2,
    transform: [{ rotate: '12deg' }],
  },
  categoryName: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    color: yunke.white,
    lineHeight: 22,
  },
});

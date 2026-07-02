import { FadeInUp } from '@/components/FadeInUp';
import { yunke } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../../src/supabase';

const { width } = Dimensions.get('window');

type Partido = {
  id: string;
  fecha: string;
  rival: string;
  es_local: boolean;
  competicion: string | null;
  categorias: { nombre: string }[] | null;
  escudo_url: string | null;
};

type Noticia = {
  id: string;
  titulo: string;
  contenido: string;
  created_at: string;
};

type Sponsor = {
  id: string;
  nombre: string;
  logo_url: string | null;
  portada_url: string | null;
};

export default function HomeScreen() {
  const [proximosPartidos, setProximosPartidos] = useState<Partido[]>([]);
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
    
    const { data: partidosData } = await supabase
      .from('partidos')
      .select('id, fecha, rival, es_local, competicion, escudo_url, categorias(nombre)')
      .gte('fecha', new Date().toISOString())
      .order('fecha', { ascending: true })
      .limit(5);

    const { data: noticiasData } = await supabase
      .from('noticias')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

    const { data: sponsorsData } = await supabase
      .from('sponsors')
      .select('id, nombre, logo_url, portada_url')
      .eq('is_active', true)
      .order('orden', { ascending: true });

    setProximosPartidos(partidosData || []);
    setNoticias(noticiasData || []);
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

  // Renderizado del Carrusel de Sponsors
  const renderSponsor = ({ item }: { item: Sponsor }) => (
    <Pressable 
      style={styles.sponsorCard} 
      onPress={() => router.push(`/sponsor/${item.id}`)}
    >
      {item.portada_url ? (
        <Image source={{ uri: item.portada_url }} style={styles.sponsorCover} resizeMode="cover" />
      ) : item.logo_url ? (
        <Image source={{ uri: item.logo_url }} style={styles.sponsorLogo} resizeMode="contain" />
      ) : (
        <Text style={styles.sponsorNameText}>{item.nombre}</Text>
      )}
    </Pressable>
  );

  // Renderizado de las tarjetas de Partidos (Horizontales) con fade in escalonado
  const renderPartido = ({ item, index }: { item: Partido; index: number }) => (
    <FadeInUp delay={index * 100}>
      <View style={styles.matchCard}>
        {/* Barra de acento rojo */}
        <View style={styles.matchAccent} />
        
        <View style={styles.matchTop}>
          <Text style={styles.matchCategory}>
            {item.categorias?.[0]?.nombre || 'General'} {item.competicion ? ` - ${item.competicion}` : ''}
          </Text>
        </View>
        
        <View style={styles.matchTeamsContainer}>
        <View style={styles.teamColumn}>
          {/* Escudo Yunke (Local) */}
          <Image source={require('../../assets/images/yunke-logo.png')} style={styles.teamEscudo} resizeMode="contain" />
          <Text style={styles.teamNameShort} numberOfLines={1}>YUNKE</Text>
        </View>
        
        <View style={styles.vsContainer}>
          <Text style={styles.vsText}>VS</Text>
        </View>
        
        <View style={styles.teamColumn}>
          {/* Escudo Rival */}
          {item.escudo_url ? (
            <Image source={{ uri: item.escudo_url }} style={styles.teamEscudo} resizeMode="contain" />
          ) : (
            <View style={[styles.teamEscudo, styles.placeholderEscudo]}><Ionicons name="shield-outline" size={20} color="#C7C7CC" /></View>
          )}
          <Text style={styles.teamNameShort} numberOfLines={1}>{item.rival.toUpperCase()}</Text>
        </View>
      </View>

        <View style={styles.matchFooter}>
          <View style={styles.matchDateContainer}>
            <Ionicons name="calendar-outline" size={14} color={yunke.textSecondary} />
            <Text style={styles.matchDateText}>{formatearFecha(item.fecha)}</Text>
          </View>
          <View style={styles.matchTimeContainer}>
            <Ionicons name="time-outline" size={14} color={yunke.red} />
            <Text style={styles.matchTimeText}>{formatearHora(item.fecha)} HS</Text>
          </View>
        </View>
      </View>
    </FadeInUp>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={yunke.primary} /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      {/* HEADER CON GRADIENTE AZUL */}
      <LinearGradient
        colors={[yunke.primary, yunke.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.clubTitle}>YUNKE FC</Text>
        {/*<Text style={styles.clubSubtitle}>Futbol Club</Text>*/}
      </LinearGradient>

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

      {/* BANNER HACERTE SOCIO */}
      <View style={styles.socioBanner}>
        <View style={styles.bannerIcon}>
          <Ionicons name="star" size={24} color={yunke.gold} />
        </View>
        <Pressable style={styles.bannerContent} onPress={() => router.push('/benefits')}>
          <Text style={styles.bannerTitle}>Beneficios Exclusivos</Text>
          <Text style={styles.bannerSubtitle}>Descubrí todo lo que ganás por ser socio del club</Text>
        </Pressable>
        <Ionicons name="chevron-forward" size={22} color={yunke.textTertiary} />
      </View>

      {/* SECCIÓN DE NOTICIAS */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Noticias</Text>
      </View>

      {noticias.map((noticia) => (
        <View key={noticia.id} style={styles.newsCard}>
          <Text style={styles.newsTitle}>{noticia.titulo}</Text>
          <Text style={styles.newsContent} numberOfLines={3}>{noticia.contenido}</Text>
          <Text style={styles.newsDate}>
            {new Date(noticia.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: yunke.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: yunke.surface },
  
  // Header con gradiente
  header: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  clubTitle: {
    fontSize: 34,
    fontFamily: 'Montserrat_900Black',
    color: yunke.white,
    letterSpacing: -0.5,
  },
  clubSubtitle: {
    fontSize: 16,
    fontFamily: 'Montserrat_400Regular',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  
  // Sponsors
  sponsorsSection: { marginTop: 24, marginBottom: 10 },
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'Montserrat_700Bold',
    color: yunke.text,
    marginBottom: 15,
    paddingHorizontal: 24,
  },
  sponsorCard: {
    width: width - 48,
    height: 180,
    backgroundColor: yunke.card,
    borderRadius: 15,
    marginHorizontal: 24,
    marginBottom: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: yunke.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sponsorLogo: { width: '80%', height: '80%' },
  sponsorCover: { width: '100%', height: '100%', borderRadius: 15 },
  sponsorNameText: { fontSize: 20, fontWeight: 'bold', color: yunke.text },

  // Dots del carrusel
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: yunke.border,
  },
  dotActive: {
    width: 20,
    backgroundColor: yunke.primary,
    borderRadius: 3,
  },

  // Partidos
  matchesSection: { marginTop: 20 },
  matchCard: {
    width: 350,
    backgroundColor: yunke.card,
    borderRadius: 15,
    padding: 20,
    marginBottom: 10,
    paddingTop: 0,
    shadowColor: yunke.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  matchAccent: {
    height: 4,
    backgroundColor: yunke.red,
    marginHorizontal: -20,
    marginBottom: 16,
  },
  matchTop: {
    borderBottomWidth: 1,
    borderBottomColor: yunke.border,
    paddingBottom: 12,
    marginBottom: 15,
  },
  matchCategory: {
    fontSize: 13,
    fontWeight: '600',
    color: yunke.textSecondary,
    textTransform: 'uppercase',
  },
  matchTeamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  teamColumn: {
    flex: 1,
    alignItems: 'center',
  },
  teamNameShort: {
    fontSize: 12,
    color: yunke.text,
    fontWeight: '700',
    marginTop: 4,
  },
  vsContainer: {
    paddingHorizontal: 10,
  },
  vsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: yunke.textSecondary,
  },
  matchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: yunke.border,
    paddingTop: 15,
  },
  matchDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  matchDateText: {
    fontSize: 12,
    color: yunke.textSecondary,
    textTransform: 'capitalize',
  },
  matchTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchTimeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: yunke.red,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: yunke.textSecondary,
    paddingHorizontal: 24,
  },
  teamEscudo: { 
    width: 40,
    height: 40,
    marginBottom: 8
  },
  placeholderEscudo: {
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },

  // Noticias
  sectionHeader: { paddingHorizontal: 24, marginTop: 30, marginBottom: 15 },
  newsCard: {
    backgroundColor: yunke.card,
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: yunke.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  newsTitle: { fontSize: 18, fontWeight: '600', color: yunke.text, marginBottom: 8 },
  newsContent: { fontSize: 15, color: yunke.darkSoft, lineHeight: 22, opacity: 0.8 },
  newsDate: { fontSize: 13, color: yunke.textSecondary, marginTop: 12, textTransform: 'capitalize' },

  // Banner Socio
  socioBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: yunke.card,
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: yunke.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  bannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: yunke.goldLight + '30', // Dorado con 30% opacidad
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: yunke.text,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: yunke.textSecondary,
    marginTop: 2,
  },
});

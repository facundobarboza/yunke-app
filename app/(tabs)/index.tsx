import { Ionicons } from '@expo/vector-icons';
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
      }, 4000); // Cambia cada 4 segundos

      return () => clearInterval(interval);
    }
  }, [sponsors]);

  const cargarDatos = async () => {
    setLoading(true);
    
    // Traemos los próximos 5 partidos
    const { data: partidosData, error: errPartidos } = await supabase
      .from('partidos')
      .select('id, fecha, rival, es_local, competicion, categorias(nombre)')
      .gte('fecha', new Date().toISOString())
      .order('fecha', { ascending: true })
      .limit(5);

    const { data: noticiasData, error: errNoticias } = await supabase
      .from('noticias')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

    const { data: sponsorsData, error: errSponsors } = await supabase
      .from('sponsors')
      .select('id, nombre, logo_url')
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
      {item.logo_url ? (
        <Image source={{ uri: item.logo_url }} style={styles.sponsorLogo} resizeMode="contain" />
      ) : (
        <Text style={styles.sponsorNameText}>{item.nombre}</Text>
      )}
    </Pressable>
  );

  // Renderizado de las tarjetas de Partidos (Horizontales)
  const renderPartido = ({ item }: { item: Partido }) => (
    <View style={styles.matchCard}>
      <View style={styles.matchTop}>
        <Text style={styles.matchCategory}>
          {item.categorias?.[0]?.nombre || 'General'} {item.competicion ? ` - ${item.competicion}` : ''}
        </Text>
      </View>
      
      <View style={styles.matchTeamsContainer}>
        <View style={styles.teamColumn}>
          <Text style={styles.teamNameShort} numberOfLines={1}>YUNKE</Text>
          <Text style={styles.teamLabel}>{item.es_local ? 'LOCAL' : 'VISITANTE'}</Text>
        </View>
        
        <View style={styles.vsContainer}>
          <Text style={styles.vsText}>VS</Text>
        </View>
        
        <View style={styles.teamColumn}>
          <Text style={styles.teamNameShort} numberOfLines={1}>{item.rival.toUpperCase()}</Text>
          <Text style={styles.teamLabel}>{item.es_local ? 'VISITANTE' : 'LOCAL'}</Text>
        </View>
      </View>

      <View style={styles.matchFooter}>
        <View style={styles.matchDateContainer}>
          <Ionicons name="calendar-outline" size={14} color="#8E8E93" />
          <Text style={styles.matchDateText}>{formatearFecha(item.fecha)}</Text>
        </View>
        <View style={styles.matchTimeContainer}>
          <Ionicons name="time-outline" size={14} color="#FF3B30" />
          <Text style={styles.matchTimeText}>{formatearHora(item.fecha)} HS</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#000" /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={styles.header}>
        <Text style={styles.clubTitle}>AC YUNKE FC</Text>
      </View>

      {/* CARRUSEL DE SPONSORS (ARRIBA) */}
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
        </View>
      )}

      {/* PRÓXIMOS PARTIDOS (LISTA HORIZONTAL) */}
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
      <Pressable 
          style={styles.socioBanner} 
          onPress={() => router.push('/benefits')}
        >
        <View style={styles.bannerIcon}>
          <Ionicons name="star" size={24} color="#FF9500" />
        </View>
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerTitle}>Beneficios Exclusivos</Text>
          <Text style={styles.bannerSubtitle}>Descubre todo lo que ganás por ser socio del club</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color="#C7C7CC" />
      </Pressable>

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
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7' },
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 10 },
  clubTitle: { fontSize: 34, fontWeight: 'bold', color: '#1C1C1E', letterSpacing: -1 },
  clubSubtitle: { fontSize: 17, color: '#8E8E93', marginTop: 4 },
  
  // Sponsors
  sponsorsSection: { marginTop: 20, marginBottom: 10 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 15, paddingHorizontal: 24 },
  sponsorCard: {
    width: width - 48,
    height: 110,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sponsorLogo: { width: '80%', height: '80%' },
  sponsorNameText: { fontSize: 20, fontWeight: 'bold', color: '#1C1C1E' },

  // Partidos Horizontales
  matchesSection: { marginTop: 20 },
  matchCard: {
    width: 280, // Ancho fijo para que se vean varios en pantalla
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  matchTop: {
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    paddingBottom: 12,
    marginBottom: 15,
  },
  matchCategory: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  teamLabel: {
    fontSize: 11,
    color: '#C7C7CC',
    fontWeight: '600',
    marginTop: 4,
  },
  vsContainer: {
    paddingHorizontal: 10,
  },
  vsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8E8E93',
  },
  matchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
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
    color: '#8E8E93',
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
    color: '#FF3B30',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#8E8E93',
    paddingHorizontal: 24,
  },

  // Noticias
  sectionHeader: { paddingHorizontal: 24, marginTop: 30, marginBottom: 15 },
  newsCard: {
    backgroundColor: '#FFFFFF', marginHorizontal: 24, marginBottom: 16, borderRadius: 16, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2,
  },
  newsTitle: { fontSize: 18, fontWeight: '600', color: '#1C1C1E', marginBottom: 8 },
  newsContent: { fontSize: 15, color: '#3C3C43', lineHeight: 22, opacity: 0.8 },
  newsDate: { fontSize: 13, color: '#8E8E93', marginTop: 12, textTransform: 'capitalize' },

  // Banner Socio
  socioBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  bannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF4E6', // Fondo naranja muy suave
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
});
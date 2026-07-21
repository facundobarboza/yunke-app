import { yunke } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../src/supabase';

const { width } = Dimensions.get('window');

type JugadorDetalle = {
  id: string;
  nombre: string;
  apellido: string | null;
  is_capitan: boolean | null;
  posicion: string | null;
  foto_url: string | null;
  fecha_nacimiento: string | null;
  nacionalidad: string | null;
  instagram: string | null;
  descripcion: string | null;
  categoria: { nombre: string } | null;
};

type Foto = {
  id: string;
  url: string;
};

export default function PlayerDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [jugador, setJugador] = useState<JugadorDetalle | null>(null);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchJugadorData(id as string);
  }, [id]);

  const fetchJugadorData = async (jugadorId: string) => {
    // Pedimos los datos del jugador y el nombre de su categoría
    const { data: jugadorData } = await supabase
      .from('jugadores')
      .select('*, categorias(nombre)')
      .eq('id', jugadorId)
      .single();

    // Pedimos las fotos de la galería
    const { data: fotosData } = await supabase
      .from('jugador_fotos')
      .select('id, url')
      .eq('jugador_id', jugadorId)
      .order('created_at', { ascending: false });

    setJugador(jugadorData as JugadorDetalle);
    setFotos(fotosData || []);
    setLoading(false);
  };

  // Calcular edad a partir de fecha de nacimiento
  const calcularEdad = (fechaNacimiento: string | null) => {
    if (!fechaNacimiento) return 'N/A';
    const diff = Date.now() - new Date(fechaNacimiento).getTime();
    const edad = new Date(diff).getUTCFullYear() - 1970;
    return edad.toString();
  };

  const openInstagram = (user: string) => {
    Linking.openURL(`https://instagram.com/${user}`);
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={yunke.white} /></View>;
  }

  if (!jugador) {
    return <View style={styles.center}><Text style={{color: yunke.white}}>No se encontró al jugador.</Text></View>;
  }

  return (
    <>
      <Stack.Screen />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* HEADER CON GRADIENTE */}
      <LinearGradient
        colors={yunke.gradientHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Pressable style={[styles.backButton, { paddingTop: insets.top }]} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={yunke.white} />
          <Text style={styles.backText}>Volver</Text>
        </Pressable>

        <View style={styles.profileContainer}>
          <View style={styles.photoWrapper}>
            {jugador.foto_url ? (
              <Image source={{ uri: jugador.foto_url }} style={styles.profilePhoto} />
            ) : (
              <View style={[styles.profilePhoto, styles.placeholderPhotoBg]}>
                <Text style={styles.placeholderText}>{jugador.nombre.charAt(0)}</Text>
              </View>
            )}
            {jugador.is_capitan === true && (
              <View style={styles.capitanBadge}>
                <Text style={styles.capitanBadgeText}>C</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.playerName}>{jugador.nombre} {jugador.apellido || ''}</Text>
          
          <View style={styles.positionContainer}>
            <Text style={styles.playerCategory}>{jugador.categoria?.nombre}</Text>
          </View>
          
          {jugador.instagram && (
            <Pressable style={styles.instagramBtn} onPress={() => openInstagram(jugador.instagram!)}>
              <Ionicons name="logo-instagram" size={16} color={yunke.white} />
              <Text style={styles.instagramText}>@{jugador.instagram}</Text>
            </Pressable>
          )}
        </View>
      </LinearGradient>

      {/* STATS RÁPIDAS */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="football-outline" size={18} color={yunke.primary} />
          </View>
          <Text style={styles.statValue}>{jugador.posicion || 'N/A'}</Text>
          <Text style={styles.statLabel}>Posición</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="calendar-outline" size={18} color={yunke.primary} />
          </View>
          <Text style={styles.statValue}>{calcularEdad(jugador.fecha_nacimiento)}</Text>
          <Text style={styles.statLabel}>Edad</Text>
        </View>
        {/* <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="globe-outline" size={18} color={yunke.primary} />
          </View>
          <Text style={styles.statValue}>{jugador.nacionalidad || 'N/A'}</Text>
          <Text style={styles.statLabel}>Nacionalidad</Text>
        </View> */}
      </View>

      {/* BIO / DESCRIPCIÓN */}
      {jugador.descripcion && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre el jugador</Text>
          <View style={styles.bioCard}>
            <Text style={styles.bioText}>{jugador.descripcion}</Text>
          </View>
        </View>
      )}

      {/* GALERÍA DE FOTOS */}
      {fotos.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Galería</Text>
          <FlatList
            data={fotos}
            renderItem={({ item }) => (
              <Image source={{ uri: item.url }} style={styles.galleryPhoto} resizeMode="cover" />
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: 12, paddingHorizontal: 4 }}
          />
        </View>
      )}
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: yunke.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: yunke.dark },
  
  // Header con gradiente
  header: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingBottom: 30,
    shadowColor: yunke.dark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  backButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingBottom: 20,
    gap: 4,
  },
  backText: { 
    fontSize: 16, 
    fontFamily: 'Montserrat_500Medium',
    color: yunke.white 
  },
  
  profileContainer: { alignItems: 'center' },
  photoWrapper: { position: 'relative', marginBottom: 16 },
  profilePhoto: { 
    width: 140, 
    height: 140, 
    borderRadius: 70, 
    borderWidth: 4, 
    borderColor: 'rgba(255,255,255,0.2)' 
  },
  placeholderPhotoBg: { 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  placeholderText: { 
    fontSize: 56, 
    fontFamily: 'Montserrat_700Bold', 
    color: yunke.white 
  },
  capitanBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: yunke.red,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: yunke.primary,
    shadowColor: yunke.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  capitanBadgeText: { 
    color: yunke.white, 
    fontSize: 18, 
    fontFamily: 'Montserrat_700Bold',
    fontWeight: 'bold',
  },
  playerName: { 
    fontSize: 28, 
    fontFamily: 'Montserrat_900Black', 
    color: yunke.white, 
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  positionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  playerCategory: { 
    fontSize: 15, 
    fontFamily: 'Montserrat_400Regular',
    color: 'rgba(255,255,255,0.7)', 
    textTransform: 'capitalize' 
  },
  instagramBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
    marginBottom: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  instagramText: { 
    color: yunke.white, 
    fontSize: 14, 
    fontFamily: 'Montserrat_500Medium' 
  },

  // Stats premium
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 24,
    marginTop: -25,
    marginBottom: 10,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: yunke.card,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: yunke.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: yunke.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: { 
    fontSize: 18, 
    fontFamily: 'Montserrat_700Bold', 
    color: yunke.text 
  },
  statLabel: { 
    fontSize: 11, 
    fontFamily: 'Montserrat_500Medium',
    color: yunke.textSecondary, 
    marginTop: 4, 
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Sections premium
  section: { marginTop: 28, paddingHorizontal: 24 },
  sectionTitle: { 
    fontSize: 18, 
    fontFamily: 'Montserrat_700Bold', 
    color: yunke.text, 
    marginBottom: 14 
  },
  bioCard: {
    backgroundColor: yunke.card,
    borderRadius: 16,
    padding: 18,
    shadowColor: yunke.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  bioText: { 
    fontSize: 15, 
    fontFamily: 'Montserrat_400Regular',
    color: yunke.darkSoft, 
    lineHeight: 24 
  },

  // Galería premium
  galleryPhoto: {
    width: width * 0.7,
    height: 260,
    borderRadius: 18,
  },
});

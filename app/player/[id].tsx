import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../../src/supabase';

const { width } = Dimensions.get('window');

type JugadorDetalle = {
  id: string;
  nombre: string;
  apellido: string | null;
  dorsal: number | null;
  posicion: string | null;
  foto_url: string | null;
  fecha_nacimiento: string | null;
  nacionalidad: string | null;
  instagram: string | null;
  descripcion: string | null;
  categorias: { nombre: string } | null;
};

type Foto = {
  id: string;
  url: string;
};

export default function PlayerDetailScreen() {
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
    return <View style={styles.center}><ActivityIndicator size="large" color="#fff" /></View>;
  }

  if (!jugador) {
    return <View style={styles.center}><Text style={{color: '#fff'}}>No se encontró al jugador.</Text></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* HEADER CON FONDO OSCURO */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
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
            <View style={styles.dorsalBadge}>
              <Text style={styles.dorsalBadgeText}>{jugador.dorsal ?? '-'}</Text>
            </View>
          </View>
          
          <Text style={styles.playerName}>{jugador.nombre} {jugador.apellido || ''}</Text>
          <Text style={styles.playerPosition}>{jugador.posicion || 'Futsal'} • {jugador.categorias?.nombre}</Text>
          
          {jugador.instagram && (
            <Pressable style={styles.instagramBtn} onPress={() => openInstagram(jugador.instagram!)}>
              <Ionicons name="logo-instagram" size={16} color="#FFFFFF" />
              <Text style={styles.instagramText}>@{jugador.instagram}</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* STATS RÁPIDAS (Estilo Apple) */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{calcularEdad(jugador.fecha_nacimiento)}</Text>
          <Text style={styles.statLabel}>Edad</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{jugador.nacionalidad || 'N/A'}</Text>
          <Text style={styles.statLabel}>Nacionalidad</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{jugador.posicion || 'N/A'}</Text>
          <Text style={styles.statLabel}>Posición</Text>
        </View>
      </View>

      {/* BIO / DESCRIPCIÓN */}
      {jugador.descripcion && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre el jugador</Text>
          <Text style={styles.bioText}>{jugador.descripcion}</Text>
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
            contentContainerStyle={{ gap: 10, paddingHorizontal: 4 }}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1C1C1E' },
  
  // Header Oscuro
  header: {
    backgroundColor: '#1C1C1E',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  backButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 20 },
  backText: { fontSize: 17, color: '#FFFFFF', marginLeft: -4 },
  
  profileContainer: { alignItems: 'center' },
  photoWrapper: { position: 'relative', marginBottom: 15 },
  profilePhoto: { width: 130, height: 130, borderRadius: 65, borderWidth: 3, borderColor: '#3C3C43' },
  placeholderPhotoBg: { backgroundColor: '#3C3C43', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 50, fontWeight: 'bold', color: '#8E8E93' },
  dorsalBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#1C1C1E',
  },
  dorsalBadgeText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  playerName: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
  playerPosition: { fontSize: 15, color: '#8E8E93', marginTop: 4, textTransform: 'capitalize' },
  instagramBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3C3C43',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 15,
    gap: 6,
  },
  instagramText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 24,
    marginTop: -20, // Efecto superpuesto sobre el header oscuro
    marginBottom: 10,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E' },
  statLabel: { fontSize: 12, color: '#8E8E93', marginTop: 4, textTransform: 'uppercase' },

  // Sections
  section: { marginTop: 30, paddingHorizontal: 24 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 15 },
  bioText: { fontSize: 16, color: '#3C3C43', lineHeight: 24 },

  // Galería
  galleryPhoto: {
    width: width * 0.7,
    height: 250,
    borderRadius: 16,
  },
});
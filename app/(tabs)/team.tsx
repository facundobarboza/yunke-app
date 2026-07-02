import { FadeInUp } from '@/components/FadeInUp';
import { yunke } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../../src/supabase';

type Categoria = {
  id: number;
  nombre: string;
};

type Jugador = {
  id: string;
  nombre: string;
  apellido: string | null;
  dorsal: number | null;
  posicion: string | null;
  foto_url: string | null;
};

export default function TeamScreen() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<number | null>(null);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      cargarCategorias();
    }, [])
  );

  const cargarCategorias = async () => {
    const { data } = await supabase
      .from('categorias')
      .select('*')
      .order('orden', { ascending: true });

    if (data && data.length > 0) {
      setCategorias(data);
      setSelectedCategoria(data[0].id);
      cargarJugadores(data[0].id);
    } else {
      setLoading(false);
    }
  };

  const cargarJugadores = async (categoriaId: number) => {
    setLoading(true);
    const { data } = await supabase
      .from('jugadores')
      .select('*')
      .eq('categoria_id', categoriaId)
      .eq('is_active', true)
      .order('dorsal', { ascending: true });

    setJugadores(data || []);
    setLoading(false);
  };

  const handleCategoriaPress = (id: number) => {
    setSelectedCategoria(id);
    cargarJugadores(id);
  };

  const renderJugador = ({ item, index }: { item: Jugador; index: number }) => (
    <FadeInUp delay={index * 60}>
      <Pressable 
        style={styles.playerCard} 
        onPress={() => router.push(`/player/${item.id}`)}
      >
        <View style={styles.playerPhotoContainer}>
          {item.foto_url ? (
            <Image source={{ uri: item.foto_url }} style={styles.playerPhoto} />
          ) : (
            <View style={[styles.playerPhoto, styles.placeholderPhoto]}>
              <Text style={styles.placeholderText}>{item.nombre.charAt(0)}</Text>
            </View>
          )}
          <View style={styles.dorsalBadge}>
            <Text style={styles.dorsalBadgeText}>{item.dorsal ?? '-'}</Text>
          </View>
        </View>
        
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{item.nombre} {item.apellido || ''}</Text>
          {item.posicion && (
            <View style={styles.positionContainer}>
              <Ionicons name="football-outline" size={12} color={yunke.textSecondary} />
              <Text style={styles.playerPosition}>{item.posicion}</Text>
            </View>
          )}
        </View>
        
        <Ionicons name="chevron-forward" size={20} color={yunke.textTertiary} />
      </Pressable>
    </FadeInUp>
  );

  if (loading && categorias.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={yunke.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER CON GRADIENTE */}
      <LinearGradient
        colors={yunke.gradientHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.screenTitle}>Plantel</Text>
        <Text style={styles.headerSubtitle}>Conocé a nuestros jugadores</Text>
      </LinearGradient>

      {/* Selector de Categorías */}
      <View>
        <FlatList
          data={categorias}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.categoriesList}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleCategoriaPress(item.id)}
              style={[
                styles.categoryPill,
                selectedCategoria === item.id ? styles.categoryPillActive : null,
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategoria === item.id ? styles.categoryTextActive : null,
                ]}
              >
                {item.nombre}
              </Text>
            </Pressable>
          )}
        />
      </View>

      <FlatList
        data={jugadores}
        keyExtractor={(item) => item.id}
        renderItem={renderJugador}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>No hay jugadores en esta categoría</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: yunke.surface,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: yunke.surface,
  },
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
  categoriesList: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  categoryPill: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: yunke.card,
    marginRight: 10,
    borderWidth: 1,
    borderColor: yunke.border,
    shadowColor: yunke.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryPillActive: {
    backgroundColor: yunke.primary,
    borderColor: yunke.primary,
    shadowColor: yunke.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryText: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: yunke.textSecondary,
  },
  categoryTextActive: {
    color: yunke.white,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: yunke.card,
    marginHorizontal: 24,
    marginBottom: 12,
    borderRadius: 16,
    padding: 14,
    shadowColor: yunke.dark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  playerPhotoContainer: {
    marginRight: 14,
    position: 'relative',
  },
  playerPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  placeholderPhoto: {
    backgroundColor: yunke.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 22,
    fontFamily: 'Montserrat_700Bold',
    color: yunke.textSecondary,
  },
  dorsalBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: yunke.red,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: yunke.card,
  },
  dorsalBadgeText: {
    fontSize: 10,
    fontFamily: 'Montserrat_700Bold',
    color: yunke.white,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 17,
    fontFamily: 'Montserrat_700Bold',
    color: yunke.text,
  },
  positionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  playerPosition: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: yunke.textSecondary,
    textTransform: 'capitalize',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    fontFamily: 'Montserrat_400Regular',
    color: yunke.textSecondary,
  },
});

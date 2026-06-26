import { yunke } from '@/constants/Colors';
import { FadeInUp } from '@/components/FadeInUp';
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
      </View>
      
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{item.nombre} {item.apellido || ''}</Text>
        {item.posicion && <Text style={styles.playerPosition}>{item.posicion}</Text>}
      </View>
      
      <View style={styles.dorsalContainer}>
        <Text style={styles.dorsalText}>{item.dorsal ?? '-'}</Text>
      </View>
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
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Equipo</Text>
      </View>

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
        contentContainerStyle={{ paddingBottom: 30 }}
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
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 10,
  },
  screenTitle: {
    fontSize: 34,
    fontFamily: 'Montserrat_900Black',
    color: yunke.text,
    letterSpacing: -1,
  },
  categoriesList: {
    paddingHorizontal: 24,
    paddingVertical: 15,
  },
  categoryPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: yunke.card,
    marginRight: 10,
    borderWidth: 1,
    borderColor: yunke.border,
  },
  categoryPillActive: {
    backgroundColor: yunke.primary,
    borderColor: yunke.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
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
    padding: 12,
    shadowColor: yunke.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  playerPhotoContainer: {
    marginRight: 15,
  },
  playerPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  placeholderPhoto: {
    backgroundColor: yunke.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: yunke.textSecondary,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 17,
    fontFamily: 'Montserrat_700Bold',
    color: yunke.text,
  },
  playerPosition: {
    fontSize: 14,
    color: yunke.textSecondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  dorsalContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: yunke.red,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dorsalText: {
    fontSize: 18,
    fontFamily: 'SpaceMono',
    color: yunke.white,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: yunke.textSecondary,
  },
});

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

  // Cargar categorías al entrar a la pantalla
  useFocusEffect(
    useCallback(() => {
      cargarCategorias();
    }, [])
  );

  const cargarCategorias = async () => {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .order('orden', { ascending: true });

    if (data && data.length > 0) {
      setCategorias(data);
      setSelectedCategoria(data[0].id); // Seleccionamos la primera por defecto
      cargarJugadores(data[0].id);
    } else {
      setLoading(false);
    }
  };

  // Cargar jugadores cuando cambiamos de categoría
  const cargarJugadores = async (categoriaId: number) => {
    setLoading(true);
    const { data, error } = await supabase
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

  // Renderizar cada jugador
  const renderJugador = ({ item }: { item: Jugador }) => (
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
  );

  if (loading && categorias.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Encabezado */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Equipo</Text>
      </View>

      {/* Selector de Categorías (Scroll Horizontal) */}
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

      {/* Lista de Jugadores */}
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

// ESTILOS (Estilo Apple: limpio, tarjetas blancas, tipografía clara)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
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
    fontWeight: 'bold',
    color: '#1C1C1E',
    letterSpacing: -1,
  },
  categoriesList: {
    paddingHorizontal: 24,
    paddingVertical: 15,
  },
  categoryPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  categoryPillActive: {
    backgroundColor: '#1C1C1E', // Negro Apple cuando está activo
    borderColor: '#1C1C1E',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 12,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
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
    borderRadius: 25, // Redonda
  },
  placeholderPhoto: {
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8E8E93',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  playerPosition: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  dorsalContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dorsalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#8E8E93',
  },
});
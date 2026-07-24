import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { yunke } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../src/supabase';
import { AdminGuard } from '../../src/components/AdminGuard';

type Jugador = {
  id: string;
  nombre: string;
  apellido: string | null;
  is_capitan: boolean | null;
  is_active: boolean;
  categoria_id: number | null;
  categoria_nombre: string | null;
};

export default function AdminPlayersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [categorias, setCategorias] = useState<{ id: number; nombre: string }[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const cargarJugadores = async () => {
    setLoading(true);

    // Cargar categorías por separado
    const { data: categoriasData } = await supabase
      .from('categorias')
      .select('id, nombre')
      .order('orden', { ascending: true });

    if (categoriasData) setCategorias(categoriasData);

    const categoriasMap = new Map<number, string>();
    if (categoriasData) {
      categoriasData.forEach((cat) => categoriasMap.set(cat.id, cat.nombre));
    }

    const { data, error } = await supabase
      .from('jugadores')
      .select('id, nombre, apellido, is_capitan, is_active, categoria_id')
      .order('nombre', { ascending: true });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      const jugadoresConCategoria = (data || []).map((j) => ({
        ...j,
        categoria_nombre: j.categoria_id ? categoriasMap.get(j.categoria_id) || null : null,
      }));
      setJugadores(jugadoresConCategoria);
    }
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { cargarJugadores(); }, []));

  const toggleVisibilidad = async (jugador: Jugador) => {
    setJugadores(prev => prev.map(j => j.id === jugador.id ? { ...j, is_active: !j.is_active } : j));
    const { error } = await supabase.from('jugadores').update({ is_active: !jugador.is_active }).eq('id', jugador.id);
    if (error) { Alert.alert('Error', 'No se pudo actualizar.'); cargarJugadores(); }
  };

  const eliminarJugador = async (jugador: Jugador) => {
    Alert.alert('Desactivar', `¿Desactivar a "${jugador.nombre} ${jugador.apellido || ''}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Desactivar', style: 'destructive', onPress: async () => {
        const { error } = await supabase.from('jugadores').update({ is_active: false }).eq('id', jugador.id);
        if (error) Alert.alert('Error', error.message);
        else cargarJugadores();
      }}
    ]);
  };

  const renderJugador = ({ item }: { item: Jugador }) => (
    <Card style={[styles.card, !item.is_active && styles.cardInactive]}>
      <Pressable style={styles.playerInfo} onPress={() => router.push(`/admin/create-player?id=${item.id}`)}>
        <View style={[styles.playerIcon, !item.is_active && styles.playerIconInactive]}>
          <Ionicons name="person-outline" size={18} color={item.is_active ? yunke.primary : yunke.textTertiary} />
        </View>
        <View style={styles.playerText}>
          <Text style={[styles.playerName, !item.is_active && styles.inactive]}>{item.nombre} {item.apellido || ''}</Text>
          <Text style={styles.playerCategory}>
            {item.categoria_nombre || 'Sin categoría'}
          </Text>
        </View>
      </Pressable>

      <View style={styles.actions}>
        <Pressable style={[styles.toggleBtn, item.is_active ? styles.btnActive : styles.btnInactive]} onPress={() => toggleVisibilidad(item)}>
          <Ionicons name={item.is_active ? "eye-outline" : "eye-off-outline"} size={16} color={item.is_active ? yunke.success : yunke.textSecondary} />
        </Pressable>
        <Pressable style={styles.deleteBtn} onPress={() => eliminarJugador(item)}>
          <Ionicons name="trash-outline" size={16} color={yunke.red} />
        </Pressable>
      </View>
    </Card>
  );

  const jugadoresFiltrados = selectedCategoria
    ? jugadores.filter((j) => j.categoria_id === selectedCategoria)
    : jugadores;

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={yunke.primary} /></View>;

  return (
    <AdminGuard permission="gestionar_jugadores">
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <ScreenHeader
          title="Gestionar Plantilla"
          subtitle={`${jugadoresFiltrados.length} jugadores`}
          showBack
          onBack={() => router.back()}
        />

        {/* Selector de categorías */}
        <View>
          <FlatList
            data={[{ id: 0, nombre: 'Todos' }, ...categorias]}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.categoriesList}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.categoryPill, (item.id === 0 ? selectedCategoria === null : selectedCategoria === item.id) && styles.categoryPillActive]}
                onPress={() => setSelectedCategoria(item.id === 0 ? null : item.id)}
              >
                <Text style={[styles.categoryText, (item.id === 0 ? selectedCategoria === null : selectedCategoria === item.id) && styles.categoryTextActive]}>
                  {item.nombre}
                </Text>
              </Pressable>
            )}
          />
        </View>

        <FlatList
          data={jugadoresFiltrados}
          keyExtractor={(item) => item.id}
          renderItem={renderJugador}
          contentContainerStyle={{ paddingBottom: 100 + insets.bottom, paddingHorizontal: 24, paddingTop: 10 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState title="No hay jugadores registrados" />}
        />

        <Pressable style={[styles.fab, { bottom: 30 + insets.bottom }]} onPress={() => router.push('/admin/create-player')}>
          <Ionicons name="add" size={28} color={yunke.white} />
        </Pressable>
      </View>
    </AdminGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: yunke.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: yunke.surface },
  categoriesList: { paddingHorizontal: 24, paddingVertical: 16, gap: 10 },
  categoryPill: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, backgroundColor: yunke.card, borderWidth: 1, borderColor: yunke.border, shadowColor: yunke.dark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  categoryPillActive: { backgroundColor: yunke.primary, borderColor: yunke.primary },
  categoryText: { fontSize: 13, fontFamily: 'Montserrat_600SemiBold', color: yunke.textSecondary },
  categoryTextActive: { color: yunke.white },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 16, marginBottom: 12 },
  cardInactive: { opacity: 0.6 },
  playerInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  playerIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: yunke.primary + '12', justifyContent: 'center', alignItems: 'center' },
  playerIconInactive: { backgroundColor: yunke.textTertiary + '12' },
  playerText: { flex: 1 },
  playerName: { fontSize: 15, fontFamily: 'Montserrat_600SemiBold', color: yunke.text },
  inactive: { opacity: 0.4 },
  playerCategory: { fontSize: 13, fontFamily: 'Montserrat_400Regular', color: yunke.textSecondary, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  toggleBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  btnActive: { backgroundColor: yunke.success + '15' },
  btnInactive: { backgroundColor: yunke.surface },
  deleteBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: yunke.red + '12' },
  fab: { position: 'absolute', bottom: 30, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: yunke.primary, justifyContent: 'center', alignItems: 'center', shadowColor: yunke.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
});

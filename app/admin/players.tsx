import { yunke } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../src/supabase';

type Jugador = {
  id: string;
  nombre: string;
  apellido: string | null;
  dorsal: number | null;
  is_active: boolean;
  categorias: { nombre: string }[] | null;
};

export default function AdminPlayersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarJugadores = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('jugadores')
      .select('id, nombre, apellido, dorsal, is_active, categorias(nombre)')
      .order('nombre', { ascending: true });

    if (error) Alert.alert('Error', error.message);
    else setJugadores(data || []);
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { cargarJugadores(); }, []));

  const toggleVisibilidad = async (jugador: Jugador) => {
    setJugadores(prev => prev.map(j => j.id === jugador.id ? { ...j, is_active: !j.is_active } : j));
    const { error } = await supabase.from('jugadores').update({ is_active: !jugador.is_active }).eq('id', jugador.id);
    if (error) { Alert.alert('Error', 'No se pudo actualizar.'); cargarJugadores(); }
  };

  const eliminarJugador = async (jugador: Jugador) => {
    Alert.alert('Eliminar', `¿Eliminar a "${jugador.nombre} ${jugador.apellido || ''}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        const { error } = await supabase.from('jugadores').delete().eq('id', jugador.id);
        if (error) Alert.alert('Error', error.message);
        else cargarJugadores();
      }}
    ]);
  };

  const renderJugador = ({ item }: { item: Jugador }) => (
    <View style={styles.card}>
      <Pressable style={styles.playerInfo} onPress={() => router.push(`/admin/create-player?id=${item.id}`)}>
        <View style={styles.playerIcon}>
          <Ionicons name="person-outline" size={18} color={yunke.primary} />
        </View>
        <View style={styles.playerText}>
          <Text style={[styles.playerName, !item.is_active && styles.inactive]}>{item.nombre} {item.apellido || ''}</Text>
          <Text style={[styles.playerCategory, !item.is_active && styles.inactive]}>
            {item.categorias?.[0]?.nombre || 'Sin categoría'} • Dorsal: {item.dorsal || '-'}
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
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={yunke.primary} /></View>;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <LinearGradient colors={yunke.gradientHeader} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={yunke.white} />
            <Text style={styles.backText}>Volver</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Gestionar Plantilla</Text>
          <Text style={styles.headerSubtitle}>{jugadores.length} jugadores</Text>
        </LinearGradient>

        <FlatList
          data={jugadores}
          keyExtractor={(item) => item.id}
          renderItem={renderJugador}
          contentContainerStyle={{ paddingBottom: 100 + insets.bottom, paddingHorizontal: 24, paddingTop: 16 }}
          showsVerticalScrollIndicator={false}
        />

        <Pressable style={[styles.fab, { bottom: 30 + insets.bottom }]} onPress={() => router.push('/admin/create-player')}>
          <Ionicons name="add" size={28} color={yunke.white} />
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: yunke.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: yunke.surface },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  backButton: { flexDirection: 'row', alignItems: 'center', paddingBottom: 16, gap: 4 },
  backText: { fontSize: 16, fontFamily: 'Montserrat_500Medium', color: yunke.white },
  headerTitle: { fontSize: 26, fontFamily: 'Montserrat_900Black', color: yunke.white, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, fontFamily: 'Montserrat_400Regular', color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: yunke.card, padding: 14, borderRadius: 16, marginBottom: 12, shadowColor: yunke.dark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  playerInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  playerIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: yunke.primary + '12', justifyContent: 'center', alignItems: 'center' },
  playerText: { flex: 1 },
  playerName: { fontSize: 15, fontFamily: 'Montserrat_600SemiBold', color: yunke.text },
  playerCategory: { fontSize: 13, fontFamily: 'Montserrat_400Regular', color: yunke.textSecondary, marginTop: 2 },
  inactive: { opacity: 0.4 },
  actions: { flexDirection: 'row', gap: 8 },
  toggleBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  btnActive: { backgroundColor: yunke.success + '15' },
  btnInactive: { backgroundColor: yunke.surface },
  deleteBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: yunke.red + '12' },
  fab: { position: 'absolute', bottom: 30, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: yunke.primary, justifyContent: 'center', alignItems: 'center', shadowColor: yunke.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
});

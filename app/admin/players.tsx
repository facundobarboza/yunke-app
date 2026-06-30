import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
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
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarJugadores = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('jugadores')
      .select('id, nombre, apellido, dorsal, is_active, categorias(nombre)')
      .order('nombre', { ascending: true });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setJugadores(data || []);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      cargarJugadores();
    }, [])
  );

  // Función para ocultar/mostrar (Soft Delete)
  const toggleVisibilidad = async (jugador: Jugador) => {
    // Actualizamos optimistamente la UI
    setJugadores(prev => prev.map(j => j.id === jugador.id ? { ...j, is_active: !j.is_active } : j));
    
    const { error } = await supabase
      .from('jugadores')
      .update({ is_active: !jugador.is_active })
      .eq('id', jugador.id);

    if (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado.');
      cargarJugadores(); // Revertimos si hay error
    }
  };

  const renderJugador = ({ item }: { item: Jugador }) => (
    <View style={styles.card}>
      {/* Al tocar la info, lleva a la pantalla de edición pasando el ID */}
      <Pressable 
        style={styles.playerInfo} 
        onPress={() => router.push(`/admin/create-player?id=${item.id}`)}
      >
        <Text style={[styles.playerName, !item.is_active && styles.inactiveOpacity]}>
          {item.nombre} {item.apellido || ''}
        </Text>
        <Text style={[styles.playerCategory, !item.is_active && styles.inactiveOpacity]}>
          {item.categorias?.[0]?.nombre || 'Sin categoría'} • Dorsal: {item.dorsal || '-'}
        </Text>
      </Pressable>
      
      <Pressable 
        style={[styles.toggleBtn, item.is_active ? styles.btnActive : styles.btnInactive]} 
        onPress={() => toggleVisibilidad(item)}
      >
        <Ionicons name={item.is_active ? "eye-outline" : "eye-off-outline"} size={18} color={item.is_active ? "#34C759" : "#8E8E93"} />
        <Text style={[styles.toggleText, { color: item.is_active ? "#34C759" : "#8E8E93" }]}>
          {item.is_active ? 'Visible' : 'Oculto'}
        </Text>
      </Pressable>
    </View>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#FF3B30" /></View>;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#007AFF" />
          <Text style={styles.backText}>Volver</Text>
        </Pressable>

        <Text style={styles.headerTitle}>Gestionar Plantilla</Text>
        <Text style={styles.headerSubtitle}>Toca para ocultar o mostrar jugadores.</Text>

        <FlatList
          data={jugadores}
          keyExtractor={(item) => item.id}
          renderItem={renderJugador}
          contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 24 }}
          showsVerticalScrollIndicator={false}
        />

        {/* Botón Flotante para Añadir */}
        <Pressable 
          style={styles.fab} 
          onPress={() => router.push('/admin/create-player')}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7' },
  backButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 10 },
  backText: { fontSize: 17, color: '#007AFF', marginLeft: -4 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1C1C1E', paddingHorizontal: 24, letterSpacing: -1 },
  headerSubtitle: { fontSize: 15, color: '#8E8E93', paddingHorizontal: 24, marginBottom: 20, marginTop: 4 },
  
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  playerInfo: { flex: 1 },
  inactiveOpacity: { opacity: 0.4 },
  playerName: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  playerCategory: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 4,
  },
  btnActive: { backgroundColor: '#E8F8EE' },
  btnInactive: { backgroundColor: '#F2F2F7' },
  toggleText: { fontSize: 13, fontWeight: '600' },
  
  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  }
});
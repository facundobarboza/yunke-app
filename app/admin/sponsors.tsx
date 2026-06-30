import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../../src/supabase';

type Sponsor = {
  id: string;
  nombre: string;
  logo_url: string | null;
  is_active: boolean;
};

export default function AdminSponsorsScreen() {
  const router = useRouter();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarSponsors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sponsors')
      .select('id, nombre, logo_url, is_active')
      .order('orden', { ascending: true });

    if (error) Alert.alert('Error', error.message);
    else setSponsors(data || []);
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { cargarSponsors(); }, []));

  const toggleVisibilidad = async (sponsor: Sponsor) => {
    setSponsors(prev => prev.map(s => s.id === sponsor.id ? { ...s, is_active: !s.is_active } : s));
    const { error } = await supabase.from('sponsors').update({ is_active: !sponsor.is_active }).eq('id', sponsor.id);
    if (error) { Alert.alert('Error', 'No se pudo actualizar.'); cargarSponsors(); }
  };

  const renderSponsor = ({ item }: { item: Sponsor }) => (
    <View style={styles.card}>
      <Pressable style={styles.sponsorInfo} onPress={() => router.push(`/admin/create-sponsor?id=${item.id}`)}>
        {item.logo_url ? (
          <Image source={{ uri: item.logo_url }} style={styles.logo} resizeMode="contain" />
        ) : (
          <View style={[styles.logo, styles.placeholder]}><Ionicons name="business-outline" size={24} color="#C7C7CC" /></View>
        )}
        <Text style={[styles.name, !item.is_active && styles.inactive]}>{item.nombre}</Text>
      </Pressable>
      
      <Pressable style={[styles.toggleBtn, item.is_active ? styles.btnActive : styles.btnInactive]} onPress={() => toggleVisibilidad(item)}>
        <Ionicons name={item.is_active ? "eye-outline" : "eye-off-outline"} size={18} color={item.is_active ? "#34C759" : "#8E8E93"} />
        <Text style={[styles.toggleText, { color: item.is_active ? "#34C759" : "#8E8E93" }]}>{item.is_active ? 'Visible' : 'Oculto'}</Text>
      </Pressable>
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#FF3B30" /></View>;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#007AFF" />
          <Text style={styles.backText}>Volver</Text>
        </Pressable>

        <Text style={styles.headerTitle}>Gestionar Sponsors</Text>

        <FlatList
          data={sponsors}
          keyExtractor={(item) => item.id}
          renderItem={renderSponsor}
          contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 24 }}
        />

        <Pressable style={styles.fab} onPress={() => router.push('/admin/create-sponsor')}>
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
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1C1C1E', paddingHorizontal: 24, letterSpacing: -1, marginBottom: 20 },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: 12, borderRadius: 14, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  sponsorInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  logo: { width: 50, height: 50, borderRadius: 10, backgroundColor: '#F2F2F7', marginRight: 15 },
  placeholder: { justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '600', color: '#1C1C1E', flexShrink: 1 },
  inactive: { opacity: 0.4 },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, gap: 4 },
  btnActive: { backgroundColor: '#E8F8EE' },
  btnInactive: { backgroundColor: '#F2F2F7' },
  toggleText: { fontSize: 13, fontWeight: '600' },
  fab: { position: 'absolute', bottom: 30, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: '#FF3B30', justifyContent: 'center', alignItems: 'center', shadowColor: '#FF3B30', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }
});
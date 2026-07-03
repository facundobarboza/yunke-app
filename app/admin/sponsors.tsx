import { yunke } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../src/supabase';

type Sponsor = {
  id: string;
  nombre: string;
  logo_url: string | null;
  is_active: boolean;
};

export default function AdminSponsorsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarSponsors = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('sponsors').select('id, nombre, logo_url, is_active').order('orden', { ascending: true });
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
          <View style={[styles.logo, styles.placeholder]}><Ionicons name="business-outline" size={20} color={yunke.textTertiary} /></View>
        )}
        <Text style={[styles.name, !item.is_active && styles.inactive]}>{item.nombre}</Text>
      </Pressable>
      
      <View style={styles.actions}>
        <Pressable style={[styles.toggleBtn, item.is_active ? styles.btnActive : styles.btnInactive]} onPress={() => toggleVisibilidad(item)}>
          <Ionicons name={item.is_active ? "eye-outline" : "eye-off-outline"} size={16} color={item.is_active ? yunke.success : yunke.textSecondary} />
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
          <Text style={styles.headerTitle}>Gestionar Sponsors</Text>
          <Text style={styles.headerSubtitle}>{sponsors.length} sponsors</Text>
        </LinearGradient>

        <FlatList data={sponsors} keyExtractor={(item) => item.id} renderItem={renderSponsor}
          contentContainerStyle={{ paddingBottom: 100 + insets.bottom, paddingHorizontal: 24, paddingTop: 16 }} showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.emptyText}>No hay sponsors registrados.</Text>} />

        <Pressable style={[styles.fab, { bottom: 30 + insets.bottom }]} onPress={() => router.push('/admin/create-sponsor')}>
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
  sponsorInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  logo: { width: 48, height: 48, borderRadius: 12, backgroundColor: yunke.surface },
  placeholder: { justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 15, fontFamily: 'Montserrat_600SemiBold', color: yunke.text, flexShrink: 1 },
  inactive: { opacity: 0.4 },
  actions: { flexDirection: 'row', gap: 8 },
  toggleBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  btnActive: { backgroundColor: yunke.success + '15' },
  btnInactive: { backgroundColor: yunke.surface },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 16, fontFamily: 'Montserrat_400Regular', color: yunke.textSecondary },
  fab: { position: 'absolute', bottom: 30, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: yunke.primary, justifyContent: 'center', alignItems: 'center', shadowColor: yunke.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
});

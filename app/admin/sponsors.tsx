import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { yunke } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../src/supabase';
import { AdminGuard } from '../../src/components/AdminGuard';

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
    <Card style={styles.card}>
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
    </Card>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={yunke.primary} /></View>;

  return (
    <AdminGuard permission="gestionar_sponsors">
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <ScreenHeader
          title="Gestionar Sponsors"
          subtitle={`${sponsors.length} sponsors`}
          showBack
          onBack={() => router.back()}
        />

        <FlatList data={sponsors} keyExtractor={(item) => item.id} renderItem={renderSponsor}
          contentContainerStyle={{ paddingBottom: 100 + insets.bottom, paddingHorizontal: 24, paddingTop: 16 }} showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState title="No hay sponsors registrados" />} />

        <Pressable style={[styles.fab, { bottom: 30 + insets.bottom }]} onPress={() => router.push('/admin/create-sponsor')}>
          <Ionicons name="add" size={28} color={yunke.white} />
        </Pressable>
      </View>
    </AdminGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: yunke.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: yunke.surface },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, marginBottom: 12 },
  sponsorInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  logo: { width: 48, height: 48, borderRadius: 12, backgroundColor: yunke.surface },
  placeholder: { justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 15, fontFamily: 'Montserrat_600SemiBold', color: yunke.text, flexShrink: 1 },
  inactive: { opacity: 0.4 },
  actions: { flexDirection: 'row', gap: 8 },
  toggleBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  btnActive: { backgroundColor: yunke.success + '15' },
  btnInactive: { backgroundColor: yunke.surface },
  fab: { position: 'absolute', bottom: 30, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: yunke.primary, justifyContent: 'center', alignItems: 'center', shadowColor: yunke.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
});

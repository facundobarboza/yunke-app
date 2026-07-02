import { yunke } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../src/supabase';

type Beneficio = {
  id: string;
  tienda: string;
  descuento: string;
  detalle: string;
  icono: string;
  is_active: boolean;
  orden: number;
};

export default function AdminBenefitsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [beneficios, setBeneficios] = useState<Beneficio[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarBeneficios = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('beneficios')
      .select('*')
      .order('orden', { ascending: true });

    if (error) Alert.alert('Error', error.message);
    else setBeneficios(data || []);
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { cargarBeneficios(); }, []));

  const toggleVisibilidad = async (beneficio: Beneficio) => {
    setBeneficios(prev => prev.map(b => b.id === beneficio.id ? { ...b, is_active: !b.is_active } : b));
    const { error } = await supabase.from('beneficios').update({ is_active: !beneficio.is_active }).eq('id', beneficio.id);
    if (error) { Alert.alert('Error', 'No se pudo actualizar.'); cargarBeneficios(); }
  };

  const eliminarBeneficio = async (beneficio: Beneficio) => {
    Alert.alert('Eliminar', `¿Eliminar "${beneficio.tienda}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        const { error } = await supabase.from('beneficios').delete().eq('id', beneficio.id);
        if (error) Alert.alert('Error', error.message);
        else cargarBeneficios();
      }}
    ]);
  };

  const renderBeneficio = ({ item }: { item: Beneficio }) => (
    <View style={styles.card}>
      <Pressable style={styles.benefitInfo} onPress={() => router.push(`/admin/create-benefit?id=${item.id}`)}>
        <View style={styles.iconContainer}>
          <Ionicons name={item.icono as any} size={22} color={yunke.red} />
        </View>
        <View style={styles.benefitText}>
          <Text style={[styles.name, !item.is_active && styles.inactive]}>{item.tienda}</Text>
          <Text style={styles.discount}>{item.descuento}</Text>
        </View>
      </Pressable>
      
      <View style={styles.actions}>
        <Pressable style={[styles.toggleBtn, item.is_active ? styles.btnActive : styles.btnInactive]} onPress={() => toggleVisibilidad(item)}>
          <Ionicons name={item.is_active ? "eye-outline" : "eye-off-outline"} size={16} color={item.is_active ? yunke.success : yunke.textSecondary} />
        </Pressable>
        <Pressable style={styles.deleteBtn} onPress={() => eliminarBeneficio(item)}>
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
        {/* Header */}
        <LinearGradient
          colors={yunke.gradientHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={yunke.white} />
            <Text style={styles.backText}>Volver</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Gestionar Beneficios</Text>
          <Text style={styles.headerSubtitle}>{beneficios.length} beneficios</Text>
        </LinearGradient>

        <FlatList
          data={beneficios}
          keyExtractor={(item) => item.id}
          renderItem={renderBeneficio}
          contentContainerStyle={{ paddingBottom: 100 + insets.bottom, paddingHorizontal: 24, paddingTop: 16 }}
        />

        <Pressable style={[styles.fab, { bottom: 30 + insets.bottom }]} onPress={() => router.push('/admin/create-benefit')}>
          <Ionicons name="add" size={28} color={yunke.white} />
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: yunke.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: yunke.surface },
  
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingBottom: 16,
    gap: 4,
  },
  backText: { 
    fontSize: 16, 
    fontFamily: 'Montserrat_500Medium',
    color: yunke.white 
  },
  headerTitle: { 
    fontSize: 26, 
    fontFamily: 'Montserrat_900Black', 
    color: yunke.white,
    letterSpacing: -0.5,
  },
  headerSubtitle: { 
    fontSize: 14, 
    fontFamily: 'Montserrat_400Regular',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },

  card: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: yunke.card, 
    padding: 14, 
    borderRadius: 16, 
    marginBottom: 12,
    shadowColor: yunke.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  benefitInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: yunke.red + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitText: {
    flex: 1,
  },
  name: { 
    fontSize: 15, 
    fontFamily: 'Montserrat_600SemiBold', 
    color: yunke.text 
  },
  discount: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: yunke.red,
    marginTop: 2,
  },
  inactive: { opacity: 0.4 },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleBtn: { 
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnActive: { backgroundColor: yunke.success + '15' },
  btnInactive: { backgroundColor: yunke.surface },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: yunke.red + '12',
  },
  fab: { 
    position: 'absolute', 
    bottom: 30, 
    right: 24, 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    backgroundColor: yunke.primary, 
    justifyContent: 'center', 
    alignItems: 'center', 
    shadowColor: yunke.primary, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 8, 
    elevation: 6 
  },
});

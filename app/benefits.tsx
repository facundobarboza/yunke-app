import { yunke } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../src/supabase';

type Beneficio = {
  id: string;
  tienda: string;
  descuento: string;
  detalle: string;
  icono: string;
};

export default function BenefitsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [beneficios, setBeneficios] = useState<Beneficio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarBeneficios();
  }, []);

  const cargarBeneficios = async () => {
    const { data, error } = await supabase
      .from('beneficios')
      .select('id, tienda, descuento, detalle, icono')
      .eq('is_active', true)
      .order('orden', { ascending: true });

    if (!error && data) {
      setBeneficios(data);
    }
    setLoading(false);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* HEADER CON GRADIENTE */}
        <LinearGradient
          colors={yunke.gradientRed}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top }]}
        >
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={yunke.white} />
            <Text style={styles.backText}>Volver</Text>
          </Pressable>

          <View style={styles.headerContent}>
            <View style={styles.headerIconContainer}>
              <Ionicons name="star" size={32} color={yunke.white} />
            </View>
            <Text style={styles.title}>Beneficios del Socio</Text>
            <Text style={styles.subtitle}>Descuentos exclusivos en comercios adheridos para los socios del club.</Text>
          </View>
        </LinearGradient>

        {/* LISTA DE BENEFICIOS */}
        <View style={styles.benefitsList}>
          {loading ? (
            <ActivityIndicator size="large" color={yunke.primary} style={{ marginTop: 40 }} />
          ) : beneficios.length === 0 ? (
            <Text style={styles.emptyText}>No hay beneficios disponibles.</Text>
          ) : (
            beneficios.map((ben) => (
              <Pressable key={ben.id} style={styles.benefitCard} onPress={() => router.push(`/benefit/${ben.id}`)}>
                <View style={styles.iconContainer}>
                  <Ionicons name={ben.icono as any} size={24} color={yunke.red} />
                </View>

                <View style={styles.benefitInfo}>
                  <Text style={styles.tienda}>{ben.tienda}</Text>
                  <Text style={styles.detalle}>{ben.detalle}</Text>
                </View>

                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{ben.descuento}</Text>
                </View>
              </Pressable>
            ))
          )}
        </View>

      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: yunke.surface },
  
  // Header premium
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: yunke.gold,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  backButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingBottom: 20,
    gap: 4,
  },
  backText: { 
    fontSize: 16, 
    fontFamily: 'Montserrat_500Medium',
    color: yunke.white 
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  title: { 
    fontSize: 26, 
    fontFamily: 'Montserrat_900Black', 
    color: yunke.white, 
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: { 
    fontSize: 14, 
    fontFamily: 'Montserrat_400Regular',
    color: 'rgba(255,255,255,0.9)', 
    marginTop: 8, 
    lineHeight: 20,
    textAlign: 'center',
  },

  // Lista de beneficios
  benefitsList: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Montserrat_400Regular',
    color: yunke.textSecondary,
    marginTop: 40,
  },

  // Cards premium
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: yunke.card,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: yunke.dark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: yunke.red + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  benefitInfo: {
    flex: 1,
  },
  tienda: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    color: yunke.text,
    marginBottom: 4,
  },
  detalle: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: yunke.textSecondary,
    lineHeight: 18,
  },
  discountBadge: {
    backgroundColor: yunke.red,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 12,
    shadowColor: yunke.red,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  discountText: {
    color: yunke.white,
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
    textAlign: 'center',
  },
});

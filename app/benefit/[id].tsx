import { yunke } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../../src/supabase';

const { width } = Dimensions.get('window');

type Beneficio = {
  id: string;
  tienda: string;
  descuento: string;
  detalle: string;
  icono: string;
};

export default function BenefitDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [beneficio, setBeneficio] = useState<Beneficio | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBeneficio();
  }, [id]);

  const fetchBeneficio = async () => {
    const { data } = await supabase
      .from('beneficios')
      .select('id, tienda, descuento, detalle, icono')
      .eq('id', id)
      .single();

    if (data) setBeneficio(data);
    setLoading(false);
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={yunke.primary} /></View>;
  }

  if (!beneficio) {
    return <View style={styles.center}><Text style={{ color: yunke.textSecondary }}>No se encontró el beneficio.</Text></View>;
  }

  return (
    <>
      <Stack.Screen />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* HERO CON GRADIENTE DORADO */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={yunke.gradientGold}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <View style={styles.backButtonBg}>
                <Ionicons name="chevron-back" size={24} color={yunke.white} />
              </View>
            </Pressable>

            <View style={styles.heroContent}>
              <View style={styles.iconContainer}>
                <Ionicons name={beneficio.icono as any} size={40} color={yunke.white} />
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* DESCUENTO BADGE */}
        <View style={styles.discountSection}>
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{beneficio.descuento}</Text>
          </View>
        </View>

        {/* NOMBRE */}
        <View style={styles.nameSection}>
          <Text style={styles.name}>{beneficio.tienda}</Text>
        </View>

        {/* DETALLE */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Beneficio</Text>
          <Text style={styles.descriptionText}>{beneficio.detalle}</Text>
        </View>

        {/* NOTA */}
        <View style={styles.noteCard}>
          <Ionicons name="information-circle-outline" size={20} color={yunke.primary} />
          <Text style={styles.noteText}>Presentá tu carnet digital de socio en el comercio para acceder al beneficio.</Text>
        </View>

      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: yunke.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: yunke.surface },

  // Hero
  heroSection: {
    height: 220,
    position: 'relative',
  },
  heroGradient: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    position: 'absolute',
    top: 56,
    left: 16,
    zIndex: 10,
  },
  backButtonBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },

  // Descuento
  discountSection: {
    alignItems: 'center',
    marginTop: -24,
    marginBottom: 8,
  },
  discountBadge: {
    backgroundColor: yunke.red,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: yunke.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  discountText: {
    color: yunke.white,
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
  },

  // Nombre
  nameSection: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  name: {
    fontSize: 26,
    fontFamily: 'Montserrat_900Black',
    color: yunke.text,
    textAlign: 'center',
    letterSpacing: -0.5,
  },

  // Card
  card: {
    backgroundColor: yunke.card,
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: yunke.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    color: yunke.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 16,
    fontFamily: 'Montserrat_400Regular',
    color: yunke.text,
    lineHeight: 24,
  },

  // Nota
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: yunke.primary + '10',
    marginHorizontal: 24,
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
    color: yunke.primary,
    lineHeight: 20,
  },
});

import { yunke } from '@/constants/Colors';
import { useTheme } from '@/src/hooks/useTheme';
import type { ThemePalette } from '@/constants/Colors';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../../src/supabase';

const { width } = Dimensions.get('window');

type Beneficio = {
  id: string;
  tienda: string;
  descuento: string;
  detalle: string;
  icono: string;
  terminos: string | null;
  portada: string | null;
};

export default function BenefitDetailScreen() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
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
      .select('id, tienda, descuento, detalle, icono, terminos, portada')
      .eq('id', id)
      .single();

    if (data) setBeneficio(data);
    setLoading(false);
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primaryLight} /></View>;
  }

  if (!beneficio) {
    return <View style={styles.center}><Text style={{ color: colors.textSecondary }}>No se encontró el beneficio.</Text></View>;
  }

  const renderHeroContent = () => (
    <>
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
    </>
  );

  return (
    <>
      <Stack.Screen />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* HERO CON PORTADA O GRADIENTE DORADO */}
        <View style={styles.heroSection}>
          {beneficio.portada ? (
            <ImageBackground
              source={{ uri: beneficio.portada }}
              style={styles.heroGradient}
              imageStyle={styles.heroImage}
            >
              <View style={styles.heroOverlay}>
                {renderHeroContent()}
              </View>
            </ImageBackground>
          ) : (
            <LinearGradient
              colors={yunke.gradientGold}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              {renderHeroContent()}
            </LinearGradient>
          )}
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

        {/* TÉRMINOS Y CONDICIONES (letra chica) */}
        {!!beneficio.terminos && (
          <View style={styles.terminosCard}>
            <View style={styles.terminosHeader}>
              <Ionicons name="reader-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Términos y condiciones</Text>
            </View>
            <Text style={styles.terminosText}>{beneficio.terminos}</Text>
          </View>
        )}

        {/* NOTA */}
        <View style={styles.noteCard}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primaryLight} />
          <Text style={styles.noteText}>Presentá tu carnet digital de socio en el comercio para acceder al beneficio.</Text>
        </View>

      </ScrollView>
    </>
  );
}

const createStyles = (theme: ThemePalette) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.surface },

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
    overflow: 'hidden',
  },
  heroImage: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26,40,88,0.55)',
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
    color: theme.text,
    textAlign: 'center',
    letterSpacing: -0.5,
  },

  // Card
  card: {
    backgroundColor: theme.card,
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: theme.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 16,
    fontFamily: 'Montserrat_400Regular',
    color: theme.text,
    lineHeight: 24,
  },

  // Términos y condiciones (letra chica)
  terminosCard: {
    backgroundColor: theme.card,
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    opacity: 0.85,
  },
  terminosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  terminosText: {
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
    color: theme.textSecondary,
    lineHeight: 18,
  },

  // Nota
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.isDark ? theme.card : yunke.primary + '10',
    marginHorizontal: 24,
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
    color: theme.primaryLight,
    lineHeight: 20,
  },
});

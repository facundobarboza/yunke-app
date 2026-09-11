import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { yunke } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../src/supabase';

type Beneficio = {
  id: string;
  tienda: string;
  descuento: string;
  detalle: string;
  icono: string;
  terminos: string | null;
};

export default function BenefitsScreen() {
  const router = useRouter();
  const [beneficios, setBeneficios] = useState<Beneficio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarBeneficios();
  }, []);

  const cargarBeneficios = async () => {
    const { data, error } = await supabase
      .from('beneficios')
      .select('id, tienda, descuento, detalle, icono, terminos')
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

        <ScreenHeader
          title="Beneficios del Socio"
          subtitle="Descuentos exclusivos en comercios adheridos para los socios del club."
          gradient={yunke.gradientRed}
          showBack
          onBack={() => router.back()}
        />

        {/* LISTA DE BENEFICIOS */}
        <View style={styles.benefitsList}>
          {loading ? (
            <ActivityIndicator size="large" color={yunke.primary} style={{ marginTop: 40 }} />
          ) : beneficios.length === 0 ? (
            <EmptyState title="No hay beneficios disponibles" />
          ) : (
            beneficios.map((ben) => (
              <Pressable key={ben.id} onPress={() => router.push(`/benefit/${ben.id}`)}>
                <Card style={styles.benefitCard}>
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
                </Card>
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

  benefitsList: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
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

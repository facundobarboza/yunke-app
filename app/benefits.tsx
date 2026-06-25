import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

// Datos de ejemplo de beneficios (en el futuro podrían venir de Supabase)
const beneficios = [
  { id: 1, tienda: 'Amor FARRR', descuento: '20% OFF', detalle: 'En todas las hamburguesas y pizzas los días de partido.', icon: 'fast-food-outline' },
  { id: 2, tienda: 'Sport Center', descuento: '15% OFF', detalle: 'En compra de indumentaria deportiva y calzado.', icon: 'shirt-outline' },
  { id: 3, tienda: 'Bar El Club', descuento: '2x1 en Cervezas', detalle: 'Presentando tu carnet digital de socio.', icon: 'beer-outline' },
  { id: 4, tienda: 'Ferretería Don Tornillo', descuento: '10% OFF', detalle: 'En todos los artículos de ferretería y pinturería.', icon: 'build-outline' },
  { id: 5, tienda: 'Clinica Dental Yunke', descuento: 'Limpieza Gratis', detalle: 'Una limpieza dental anual sin cargo para socios.', icon: 'medkit-outline' },
];

export default function BenefitsScreen() {
  const router = useRouter();

  return (
    <>
      {/* Configuramos el header de esta pantalla específica */}
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#007AFF" />
          <Text style={styles.backText}>Volver</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>Beneficios del Socio</Text>
          <Text style={styles.subtitle}>Descuentos exclusivos en comercios adheridos para los socios del club.</Text>
        </View>

        {/* Lista de Tarjetas de Beneficios */}
        {beneficios.map((ben) => (
          <View key={ben.id} style={styles.benefitCard}>
            <View style={styles.iconContainer}>
              <Ionicons name={ben.icon as any} size={28} color="#FF3B30" />
            </View>
            
            <View style={styles.benefitInfo}>
              <Text style={styles.tienda}>{ben.tienda}</Text>
              <Text style={styles.detalle}>{ben.detalle}</Text>
            </View>
            
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{ben.descuento}</Text>
            </View>
          </View>
        ))}

      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  backButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 10 },
  backText: { fontSize: 17, color: '#007AFF', marginLeft: -4 },
  
  header: { paddingHorizontal: 24, marginBottom: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1C1C1E', letterSpacing: -1 },
  subtitle: { fontSize: 15, color: '#8E8E93', marginTop: 8, lineHeight: 22 },

  // Tarjetas estilo Apple
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  benefitInfo: {
    flex: 1,
  },
  tienda: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  detalle: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 19,
  },
  discountBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 10,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
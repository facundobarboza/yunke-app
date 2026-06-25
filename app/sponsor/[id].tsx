import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../../src/supabase';

type Sponsor = {
  id: string;
  nombre: string;
  logo_url: string | null;
  descripcion: string | null;
  horarios: string | null;
  direccion: string | null;
  telefono: string | null;
  web_url: string | null;
  instagram: string | null;
  facebook: string | null;
};

export default function SponsorDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [sponsor, setSponsor] = useState<Sponsor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSponsor();
  }, [id]);

  const fetchSponsor = async () => {
    const { data, error } = await supabase
      .from('sponsors')
      .select('*')
      .eq('id', id)
      .single();
    
    if (data) setSponsor(data);
    setLoading(false);
  };

  const openLink = (url: string) => {
    if (url) Linking.openURL(url);
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#000" /></View>;
  }

  if (!sponsor) {
    return <View style={styles.center}><Text>No se encontró el sponsor.</Text></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Botón Volver */}
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={28} color="#007AFF" />
        <Text style={styles.backText}>Volver</Text>
      </Pressable>

      {/* Cabecera del Sponsor */}
      <View style={styles.header}>
        {sponsor.logo_url ? (
          <Image source={{ uri: sponsor.logo_url }} style={styles.logo} resizeMode="contain" />
        ) : (
          <View style={[styles.logo, styles.placeholderLogo]}>
            <Text style={styles.placeholderText}>{sponsor.nombre.charAt(0)}</Text>
          </View>
        )}
        <Text style={styles.name}>{sponsor.nombre}</Text>
      </View>

      {/* Descripción */}
      {sponsor.descripcion && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Sobre nosotros</Text>
          <Text style={styles.descriptionText}>{sponsor.descripcion}</Text>
        </View>
      )}

      {/* Información de Contacto (Estilo Ajustes iOS) */}
      <View style={styles.infoGroup}>
        {sponsor.direccion && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color="#8E8E93" />
            <Text style={styles.infoText}>{sponsor.direccion}</Text>
          </View>
        )}
        {sponsor.horarios && (
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color="#8E8E93" />
            <Text style={styles.infoText}>{sponsor.horarios}</Text>
          </View>
        )}
        {sponsor.telefono && (
          <Pressable style={styles.infoRow} onPress={() => openLink(`tel:${sponsor.telefono}`)}>
            <Ionicons name="call-outline" size={20} color="#8E8E93" />
            <Text style={[styles.infoText, { color: '#007AFF' }]}>{sponsor.telefono}</Text>
          </Pressable>
        )}
      </View>

      {/* Redes y Web (Estilo Ajustes iOS) */}
      <View style={styles.infoGroup}>
        {sponsor.web_url && (
          <Pressable style={styles.infoRow} onPress={() => openLink(sponsor.web_url!)}>
            <Ionicons name="globe-outline" size={20} color="#8E8E93" />
            <Text style={[styles.infoText, { color: '#007AFF' }]}>Sitio Web Oficial</Text>
            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" style={{ marginLeft: 'auto' }} />
          </Pressable>
        )}
        {sponsor.instagram && (
          <Pressable style={styles.infoRow} onPress={() => openLink(sponsor.instagram!)}>
            <Ionicons name="logo-instagram" size={20} color="#8E8E93" />
            <Text style={[styles.infoText, { color: '#007AFF' }]}>Instagram</Text>
            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" style={{ marginLeft: 'auto' }} />
          </Pressable>
        )}
        {sponsor.facebook && (
          <Pressable style={styles.infoRow} onPress={() => openLink(sponsor.facebook!)}>
            <Ionicons name="logo-facebook" size={20} color="#8E8E93" />
            <Text style={[styles.infoText, { color: '#007AFF' }]}>Facebook</Text>
            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" style={{ marginLeft: 'auto' }} />
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7' },
  backButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 10 },
  backText: { fontSize: 17, color: '#007AFF', marginLeft: -4 },
  header: { alignItems: 'center', marginBottom: 30, paddingHorizontal: 24 },
  logo: { width: 120, height: 120, borderRadius: 24, backgroundColor: '#FFFFFF', marginBottom: 16 },
  placeholderLogo: { justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 40, fontWeight: 'bold', color: '#8E8E93' },
  name: { fontSize: 28, fontWeight: 'bold', color: '#1C1C1E', textAlign: 'center' },
  card: { backgroundColor: '#FFFFFF', marginHorizontal: 24, borderRadius: 16, padding: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#8E8E93', textTransform: 'uppercase', marginBottom: 8 },
  descriptionText: { fontSize: 16, color: '#1C1C1E', lineHeight: 24 },
  infoGroup: { backgroundColor: '#FFFFFF', marginHorizontal: 24, borderRadius: 12, marginBottom: 24, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  infoText: { fontSize: 16, color: '#1C1C1E', flexShrink: 1 },
});
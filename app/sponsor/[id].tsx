import { Ionicons } from '@expo/vector-icons';
import { yunke } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../../src/supabase';

const { width } = Dimensions.get('window');

type Sponsor = {
  id: string;
  nombre: string;
  logo_url: string | null;
  portada_url: string | null;
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
    const { data } = await supabase
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
    return <View style={styles.center}><ActivityIndicator size="large" color={yunke.primary} /></View>;
  }

  if (!sponsor) {
    return <View style={styles.center}><Text>No se encontró el sponsor.</Text></View>;
  }

  const hasCover = !!sponsor.portada_url;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* COVER + LOGO */}
        <View style={styles.heroSection}>
          {hasCover ? (
            <Image source={{ uri: sponsor.portada_url! }} style={styles.coverImage} resizeMode="cover" />
          ) : (
            <LinearGradient
              colors={[yunke.primary, yunke.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.coverGradient}
            />
          )}

          {/* Back button overlaid */}
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <View style={styles.backButtonBg}>
              <Ionicons name="chevron-back" size={24} color={yunke.white} />
            </View>
          </Pressable>

          {/* Logo overlapping */}
          <View style={styles.logoOuterContainer}>
            {sponsor.logo_url ? (
              <Image source={{ uri: sponsor.logo_url }} style={styles.logo} resizeMode="contain" />
            ) : (
              <View style={[styles.logo, styles.logoPlaceholder]}>
                <Text style={styles.logoPlaceholderText}>{sponsor.nombre.charAt(0)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* NOMBRE */}
        <View style={styles.nameSection}>
          <Text style={styles.name}>{sponsor.nombre}</Text>
        </View>

        {/* DESCRIPCIÓN */}
        {sponsor.descripcion && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Sobre nosotros</Text>
            <Text style={styles.descriptionText}>{sponsor.descripcion}</Text>
          </View>
        )}

        {/* INFORMACIÓN DE CONTACTO */}
        <View style={styles.infoGroup}>
          {sponsor.direccion && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color={yunke.red} />
              <Text style={styles.infoText}>{sponsor.direccion}</Text>
            </View>
          )}
          {sponsor.horarios && (
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color={yunke.red} />
              <Text style={styles.infoText}>{sponsor.horarios}</Text>
            </View>
          )}
          {sponsor.telefono && (
            <Pressable style={styles.infoRow} onPress={() => openLink(`tel:${sponsor.telefono}`)}>
              <Ionicons name="call-outline" size={20} color={yunke.red} />
              <Text style={[styles.infoText, styles.linkText]}>{sponsor.telefono}</Text>
            </Pressable>
          )}
        </View>

        {/* REDES Y WEB */}
        <View style={styles.infoGroup}>
          {sponsor.web_url && (
            <Pressable style={styles.infoRow} onPress={() => openLink(sponsor.web_url!)}>
              <Ionicons name="globe-outline" size={20} color={yunke.primary} />
              <Text style={[styles.infoText, styles.linkText]}>Sitio Web Oficial</Text>
              <Ionicons name="chevron-forward" size={18} color={yunke.textTertiary} style={{ marginLeft: 'auto' }} />
            </Pressable>
          )}
          {sponsor.instagram && (
            <Pressable style={styles.infoRow} onPress={() => openLink(sponsor.instagram!)}>
              <Ionicons name="logo-instagram" size={20} color={yunke.primary} />
              <Text style={[styles.infoText, styles.linkText]}>Instagram</Text>
              <Ionicons name="chevron-forward" size={18} color={yunke.textTertiary} style={{ marginLeft: 'auto' }} />
            </Pressable>
          )}
          {sponsor.facebook && (
            <Pressable style={styles.infoRow} onPress={() => openLink(sponsor.facebook!)}>
              <Ionicons name="logo-facebook" size={20} color={yunke.primary} />
              <Text style={[styles.infoText, styles.linkText]}>Facebook</Text>
              <Ionicons name="chevron-forward" size={18} color={yunke.textTertiary} style={{ marginLeft: 'auto' }} />
            </Pressable>
          )}
        </View>

      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: yunke.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: yunke.surface },

  // HERO: Cover + Logo
  heroSection: {
    height: 260,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverGradient: {
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
  logoOuterContainer: {
    position: 'absolute',
    bottom: -50,
    alignSelf: 'center',
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: yunke.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: yunke.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  logoPlaceholder: {
    backgroundColor: yunke.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholderText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: yunke.textSecondary,
  },

  // Name
  nameSection: {
    marginTop: 66,
    alignItems: 'center',
    marginBottom: 24,
  },
  name: {
    fontSize: 28,
    fontFamily: 'Montserrat_900Black',
    color: yunke.text,
    textAlign: 'center',
    paddingHorizontal: 24,
  },

  // Cards
  card: {
    backgroundColor: yunke.card,
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: yunke.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: yunke.text,
    lineHeight: 24,
  },

  // Info rows (iOS-style grouped)
  infoGroup: {
    backgroundColor: yunke.card,
    marginHorizontal: 24,
    borderRadius: 14,
    marginBottom: 20,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: yunke.border,
  },
  infoText: {
    fontSize: 16,
    color: yunke.text,
    flexShrink: 1,
  },
  linkText: {
    color: yunke.primary,
  },
});

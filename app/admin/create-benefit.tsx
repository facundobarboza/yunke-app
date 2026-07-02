import { yunke } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../../src/supabase';

const ICONOS = [
  'pricetag-outline',
  'fast-food-outline',
  'shirt-outline',
  'beer-outline',
  'build-outline',
  'medkit-outline',
  'cart-outline',
  'car-outline',
  'fitness-outline',
  'gift-outline',
  'heart-outline',
  'home-outline',
  'music-note-outline',
  'paw-outline',
  'restaurant-outline',
  'school-outline',
];

export default function CreateBenefitScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEditing = !!id;

  const [tienda, setTienda] = useState('');
  const [descuento, setDescuento] = useState('');
  const [detalle, setDetalle] = useState('');
  const [icono, setIcono] = useState('pricetag-outline');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) fetchBeneficio(id as string);
  }, [id]);

  const fetchBeneficio = async (beneficioId: string) => {
    const { data } = await supabase.from('beneficios').select('*').eq('id', beneficioId).single();
    if (data) {
      setTienda(data.tienda);
      setDescuento(data.descuento);
      setDetalle(data.detalle);
      setIcono(data.icono);
    }
  };

  const handleGuardar = async () => {
    if (!tienda || !descuento || !detalle) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }
    setSaving(true);

    try {
      const payload = { tienda, descuento, detalle, icono };

      if (isEditing) {
        const { error } = await supabase.from('beneficios').update(payload).eq('id', id);
        if (error) throw error;
        Alert.alert('Éxito', 'Beneficio actualizado.');
      } else {
        const { error } = await supabase.from('beneficios').insert({ ...payload, is_active: true });
        if (error) throw error;
        Alert.alert('Éxito', 'Beneficio creado.');
      }
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
          
          {/* Header */}
          <LinearGradient
            colors={yunke.gradientGold}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color={yunke.white} />
              <Text style={styles.backText}>Volver</Text>
            </Pressable>
            <Text style={styles.headerTitle}>{isEditing ? 'Editar Beneficio' : 'Nuevo Beneficio'}</Text>
          </LinearGradient>

          <View style={styles.form}>
            {/* Icono selector */}
            <Text style={styles.sectionTitle}>ICONO</Text>
            <View style={styles.iconGrid}>
              {ICONOS.map((icon) => (
                <Pressable
                  key={icon}
                  style={[styles.iconOption, icono === icon && styles.iconOptionActive]}
                  onPress={() => setIcono(icon)}
                >
                  <Ionicons name={icon as any} size={22} color={icono === icon ? yunke.white : yunke.textSecondary} />
                </Pressable>
              ))}
            </View>

            {/* Campos */}
            <Text style={styles.sectionTitle}>INFORMACIÓN</Text>
            <View style={styles.inputGroup}>
              <View style={styles.inputRow}>
                <Ionicons name="storefront-outline" size={18} color={yunke.textSecondary} />
                <TextInput style={styles.input} placeholder="Nombre del comercio" placeholderTextColor={yunke.textSecondary} value={tienda} onChangeText={setTienda} />
              </View>
              <View style={styles.inputDivider} />
              <View style={styles.inputRow}>
                <Ionicons name="pricetag-outline" size={18} color={yunke.textSecondary} />
                <TextInput style={styles.input} placeholder="Ej: 20% OFF, 2x1" placeholderTextColor={yunke.textSecondary} value={descuento} onChangeText={setDescuento} />
              </View>
              <View style={styles.inputDivider} />
              <View style={styles.inputRow}>
                <Ionicons name="document-text-outline" size={18} color={yunke.textSecondary} />
                <TextInput style={styles.input} placeholder="Detalle del beneficio" placeholderTextColor={yunke.textSecondary} value={detalle} onChangeText={setDetalle} multiline />
              </View>
            </View>

            {/* Preview */}
            <Text style={styles.sectionTitle}>VISTA PREVIA</Text>
            <View style={styles.previewCard}>
              <View style={styles.previewIcon}>
                <Ionicons name={icono as any} size={24} color={yunke.red} />
              </View>
              <View style={styles.previewInfo}>
                <Text style={styles.previewTienda}>{tienda || 'Nombre del comercio'}</Text>
                <Text style={styles.previewDetalle}>{detalle || 'Detalle del beneficio'}</Text>
              </View>
              <View style={styles.previewBadge}>
                <Text style={styles.previewDescuento}>{descuento || 'DESCUENTO'}</Text>
              </View>
            </View>

            <Pressable style={styles.saveButton} onPress={handleGuardar} disabled={saving}>
              {saving ? (
                <ActivityIndicator color={yunke.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color={yunke.white} />
                  <Text style={styles.saveButtonText}>{isEditing ? 'Guardar Cambios' : 'Crear Beneficio'}</Text>
                </>
              )}
            </Pressable>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: yunke.surface },
  
  header: {
    paddingTop: 60,
    paddingBottom: 24,
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

  form: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  sectionTitle: { 
    fontSize: 12, 
    fontFamily: 'Montserrat_600SemiBold', 
    color: yunke.textSecondary, 
    textTransform: 'uppercase', 
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
  },

  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: yunke.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: yunke.border,
  },
  iconOptionActive: {
    backgroundColor: yunke.primary,
    borderColor: yunke.primary,
  },

  inputGroup: { 
    backgroundColor: yunke.card, 
    borderRadius: 16, 
    paddingHorizontal: 16, 
    marginBottom: 24,
    shadowColor: yunke.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 50,
  },
  input: { 
    flex: 1,
    fontSize: 16, 
    fontFamily: 'Montserrat_400Regular',
    color: yunke.text,
    paddingVertical: 12,
  },
  inputDivider: { height: 1, backgroundColor: yunke.border },

  // Preview card
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: yunke.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: yunke.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  previewIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: yunke.red + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  previewInfo: {
    flex: 1,
  },
  previewTienda: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    color: yunke.text,
  },
  previewDetalle: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: yunke.textSecondary,
    marginTop: 2,
  },
  previewBadge: {
    backgroundColor: yunke.red,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 12,
  },
  previewDescuento: {
    color: yunke.white,
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
  },

  saveButton: { 
    backgroundColor: yunke.primary, 
    height: 52, 
    borderRadius: 14, 
    flexDirection: 'row',
    justifyContent: 'center', 
    alignItems: 'center',
    gap: 8,
    shadowColor: yunke.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: { 
    color: yunke.white, 
    fontSize: 16, 
    fontFamily: 'Montserrat_600SemiBold' 
  },
});

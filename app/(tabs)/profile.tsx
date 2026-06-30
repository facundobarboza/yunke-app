import { yunke } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../../src/supabase';

export default function ProfileScreen() {
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();

  // Estados para el formulario de auth
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');

  // Estados para editar perfil
  const [telefono, setTelefono] = useState('');
  const [dni, setDni] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [loadingPago, setLoadingPago] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) {
      setProfile(data);
      setTelefono(data.telefono || '');
      setDni(data.dni || '');
    }
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa email y contraseña');
      return;
    }
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        if (!nombre || !apellido) {
          Alert.alert('Error', 'Nombre y apellido son obligatorios');
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { nombre, apellido } }
        });
        if (error) throw error;
        Alert.alert('Éxito', 'Revisa tu email para confirmar tu cuenta si es necesario.');
      }
    } catch (error: any) {
      Alert.alert('Error de autenticación', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setEmail(''); setPassword(''); setNombre(''); setApellido('');
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .update({ telefono, dni })
      .eq('id', session.user.id);

    if (error) Alert.alert('Error', 'No se pudieron guardar los cambios.');
    else Alert.alert('Guardado', 'Tus datos se actualizaron correctamente.');
    
    setSavingProfile(false);
  };

  const handleResetPassword = async () => {
    if (!session?.user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(session.user.email);
    if (error) Alert.alert('Error', error.message);
    else Alert.alert('Email enviado', 'Revisa tu correo para restablecer la contraseña.');
  };

  const handlePagarCuota = async () => {
    if (!session?.user?.email) return;
    setLoadingPago(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { 
          email: session.user.email, 
          nombre: profile?.nombre || '', 
          apellido: profile?.apellido || '' 
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.init_point) await Linking.openURL(data.init_point);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoadingPago(false);
    }
  };

  // =================================================================
  // UI: LOGIN / REGISTRO
  // =================================================================
  if (!session) {
    return (
      <ScrollView style={styles.authContainer} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <Text style={styles.title}>{isLogin ? 'Acceso Socios' : 'Crear Cuenta'}</Text>
        <Text style={styles.subtitle}>Club Yunke</Text>

        <View style={styles.inputGroup}>
          {!isLogin && (
            <>
              <TextInput style={styles.input} placeholder="Nombre" placeholderTextColor={yunke.textSecondary} value={nombre} onChangeText={setNombre} />
              <View style={styles.inputDivider} />
              <TextInput style={styles.input} placeholder="Apellido" placeholderTextColor={yunke.textSecondary} value={apellido} onChangeText={setApellido} />
              <View style={styles.inputDivider} />
            </>
          )}
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor={yunke.textSecondary} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <View style={styles.inputDivider} />
          <TextInput style={styles.input} placeholder="Contraseña" placeholderTextColor={yunke.textSecondary} value={password} onChangeText={setPassword} secureTextEntry />
        </View>

        <Pressable style={styles.primaryButton} onPress={handleAuth} disabled={loading}>
          {loading ? <ActivityIndicator color={yunke.white} /> : <Text style={styles.primaryButtonText}>{isLogin ? 'Entrar' : 'Registrarme'}</Text>}
        </Pressable>

        <Pressable style={styles.switchButton} onPress={() => setIsLogin(!isLogin)}>
          <Text style={styles.switchText}>{isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // =================================================================
  // UI: PERFIL LOGUEADO
  // =================================================================
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
      <Text style={styles.headerTitle}>Mi Perfil</Text>
      
      {/* BANNER: SOCIO O NO SOCIO */}
      {profile?.is_socio ? (
        // CARNET DIGITAL (SI ES SOCIO)
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardClubName}>CLUB YUNKE</Text>
            <Text style={styles.cardMemberLabel}>SOCIO Nº</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardName}>{profile?.nombre} {profile?.apellido}</Text>
            <Text style={styles.cardDni}>DNI: {dni || 'No registrado'}</Text>
          </View>
          <View style={styles.cardFooter}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>SOCIO ACTIVO</Text>
            </View>
          </View>
        </View>
      ) : (
        // BANNER HACERSE SOCIO (SI NO ES SOCIO)
        <View style={styles.bannerCard}>
          <Ionicons name="star-outline" size={32} color={yunke.gold} style={{ marginBottom: 10 }} />
          <Text style={styles.bannerTitle}>¡Aún no eres socio!</Text>
          <Text style={styles.bannerText}>Hazte socio del Club Yunke para disfrutar de beneficios, apoyar al club y obtener tu carnet digital.</Text>
          <Pressable style={styles.payButton} onPress={handlePagarCuota} disabled={loadingPago}>
            {loadingPago ? <ActivityIndicator color={yunke.white} /> : <Text style={styles.payButtonText}>Pagar Cuota Anual</Text>}
          </Pressable>
        </View>
      )}

      {/* DATOS PERSONALES EDITABLES */}
      <Text style={styles.sectionTitle}>DATOS PERSONALES</Text>
      <View style={styles.inputGroup}>
        <View style={styles.disabledRow}>
          <Text style={styles.disabledLabel}>Nombre</Text>
          <Text style={styles.disabledValue}>{profile?.nombre} {profile?.apellido}</Text>
        </View>
        <View style={styles.inputDivider} />
        <View style={styles.disabledRow}>
          <Text style={styles.disabledLabel}>Email</Text>
          <Text style={styles.disabledValue}>{session?.user?.email}</Text>
        </View>
        <View style={styles.inputDivider} />
        <TextInput style={styles.input} placeholder="Teléfono" placeholderTextColor={yunke.textSecondary} value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
        <View style={styles.inputDivider} />
        <TextInput style={styles.input} placeholder="DNI" placeholderTextColor={yunke.textSecondary} value={dni} onChangeText={setDni} keyboardType="numeric" />
      </View>

      <Pressable style={styles.saveButton} onPress={handleSaveProfile} disabled={savingProfile}>
        {savingProfile ? <ActivityIndicator color={yunke.white} /> : <Text style={styles.saveButtonText}>Guardar Cambios</Text>}
      </Pressable>

      {/* SEGURIDAD */}
      <Text style={styles.sectionTitle}>SEGURIDAD</Text>
      <Pressable style={styles.menuRow} onPress={handleResetPassword}>
          <Ionicons name="lock-closed-outline" size={20} color={yunke.primary} />
        <Text style={styles.menuText}>Restablecer contraseña</Text>
        <Ionicons name="chevron-forward" size={18} color={yunke.textTertiary} />
      </Pressable>

      {/* MENÚ DE ADMINISTRACIÓN (Solo visible si is_admin es true) */}
      {profile?.is_admin && (
        <View>
          <Text style={styles.sectionTitle}>ADMINISTRACIÓN</Text>
          
          <Pressable style={styles.menuRow} onPress={() => router.push('/admin/players')}>
            <Ionicons name="people-outline" size={20} color="#FF3B30" />
            <Text style={styles.menuText}>Gestionar Plantilla</Text>
            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
          </Pressable>

          <Pressable style={styles.menuRow} onPress={() => router.push('/admin/matches')}>
            <Ionicons name="calendar-outline" size={20} color="#FF3B30" />
            <Text style={styles.menuText}>Gestionar Partidos</Text>
            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
          </Pressable>

          <Pressable style={styles.menuRow} onPress={() => router.push('/admin/sponsors')}>
            <Ionicons name="business-outline" size={20} color="#FF3B30" />
            <Text style={styles.menuText}>Gestionar Sponsors</Text>
            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
          </Pressable>
          
          <View style={{ height: 30 }} />
        </View>
      )}

      {/* CERRAR SESIÓN */}
      <Pressable style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Cerrar Sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // --- Login ---
  authContainer: { flex: 1, backgroundColor: yunke.surface, paddingHorizontal: 30 },
  title: { fontSize: 32, fontFamily: 'Montserrat_900Black', color: yunke.primary, textAlign: 'center', marginTop: 60 },
  subtitle: { fontSize: 16, color: yunke.textSecondary, textAlign: 'center', marginBottom: 40, marginTop: 4 },
  inputGroup: { backgroundColor: yunke.card, borderRadius: 12, paddingHorizontal: 15, marginBottom: 20 },
  input: { height: 50, fontSize: 16, color: yunke.text },
  inputDivider: { height: 1, backgroundColor: yunke.border },
  primaryButton: { backgroundColor: yunke.primary, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  primaryButtonText: { color: yunke.white, fontSize: 16, fontWeight: '600' },
  switchButton: { alignItems: 'center', marginTop: 10, marginBottom: 40 },
  switchText: { color: yunke.primary, fontSize: 15 },

  // --- Perfil ---
  container: { flex: 1, backgroundColor: yunke.surface, paddingHorizontal: 24, paddingTop: 60 },
  headerTitle: { fontSize: 34, fontFamily: 'Montserrat_900Black', color: yunke.text, marginBottom: 20, letterSpacing: -1 },
  
  // Carnet Socio
  card: { backgroundColor: yunke.dark, borderRadius: 20, padding: 24, shadowColor: yunke.dark, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10, aspectRatio: 1.6, justifyContent: 'space-between', marginBottom: 30 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardClubName: { color: yunke.gold, fontSize: 20, fontFamily: 'Montserrat_900Black', letterSpacing: 1 },
  cardMemberLabel: { color: yunke.textSecondary, fontSize: 12, fontWeight: '600' },
  cardBody: { borderBottomWidth: 1, borderBottomColor: yunke.darkSoft, paddingBottom: 15 },
  cardName: { color: yunke.white, fontSize: 24, fontFamily: 'Montserrat_700Bold', textTransform: 'uppercase' },
  cardDni: { color: yunke.textSecondary, fontSize: 14, marginTop: 5 },
  cardFooter: { flexDirection: 'row', justifyContent: 'flex-end' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: yunke.gold },
  statusText: { color: yunke.white, fontSize: 12, fontWeight: 'bold' },

  // Banner No Socio
  bannerCard: { backgroundColor: yunke.card, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: yunke.gold, shadowColor: yunke.dark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  bannerTitle: { fontSize: 20, fontFamily: 'Montserrat_700Bold', color: yunke.text, marginBottom: 8 },
  bannerText: { fontSize: 14, color: yunke.textSecondary, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  payButton: { backgroundColor: yunke.red, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', width: '100%' },
  payButtonText: { color: yunke.white, fontSize: 16, fontWeight: 'bold' },

  // Edición de datos
  sectionTitle: { fontSize: 13, fontWeight: '600', color: yunke.textSecondary, textTransform: 'uppercase', marginBottom: 10, marginLeft: 4 },
  disabledRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 50 },
  disabledLabel: { fontSize: 16, color: yunke.textSecondary },
  disabledValue: { fontSize: 16, color: yunke.text, fontWeight: '500' },
  saveButton: { backgroundColor: yunke.primary, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 15, marginBottom: 30 },
  saveButtonText: { color: yunke.white, fontSize: 16, fontWeight: '600' },

  // Menú
  menuRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: yunke.card, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, gap: 12, marginBottom: 30 },
  menuText: { fontSize: 16, color: yunke.text, flex: 1 },

  // Cerrar sesión
  signOutButton: { height: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: yunke.card, borderRadius: 12 },
  signOutText: { color: yunke.red, fontSize: 16, fontWeight: '600' },
});
import { yunke } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
      <ScrollView style={styles.authContainer} contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header con gradiente */}
        <LinearGradient
          colors={yunke.gradientHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.authHeader}
        >
          <Image 
            source={require('../../assets/images/yunke-logo.png')} 
            style={styles.authLogo} 
            resizeMode="contain" 
          />
        </LinearGradient>

        <View style={styles.authContent}>
          <Text style={styles.title}>{isLogin ? 'Bienvenido' : 'Crear Cuenta'}</Text>
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
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={18} color={yunke.textSecondary} />
              <TextInput style={styles.inputWithIcon} placeholder="Email" placeholderTextColor={yunke.textSecondary} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            </View>
            <View style={styles.inputDivider} />
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={yunke.textSecondary} />
              <TextInput style={styles.inputWithIcon} placeholder="Contraseña" placeholderTextColor={yunke.textSecondary} value={password} onChangeText={setPassword} secureTextEntry />
            </View>
          </View>

          <Pressable style={styles.primaryButton} onPress={handleAuth} disabled={loading}>
            {loading ? <ActivityIndicator color={yunke.white} /> : <Text style={styles.primaryButtonText}>{isLogin ? 'Entrar' : 'Registrarme'}</Text>}
          </Pressable>

          <Pressable style={styles.switchButton} onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.switchText}>{isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  // =================================================================
  // UI: PERFIL LOGUEADO
  // =================================================================
  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={{
        paddingBottom: Platform.OS === 'android' ? 200 : 120
      }}
    >
      {/* Header con gradiente */}
      <LinearGradient
        colors={yunke.gradientHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{profile?.nombre?.charAt(0) || 'U'}</Text>
            </View>
          </View>
          <Text style={styles.headerTitle}>{profile?.nombre} {profile?.apellido}</Text>
          <Text style={styles.headerSubtitle}>{session?.user?.email}</Text>
        </View>
      </LinearGradient>
      
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
              <Ionicons name="checkmark-circle" size={14} color={yunke.white} />
              <Text style={styles.statusText}>SOCIO ACTIVO</Text>
            </View>
          </View>
        </View>
      ) : (
        // BANNER HACERSE SOCIO (SI NO ES SOCIO)
        <View style={styles.bannerCard}>
          <LinearGradient
            colors={yunke.gradientGold}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bannerGradient}
          >
            <Ionicons name="star" size={36} color={yunke.white} style={{ marginBottom: 12 }} />
            <Text style={styles.bannerTitle}>¡Aún no eres socio!</Text>
            <Text style={styles.bannerText}>Hazte socio del Club Yunke para disfrutar de beneficios, apoyar al club y obtener tu carnet digital.</Text>
            <Pressable style={styles.payButton} onPress={handlePagarCuota} disabled={loadingPago}>
              {loadingPago ? <ActivityIndicator color={yunke.white} /> : <Text style={styles.payButtonText}>Pagar Cuota Anual</Text>}
            </Pressable>
          </LinearGradient>
        </View>
      )}

      {/* DATOS PERSONALES EDITABLES */}
      <Text style={styles.sectionTitle}>DATOS PERSONALES</Text>
      <View style={styles.inputGroup}>
        <View style={styles.disabledRow}>
          <View style={styles.disabledRowLeft}>
            <Ionicons name="person-outline" size={16} color={yunke.textSecondary} />
            <Text style={styles.disabledLabel}>Nombre</Text>
          </View>
          <Text style={styles.disabledValue}>{profile?.nombre} {profile?.apellido}</Text>
        </View>
        <View style={styles.inputDivider} />
        <View style={styles.disabledRow}>
          <View style={styles.disabledRowLeft}>
            <Ionicons name="mail-outline" size={16} color={yunke.textSecondary} />
            <Text style={styles.disabledLabel}>Email</Text>
          </View>
          <Text style={styles.disabledValue}>{session?.user?.email}</Text>
        </View>
        <View style={styles.inputDivider} />
        <View style={styles.inputRow}>
          <Ionicons name="call-outline" size={16} color={yunke.textSecondary} />
          <TextInput style={styles.inputWithIcon} placeholder="Teléfono" placeholderTextColor={yunke.textSecondary} value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
        </View>
        <View style={styles.inputDivider} />
        <View style={styles.inputRow}>
          <Ionicons name="card-outline" size={16} color={yunke.textSecondary} />
          <TextInput style={styles.inputWithIcon} placeholder="DNI" placeholderTextColor={yunke.textSecondary} value={dni} onChangeText={setDni} keyboardType="numeric" />
        </View>
      </View>

      <Pressable style={styles.saveButton} onPress={handleSaveProfile} disabled={savingProfile}>
        {savingProfile ? <ActivityIndicator color={yunke.white} /> : (
          <>
            <Ionicons name="checkmark-circle-outline" size={18} color={yunke.white} />
            <Text style={styles.saveButtonText}>Guardar Cambios</Text>
          </>
        )}
      </Pressable>

      {/* SEGURIDAD */}
      <Text style={styles.sectionTitle}>SEGURIDAD</Text>
      <Pressable style={styles.menuRow} onPress={handleResetPassword}>
        <View style={styles.menuIconContainer}>
          <Ionicons name="lock-closed-outline" size={18} color={yunke.primary} />
        </View>
        <Text style={styles.menuText}>Restablecer contraseña</Text>
        <Ionicons name="chevron-forward" size={18} color={yunke.textTertiary} />
      </Pressable>

      {/* MENÚ DE ADMINISTRACIÓN (Solo visible si is_admin es true) */}
      {profile?.is_admin && (
        <View>
          <Text style={styles.sectionTitle}>ADMINISTRACIÓN</Text>
          
          <Pressable style={styles.menuRow} onPress={() => router.push('/admin/players')}>
            <View style={[styles.menuIconContainer, styles.menuIconRed]}>
              <Ionicons name="people-outline" size={18} color={yunke.red} />
            </View>
            <Text style={styles.menuText}>Gestionar Plantilla</Text>
            <Ionicons name="chevron-forward" size={18} color={yunke.textTertiary} />
          </Pressable>

          <Pressable style={styles.menuRow} onPress={() => router.push('/admin/matches')}>
            <View style={[styles.menuIconContainer, styles.menuIconRed]}>
              <Ionicons name="calendar-outline" size={18} color={yunke.red} />
            </View>
            <Text style={styles.menuText}>Gestionar Partidos</Text>
            <Ionicons name="chevron-forward" size={18} color={yunke.textTertiary} />
          </Pressable>

          <Pressable style={styles.menuRow} onPress={() => router.push('/admin/sponsors')}>
            <View style={[styles.menuIconContainer, styles.menuIconRed]}>
              <Ionicons name="business-outline" size={18} color={yunke.red} />
            </View>
            <Text style={styles.menuText}>Gestionar Sponsors</Text>
            <Ionicons name="chevron-forward" size={18} color={yunke.textTertiary} />
          </Pressable>

          <Pressable style={styles.menuRow} onPress={() => router.push('/admin/benefits')}>
            <View style={[styles.menuIconContainer, styles.menuIconGold]}>
              <Ionicons name="gift-outline" size={18} color={yunke.gold} />
            </View>
            <Text style={styles.menuText}>Gestionar Beneficios</Text>
            <Ionicons name="chevron-forward" size={18} color={yunke.textTertiary} />
          </Pressable>
        </View>
      )}

      {/* CERRAR SESIÓN */}
      <Pressable style={styles.signOutButton} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={18} color={yunke.red} />
        <Text style={styles.signOutText}>Cerrar Sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // --- Login Premium ---
  authContainer: { flex: 1, backgroundColor: yunke.surface },
  authHeader: {
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  authLogo: {
    width: 100,
    height: 100,
  },
  authContent: {
    paddingHorizontal: 30,
    paddingTop: 30,
  },
  title: { 
    fontSize: 28, 
    fontFamily: 'Montserrat_900Black', 
    color: yunke.text, 
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: { 
    fontSize: 15, 
    fontFamily: 'Montserrat_400Regular',
    color: yunke.textSecondary, 
    textAlign: 'center', 
    marginBottom: 30, 
    marginTop: 4 
  },
  inputGroup: { 
    backgroundColor: yunke.card, 
    borderRadius: 16, 
    paddingHorizontal: 16, 
    marginBottom: 20,
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
    height: 50,
  },
  input: { 
    height: 50, 
    fontSize: 16, 
    fontFamily: 'Montserrat_400Regular',
    color: yunke.text 
  },
  inputWithIcon: {
    flex: 1,
    height: 50,
    fontSize: 16,
    fontFamily: 'Montserrat_400Regular',
    color: yunke.text,
  },
  inputDivider: { height: 1, backgroundColor: yunke.border },
  primaryButton: { 
    backgroundColor: yunke.primary, 
    height: 52, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 15,
    shadowColor: yunke.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: { 
    color: yunke.white, 
    fontSize: 16, 
    fontFamily: 'Montserrat_600SemiBold' 
  },
  switchButton: { alignItems: 'center', marginTop: 10, marginBottom: 40 },
  switchText: { color: yunke.primary, fontSize: 15, fontFamily: 'Montserrat_500Medium' },

  // --- Perfil Premium ---
  container: { flex: 1, backgroundColor: yunke.surface },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: yunke.dark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    fontSize: 32,
    fontFamily: 'Montserrat_700Bold',
    color: yunke.white,
  },
  headerTitle: { 
    fontSize: 24, 
    fontFamily: 'Montserrat_700Bold', 
    color: yunke.white,
    letterSpacing: -0.5,
  },
  headerSubtitle: { 
    fontSize: 14, 
    fontFamily: 'Montserrat_400Regular',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  
  // Carnet Socio Premium
  card: { 
    backgroundColor: yunke.dark, 
    borderRadius: 20, 
    padding: 24, 
    marginHorizontal: 24,
    marginTop: 20,
    shadowColor: yunke.dark, 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 20, 
    elevation: 10, 
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardClubName: { color: yunke.gold, fontSize: 18, fontFamily: 'Montserrat_900Black', letterSpacing: 1 },
  cardMemberLabel: { color: yunke.textSecondary, fontSize: 11, fontFamily: 'Montserrat_600SemiBold' },
  cardBody: { borderBottomWidth: 1, borderBottomColor: yunke.darkSoft, paddingBottom: 15, marginTop: 20 },
  cardName: { color: yunke.white, fontSize: 22, fontFamily: 'Montserrat_700Bold', textTransform: 'uppercase' },
  cardDni: { color: yunke.textSecondary, fontSize: 14, fontFamily: 'Montserrat_400Regular', marginTop: 5 },
  cardFooter: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15 },
  statusBadge: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 8, 
    backgroundColor: yunke.gold 
  },
  statusText: { color: yunke.white, fontSize: 11, fontFamily: 'Montserrat_700Bold' },

  // Banner No Socio Premium
  bannerCard: { 
    marginHorizontal: 24,
    marginTop: 20,
    borderRadius: 20, 
    overflow: 'hidden',
    shadowColor: yunke.gold, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 12, 
    elevation: 8,
  },
  bannerGradient: {
    padding: 24,
    alignItems: 'center',
  },
  bannerTitle: { 
    fontSize: 20, 
    fontFamily: 'Montserrat_700Bold', 
    color: yunke.white, 
    marginBottom: 8 
  },
  bannerText: { 
    fontSize: 14, 
    fontFamily: 'Montserrat_400Regular',
    color: 'rgba(255,255,255,0.9)', 
    textAlign: 'center', 
    marginBottom: 20, 
    lineHeight: 20 
  },
  payButton: { 
    backgroundColor: yunke.white, 
    height: 50, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center', 
    width: '100%' 
  },
  payButtonText: { 
    color: yunke.gold, 
    fontSize: 16, 
    fontFamily: 'Montserrat_700Bold' 
  },

  // Edición de datos Premium
  sectionTitle: { 
    fontSize: 12, 
    fontFamily: 'Montserrat_600SemiBold', 
    color: yunke.textSecondary, 
    textTransform: 'uppercase', 
    letterSpacing: 1,
    marginBottom: 12, 
    marginLeft: 28,
    marginTop: 24,
  },
  disabledRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    height: 50 
  },
  disabledRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  disabledLabel: { 
    fontSize: 15, 
    fontFamily: 'Montserrat_400Regular',
    color: yunke.textSecondary 
  },
  disabledValue: { 
    fontSize: 15, 
    fontFamily: 'Montserrat_500Medium',
    color: yunke.text 
  },
  saveButton: { 
    backgroundColor: yunke.primary, 
    height: 52, 
    borderRadius: 14, 
    flexDirection: 'row',
    justifyContent: 'center', 
    alignItems: 'center',
    gap: 8,
    marginTop: 15, 
    marginBottom: 10,
    marginHorizontal: 24,
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

  // Menú Premium
  menuRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: yunke.card, 
    borderRadius: 16, 
    paddingVertical: 16, 
    paddingHorizontal: 16, 
    gap: 12, 
    marginBottom: 12,
    marginHorizontal: 24,
    shadowColor: yunke.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: yunke.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIconRed: {
    backgroundColor: yunke.red + '12',
  },
  menuIconGold: {
    backgroundColor: yunke.gold + '20',
  },
  menuText: { 
    fontSize: 15, 
    fontFamily: 'Montserrat_500Medium',
    color: yunke.text, 
    flex: 1 
  },

  // Cerrar sesión Premium
  signOutButton: { 
    height: 52, 
    flexDirection: 'row',
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 8,
    backgroundColor: yunke.card, 
    borderRadius: 16,
    marginHorizontal: 24,
    marginTop: 24,
    shadowColor: yunke.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  signOutText: { 
    color: yunke.red, 
    fontSize: 15, 
    fontFamily: 'Montserrat_600SemiBold' 
  },
});

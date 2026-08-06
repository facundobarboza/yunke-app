import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { yunke } from '../constants/Colors';
import { supabase } from '../src/supabase';

/**
 * Parse query params and fragment from a deep link URL natively.
 * Handles both:
 *   - yunkeapp://reset-password?code=xxx  (PKCE)
 *   - yunkeapp://reset-password#access_token=xxx&refresh_token=xxx  (implicit)
 */
const parseUrlParams = (url: string): Record<string, string> => {
  const params: Record<string, string> = {};

  // Parse query params (?key=value&key2=value2)
  const queryIndex = url.indexOf('?');
  if (queryIndex !== -1) {
    const queryPart = url.substring(queryIndex + 1);
    // Stop at fragment if present
    const fragmentIndex = queryPart.indexOf('#');
    const queryString = fragmentIndex !== -1 ? queryPart.substring(0, fragmentIndex) : queryPart;
    queryString.split('&').forEach((pair) => {
      const [key, ...rest] = pair.split('=');
      const value = rest.join('=');
      if (key) params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    });
  }

  // Parse fragment (#key=value&key2=value2)
  const fragmentIndex = url.indexOf('#');
  if (fragmentIndex !== -1) {
    const fragmentString = url.substring(fragmentIndex + 1);
    fragmentString.split('&').forEach((pair) => {
      const [key, ...rest] = pair.split('=');
      const value = rest.join('=');
      if (key) params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    });
  }

  return params;
};

/**
 * Create a session from a deep link URL.
 * Handles both PKCE flow (code in query params) and implicit flow (tokens in fragment).
 */
const createSessionFromUrl = async (url: string) => {
  console.log('[ResetPassword] Parsing URL:', url);

  const params = parseUrlParams(url);
  console.log('[ResetPassword] Parsed params:', Object.keys(params).join(', '));

  // PKCE flow: exchange code for session
  const code = params['code'];
  if (code) {
    console.log('[ResetPassword] PKCE code found, exchanging...');
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.log('[ResetPassword] PKCE exchange error:', error.message);
      throw error;
    }
    console.log('[ResetPassword] PKCE exchange SUCCESS');
    return data.session;
  }

  // Implicit flow: use access_token from fragment
  const { access_token, refresh_token } = params;

  if (!access_token) {
    console.log('[ResetPassword] No code or access_token found in URL');
    throw new Error('No code or access_token found in URL');
  }

  console.log('[ResetPassword] Implicit flow tokens found');
  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (error) {
    console.log('[ResetPassword] Implicit flow error:', error.message);
    throw error;
  }

  console.log('[ResetPassword] Implicit flow SUCCESS');
  return data.session;
};

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const [checking, setChecking] = useState(true);
  const handledRef = useRef(false);

  const handleUrl = useCallback(async (url: string) => {
    if (handledRef.current) return;
    handledRef.current = true;

    console.log('[ResetPassword] Deep link received:', url);

    try {
      await createSessionFromUrl(url);
      setValidToken(true);
    } catch (error: any) {
      console.log('[ResetPassword] Error creating session:', error?.message);

      // Fallback: check for existing session (user might already be logged in)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('[ResetPassword] Existing session found as fallback');
        setValidToken(true);
      } else {
        Alert.alert(
          'Error',
          'El enlace de recuperación no es válido o ha expirado. Por favor solicitá uno nuevo.'
        );
      }
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    // 1. Check initial URL (deep link on cold start)
    console.log('[ResetPassword] Checking initial URL...');
    Linking.getInitialURL().then((url) => {
      console.log('[ResetPassword] Initial URL:', url || '(none)');
      if (url) {
        handleUrl(url);
      } else {
        // No initial URL — check for existing session.
        // Do not lock out later URL events by setting handledRef when no URL is present.
        console.log('[ResetPassword] No initial URL, checking session...');
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            console.log('[ResetPassword] Existing session found in useEffect');
            handledRef.current = true;
            setValidToken(true);
          } else {
            console.log('[ResetPassword] No session in useEffect');
            // Keep checking open for a later deep link event.
          }
          setChecking(false);
        });
      }
    });

    // 2. Listen for URL events (deep link on warm start / already running)
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('[ResetPassword] URL event received:', url);
      handleUrl(url);
    });

    // 3. Also listen for auth state changes (PASSWORD_RECOVERY event)
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[ResetPassword] Auth state changed:', event, session ? 'has session' : 'no session');
        if (!handledRef.current && event === 'PASSWORD_RECOVERY' && session) {
          console.log('[ResetPassword] PASSWORD_RECOVERY event with session');
          handledRef.current = true;
          setValidToken(true);
          setChecking(false);
        }
      }
    );

    return () => {
      subscription.remove();
      authSub.unsubscribe();
    };
  }, [handleUrl]);

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa ambos campos.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      Alert.alert(
        'Éxito',
        'Tu contraseña ha sido actualizada correctamente.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo actualizar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={yunke.primary} />
        <Text style={styles.loadingText}>Verificando enlace...</Text>
      </View>
    );
  }

  if (!validToken) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.errorText}>El enlace de recuperación no es válido o ha expirado.</Text>
          <View style={styles.button} onTouchEnd={() => router.replace('/(tabs)')}>
            <Text style={styles.buttonText}>Volver al inicio</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Restablecer Contraseña</Text>
        <Text style={styles.subtitle}>Ingresa tu nueva contraseña</Text>

        <TextInput
          style={styles.input}
          placeholder="Nueva contraseña"
          placeholderTextColor={yunke.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Confirmar contraseña"
          placeholderTextColor={yunke.textSecondary}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <View style={styles.button} onTouchEnd={handleResetPassword}>
          {loading ? (
            <ActivityIndicator color={yunke.white} />
          ) : (
            <Text style={styles.buttonText}>Actualizar Contraseña</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: yunke.surface,
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: yunke.card,
    borderRadius: 20,
    padding: 32,
    shadowColor: yunke.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Montserrat_700Bold',
    color: yunke.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: yunke.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    backgroundColor: yunke.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: yunke.text,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: yunke.border,
  },
  button: {
    backgroundColor: yunke.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: yunke.white,
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: yunke.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: yunke.error,
    textAlign: 'center',
  },
});

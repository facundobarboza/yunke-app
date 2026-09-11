import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { yunke } from '../constants/Colors';
import { useTheme } from '@/src/hooks/useTheme';
import type { ThemePalette } from '@/constants/Colors';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';
import { supabase } from '../src/supabase';
import * as QueryParams from 'expo-auth-session/build/QueryParams';

/**
 * Parse query params and fragment from a deep link URL natively.
 * Handles both:
 *   - yunkeapp://reset-password?code=xxx  (PKCE)
 *   - yunkeapp://reset-password#access_token=xxx&refresh_token=xxx  (implicit)
 *
 * Falls back to the official expo-auth-session QueryParams parser first,
 * then merges manual parsing as a safety net for URLs that QueryParams
 * does not normalize (e.g. custom schemes).
 */
const parseUrlParams = (url: string): Record<string, string> => {
  const params: Record<string, string> = {};

  // Official parser from expo-auth-session (handles query + fragment + errorCode).
  try {
    const { params: officialParams } = QueryParams.getQueryParams(url);
    if (officialParams) {
      Object.entries(officialParams).forEach(([key, value]) => {
        if (key) params[key] = value ?? '';
      });
    }
  } catch (e) {
    console.log('[ResetPassword] QueryParams official parser failed:', e);
  }

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
const unwrapExpoDevClientUrl = (url: string) => {
  let current = url;
  for (let i = 0; i < 5; i += 1) {
    try {
      const parsed = new URL(current);
      const nested = parsed.searchParams.get('url');
      if (!nested || nested === current) break;
      const decoded = decodeURIComponent(nested);
      console.log('[ResetPassword] Unwrapped Expo Dev Client URL:', decoded);
      current = decoded;
      continue;
    } catch {
      break;
    }
  }
  return current;
};

const isPasswordRecoveryDeepLink = (url: string) => {
  const effectiveUrl = unwrapExpoDevClientUrl(url);
  const params = parseUrlParams(effectiveUrl);
  return Boolean(params['code'] || params['token'] || params['access_token'] || params['error']);
};

const createSessionFromParams = async (params: Record<string, string>) => {
  console.log('[ResetPassword] Session params:', Object.keys(params).join(', '));

  // If Supabase returned an error (e.g. otp_expired), surface it to caller
  if (params['error']) {
    const errMsg = params['error_description'] || params['error'];
    console.log('[ResetPassword] Supabase returned error:', errMsg);
    throw new Error(errMsg || 'Recovery link invalid or expired');
  }

  // PKCE flow: exchange code or token for session
  // Supabase password recovery links may provide the PKCE token under the
  // `token` query param (e.g. token=pkce_...), so accept either `code` or
  // `token` here.
  const code = params['code'] || params['token'];
  if (code) {
    console.log('[ResetPassword] PKCE code/token found, exchanging...');
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

const createSessionFromUrl = async (url: string) => {
  const effectiveUrl = unwrapExpoDevClientUrl(url);
  console.log('[ResetPassword] Parsing URL:', effectiveUrl);
  const params = parseUrlParams(effectiveUrl);
  return createSessionFromParams(params);
};

/**
 * Normalize expo-router search params (string | string[]) into plain strings.
 */
const extractParamsFromSearchParams = (
  searchParams: Record<string, string | string[]>
): Record<string, string> => {
  const params: Record<string, string> = {};
  Object.entries(searchParams).forEach(([key, value]) => {
    if (key) params[key] = Array.isArray(value) ? String(value[0] ?? '') : String(value ?? '');
  });
  return params;
};

const isRecoveryParams = (params: Record<string, string>) =>
  Boolean(params['code'] || params['token'] || params['access_token'] || params['error']);

/**
 * Supabase devuelve los errores de updateUser en inglés; traducimos los
 * mensajes conocidos al español del resto de la app.
 */
const translateAuthError = (message: string): string => {
  const map: Record<string, string> = {
    'New password should be different from the old password.': 'La nueva contraseña debe ser diferente a la vieja.',
    'Password should be at least 6 characters.': 'La contraseña debe tener al menos 6 caracteres.',
    'Password should be at least 12 characters.': 'La contraseña debe tener al menos 12 caracteres.',
    'Password cannot be the same as the old password.': 'La nueva contraseña no puede ser igual a la vieja.',
  };
  return map[message] || message;
};

export default function ResetPasswordScreen() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const router = useRouter();
  // Params of the deep link that navigated to this screen (works on cold AND
  // warm start: expo-router already routed the URL here, so code/token/error
  // are available without depending on the timing of Linking events).
  const searchParams = useLocalSearchParams<Record<string, string | string[]>>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const [checking, setChecking] = useState(true);
  const [debugInfo, setDebugInfo] = useState('');
  const handledRef = useRef(false);
  const debugTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addDebug = useCallback((line: string) => {
    setDebugInfo((prev) => `${prev}${prev ? '\n' : ''}${line}`);
  }, []);

  const handleParams = useCallback(async (params: Record<string, string>, source: string) => {
    if (handledRef.current) return;
    handledRef.current = true;

    console.log(`[ResetPassword] Params vía ${source}:`, Object.keys(params).join(', '));
    addDebug(`[${new Date().toLocaleTimeString()}] Params vía ${source}: ${Object.keys(params).join(', ')}`);

    try {
      await createSessionFromParams(params);
      addDebug('[OK] Sesión creada con el enlace.');
      setValidToken(true);
    } catch (error: any) {
        console.log('[ResetPassword] Error creating session:', error?.message);
        addDebug(`[ERROR] ${error?.message || String(error)}`);

        // Fallback: check for existing session (user might already be logged in)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('[ResetPassword] Existing session found as fallback');
          addDebug('[OK] Sesión existente detectada (fallback).');
          setValidToken(true);
        } else {
          const message = error?.message || 'El enlace de recuperación no es válido o ha expirado. Por favor solicitá uno nuevo.';
          Alert.alert('Error', message);
        }
    } finally {
      setChecking(false);
    }
  }, [addDebug]);

  const handleUrl = useCallback(async (url: string) => {
    const effectiveUrl = unwrapExpoDevClientUrl(url);
    console.log('[ResetPassword] Deep link received:', url);
    addDebug(`[${new Date().toLocaleTimeString()}] URL procesada:\n${effectiveUrl || '(ninguna)'}`);
    const params = parseUrlParams(effectiveUrl);
    await handleParams(params, 'Linking');
  }, [addDebug, handleParams]);

  useEffect(() => {
    // PRIORITY 1: expo-router route params. The deep link navigated to this
    // screen, so its query params (code/token/error) are already here — both
    // on cold start and on warm start, where Linking.getInitialURL() returns
    // null and the url event can fire before this screen mounts.
    const routeParams = extractParamsFromSearchParams(searchParams);
    if (isRecoveryParams(routeParams)) {
      console.log('[ResetPassword] Recovery params via useLocalSearchParams:', Object.keys(routeParams).join(', '));
      handleParams(routeParams, 'expo-router');
    } else {
      // PRIORITY 2: check initial URL (deep link on cold start)
      console.log('[ResetPassword] Checking initial URL...');
      Linking.getInitialURL().then((url) => {
        console.log('[ResetPassword] Initial URL:', url || '(none)');
        addDebug(`[${new Date().toLocaleTimeString()}] getInitialURL: ${url || '(ninguna)'}`);
        if (url && isPasswordRecoveryDeepLink(url)) {
          handleUrl(url);
        } else {
          addDebug('URL inicial sin params de recovery (code/token/access_token/error).');
          // No initial recovery link — check for existing session.
          // Do not lock out later URL events by setting handledRef when no URL is present.
          console.log('[ResetPassword] No recovery link in initial URL, checking session...');
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
              console.log('[ResetPassword] Existing session found in useEffect');
              addDebug('[OK] Sesión existente detectada.');
              handledRef.current = true;
              setValidToken(true);
              setChecking(false);
            } else {
              console.log('[ResetPassword] No session in useEffect');
              // Keep checking open for a later deep link event.
              // On Android the deep link intent can arrive shortly after
              // getInitialURL resolves to null — give the URL event a window
              // before declaring the link invalid.
              const timeout = setTimeout(() => {
                if (!handledRef.current) {
                  console.log('[ResetPassword] No URL event within window, showing error');
                  addDebug(`[${new Date().toLocaleTimeString()}] Timeout: ningún evento de URL válido en 4s.`);
                  setChecking(false);
                }
              }, 4000);
              // @ts-ignore stored so the timeout can be cancelled on unmount
              debugTimeoutRef.current = timeout;
            }
          });
        }
      });
    }

    // PRIORITY 3: listen for URL events (deep link on warm start / already running)
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('[ResetPassword] URL event received:', url);
      addDebug(`[${new Date().toLocaleTimeString()}] url event: ${url}`);
      if (isPasswordRecoveryDeepLink(url)) {
        handleUrl(url);
      } else {
        addDebug('Evento ignorado: sin params de recovery (code/token/access_token/error).');
      }
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
      // @ts-ignore clear pending timeout
      if (debugTimeoutRef.current) clearTimeout(debugTimeoutRef.current);
    };
  }, [addDebug, handleParams, handleUrl, searchParams]);

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
      Alert.alert('Error', translateAuthError(error.message || 'No se pudo actualizar la contraseña.'));
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primaryLight} />
        <Text style={styles.loadingText}>Verificando enlace...</Text>
      </View>
    );
  }

  if (!validToken) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.errorText}>El enlace de recuperación no es válido o ha expirado.</Text>
          {debugInfo ? (
            <>
              <Text style={styles.debugTitle}>DIAGNÓSTICO</Text>
              <Text selectable style={styles.debugText}>{debugInfo}</Text>
            </>
          ) : (
            <Text style={styles.debugTitle}>
              (Sin diagnóstico: esta APK no incluye el build con el texto de depuración. Reinstalá la versión nueva.)
            </Text>
          )}
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
          placeholderTextColor={colors.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Confirmar contraseña"
          placeholderTextColor={colors.textSecondary}
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

const createStyles = (theme: ThemePalette) =>
  StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.surface,
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: theme.card,
    borderRadius: 20,
    padding: 32,
    shadowColor: theme.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Montserrat_700Bold',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.text,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
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
    color: theme.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: yunke.error,
    textAlign: 'center',
  },
  debugText: {
    marginTop: 8,
    fontSize: 11,
    color: theme.textSecondary,
    textAlign: 'left',
    backgroundColor: theme.surface,
    borderRadius: 8,
    padding: 8,
  },
  debugTitle: {
    marginTop: 12,
    fontSize: 10,
    fontFamily: 'Montserrat_600SemiBold',
    color: theme.textSecondary,
    textAlign: 'center',
  },
});

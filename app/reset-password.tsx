import { useEffect, useState } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '../src/supabase';
import { yunke } from '../constants/Colors';

// Función para parsear el fragmento del URL de Supabase
function parseSupabaseFragment(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  // Supabase envía: yunkeapp://reset-password#access_token=xxx&type=recovery&...
  const fragment = url.split('#')[1];
  if (fragment) {
    fragment.split('&').forEach((pair) => {
      const [key, value] = pair.split('=');
      if (key && value) {
        params[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    });
  }
  return params;
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const handleDeepLink = async () => {
      try {
        // 1. Intentar obtener el URL completo del deep link
        const initialUrl = await Linking.getInitialURL();
        
        if (initialUrl && initialUrl.includes('#')) {
          // Parsear el fragmento del URL de Supabase
          const fragmentParams = parseSupabaseFragment(initialUrl);
          const accessToken = fragmentParams['access_token'];
          const type = fragmentParams['type'];

          if (accessToken && type === 'recovery') {
            // Establecer la sesión con el access token
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: fragmentParams['refresh_token'] || '',
            });

            if (!error) {
              setValidToken(true);
            } else {
              Alert.alert('Error', 'No se pudo validar el token de recuperación.');
            }
            return;
          }
        }

        // 2. Intentar con los params de Expo Router (fallback)
        const token = params.token as string;
        const type = params.type as string;

        if (token && type === 'recovery') {
          setValidToken(true);
          return;
        }

        // 3. Verificar si ya hay una sesión activa
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setValidToken(true);
        } else {
          Alert.alert('Error', 'Token de recuperación inválido o expirado.');
        }
      } catch (error) {
        Alert.alert('Error', 'No se pudo validar el token de recuperación.');
      } finally {
        setChecking(false);
      }
    };

    handleDeepLink();
  }, [params]);

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

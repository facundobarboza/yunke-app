import {
  Montserrat_400Regular,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_900Black,
  useFonts as useMontserrat,
} from '@expo-google-fonts/montserrat';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { AuthProvider } from '@/src/contexts/AuthContext';
import { AppThemeProvider, useThemeContext } from '@/src/contexts/ThemeContext';

// Deep linking configuration
const linking = {
  prefixes: ['yunkeapp://', 'https://yunke.app'],
  config: {
    screens: {
      '(tabs)': {
        screens: {
          index: '',
          profile: 'profile',
          calendar: 'calendar',
          team: 'team',
        },
      },
      'reset-password': 'reset-password',
      modal: 'modal',
    },
  },
};

const queryClient = new QueryClient();

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [spaceMonoLoaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [montserratLoaded] = useMontserrat({
    Montserrat_400Regular,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_900Black,
  });

  const loaded = spaceMonoLoaded && montserratLoaded;

  return (
    <AuthProvider>
      <AppThemeProvider>
        <RootLayoutNav fontsLoaded={loaded} />
      </AppThemeProvider>
    </AuthProvider>
  );
}

function RootLayoutNav({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { scheme, themeResolved } = useThemeContext();

  // Hold the splash screen until fonts AND the persisted theme are resolved
  // to avoid a flash of the wrong color scheme.
  useEffect(() => {
    if (fontsLoaded && themeResolved) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, themeResolved]);

  if (!fontsLoaded || !themeResolved) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
        <View style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }} linking={linking}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="reset-password" />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          </Stack>
        </View>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

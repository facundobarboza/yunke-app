import { useTheme } from '@/src/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  // REQ-5/6: no hardcoded white; dark uses border instead of shadow
  const tabBarBackground = isDark
    ? colors.card
    : Platform.OS === 'ios'
      ? 'rgba(255,255,255,0.9)'
      : colors.card;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDark ? colors.tabIconSelected : colors.red,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: tabBarBackground,
          ...(isDark
            ? { borderTopWidth: 1, borderTopColor: colors.border }
            : {
                borderTopWidth: 0,
                shadowColor: colors.dark,
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.1,
                shadowRadius: 16,
              }),
          height: 65 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 10,
          position: 'absolute',
          elevation: isDark ? 8 : 20,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Montserrat_600SemiBold',
        },
        headerShown: false,
        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendario',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle" size={26} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { yunke } from '@/constants/Colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: yunke.red,
        tabBarInactiveTintColor: yunke.textSecondary,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'rgba(255,255,255,0.88)',
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === 'ios' ? 76 : 64,
          paddingBottom: Platform.OS === 'ios' ? 8 : 6,
          paddingTop: 8,
          // Efecto flotante
          marginHorizontal: 16,
          marginBottom: Platform.OS === 'ios' ? 24 : 12,
          borderRadius: 26,
          // Sombra suave para que flote
          shadowColor: yunke.dark,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 16,
          shadowOpacity: 0.1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          title: 'Equipo',
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Partidos',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
import { yunke } from '@/constants/Colors';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ENV = process.env.EXPO_PUBLIC_ENV || 'development';

export function DevBanner() {
  const insets = useSafeAreaInsets();

  if (ENV !== 'development') return null;

  return (
    <View style={[styles.banner, { paddingTop: insets.top + 4 }]}>
      <Text style={styles.text}>MODO DESARROLLO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FF6B35',
    paddingBottom: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    zIndex: 999,
  },
  text: {
    color: yunke.white,
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 1,
  },
});

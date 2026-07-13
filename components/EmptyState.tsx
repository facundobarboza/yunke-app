import { yunke } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

type EmptyStateProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
};

export function EmptyState({ icon = 'folder-open-outline', title, description }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={40} color={yunke.textTertiary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: yunke.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
    color: yunke.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
    color: yunke.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

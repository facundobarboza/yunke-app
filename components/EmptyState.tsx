import type { ThemePalette } from '@/constants/Colors';
import { useTheme } from '@/src/hooks/useTheme';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

type EmptyStateProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
};

export function EmptyState({ icon = 'folder-open-outline', title, description }: EmptyStateProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={40} color={colors.textTertiary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
    </View>
  );
}

const createStyles = (theme: ThemePalette) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingVertical: 40,
      paddingHorizontal: 24,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 16,
      fontFamily: 'Montserrat_600SemiBold',
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: 4,
    },
    description: {
      fontSize: 14,
      fontFamily: 'Montserrat_400Regular',
      color: theme.textTertiary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

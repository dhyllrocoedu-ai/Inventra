import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { BrandColors, NeutralColors, Fonts } from '@/constants/theme';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { PrimaryButton } from './PrimaryButton';

type Props = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  icon = 'cube-outline',
  title,
  subtitle,
  actionLabel,
  onAction,
}: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={64} color={NeutralColors.textDisabled} />
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <View style={styles.buttonWrapper}>
          <PrimaryButton title={actionLabel} onPress={onAction} color={BrandColors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.sansBold,
    fontWeight: '700',
    color: NeutralColors.textPrimary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: NeutralColors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  buttonWrapper: {
    marginTop: Spacing.lg,
    width: '60%',
    maxWidth: 400,
    borderRadius: BorderRadius.button,
    overflow: 'hidden',
  },
});

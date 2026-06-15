import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { NeutralColors, Fonts, StatusColors } from '@/constants/theme';
import { BorderRadius } from '@/constants/spacing';

export type Status = 'healthy' | 'warning' | 'critical';

const STATUS_CONFIG: Record<Status, { label: string; iconName: keyof typeof Ionicons.glyphMap; colors: { bg: string; text: string } }> = {
  healthy: { label: 'In Stock', iconName: 'checkmark-circle', colors: StatusColors.healthy },
  warning: { label: 'Low Stock', iconName: 'alert-circle', colors: StatusColors.warning },
  critical: { label: 'Out of Stock', iconName: 'close-circle', colors: StatusColors.critical },
};

type Props = {
  status: Status;
};

export function StatusBadge({ status }: Props) {
  const config = STATUS_CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: config.colors.bg }]}>
      <Ionicons name={config.iconName} size={14} color={config.colors.text} />
      <Text style={[styles.text, { color: config.colors.text }]}>
        {config.label}
      </Text>
    </View>
  );
}

export function getStatus(stock: number, minStock?: number | null): Status {
  const threshold = minStock && minStock > 0 ? minStock : 10;
  if (stock <= 0) return 'critical';
  if (stock <= threshold) return 'warning';
  return 'healthy';
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.badge,
  },
  text: {
    fontSize: 12,
    fontFamily: Fonts.sansBold,
    fontWeight: '700',
    color: NeutralColors.textPrimary,
  },
});

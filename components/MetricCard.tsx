import { StyleSheet, Text, View } from 'react-native';

import { BrandColors, NeutralColors, Fonts } from '@/constants/theme';
import { BorderRadius, CardHeight, Shadow } from '@/constants/spacing';

type Props = {
  label: string;
  value: string;
  bgColor?: string;
  accentColor?: string;
  style?: any;
  trend?: { direction: 'up' | 'down'; pct: number } | null;
};

export function MetricCard({ label, value, bgColor, accentColor, style, trend }: Props) {
  return (
    <View style={[styles.card, style, { backgroundColor: bgColor ?? NeutralColors.card }]}>
      <Text style={[styles.label, { color: accentColor ?? NeutralColors.textSecondary }]}>
        {label}
      </Text>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: accentColor ?? NeutralColors.textPrimary }]}>
          {value}
        </Text>
        {trend && (
          <Text style={[styles.trend, { color: trend.direction === 'up' ? BrandColors.success : BrandColors.danger }]}>
            {trend.direction === 'up' ? '↑' : '↓'} {trend.pct}%
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: CardHeight.kpi,
    borderRadius: BorderRadius.card,
    padding: 14,
    justifyContent: 'center',
    ...Shadow.card,
  },
  label: {
    fontSize: 13,
    fontFamily: Fonts.sansBold,
    fontWeight: '700',
    flexShrink: 1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 6,
  },
  value: {
    fontSize: 24,
    fontFamily: Fonts.sansBlack,
    fontWeight: '900',
  },
  trend: {
    fontSize: 12,
    fontFamily: Fonts.sansBold,
    fontWeight: '700',
  },
});

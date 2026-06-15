import { Pressable, StyleSheet, Text } from 'react-native';

import { BrandColors, NeutralColors, Fonts } from '@/constants/theme';
import { BorderRadius } from '@/constants/spacing';

type Props = {
  label: string;
  active: boolean;
  onPress: () => void;
};

export function FilterChip({ label, active, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
    >
      <Text style={[styles.label, { color: active ? '#fff' : NeutralColors.textPrimary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.chip,
  },
  chipActive: {
    backgroundColor: BrandColors.primary,
  },
  chipInactive: {
    backgroundColor: NeutralColors.border,
  },
  label: {
    fontSize: 14,
    fontFamily: Fonts.sansSemiBold,
    fontWeight: '600',
  },
});

import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, NeutralColors, Fonts } from '@/constants/theme';
import { CardHeight, Shadow } from '@/constants/spacing';

type Props = {
  onPress: () => void;
  icon?: string;
};

export function FAB({ onPress, icon = '+' }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Pressable onPress={onPress} style={[styles.fab, { bottom: Math.max(insets.bottom, 16) + 16 }]}>
      <Text style={styles.icon}>{icon}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    width: CardHeight.fab,
    height: CardHeight.fab,
    borderRadius: CardHeight.fab / 2,
    backgroundColor: BrandColors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.fab,
  },
  icon: {
    color: NeutralColors.textInverse,
    fontSize: 28,
    fontFamily: Fonts.sansSemiBold,
    fontWeight: '600',
    lineHeight: 30,
  },
});

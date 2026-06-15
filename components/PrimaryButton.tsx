import { Pressable, StyleSheet, Text } from 'react-native';

import { BrandColors, NeutralColors, Fonts } from '@/constants/theme';
import { BorderRadius } from '@/constants/spacing';

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  color?: string;
};

export function PrimaryButton({
  title,
  onPress,
  disabled = false,
  fullWidth = true,
  color = BrandColors.teal,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        { backgroundColor: color, width: fullWidth ? '100%' : undefined },
        disabled && styles.disabled,
      ]}
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: BorderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: NeutralColors.textInverse,
    fontFamily: Fonts.sansBlack,
    fontWeight: '900',
    fontSize: 15,
  },
});

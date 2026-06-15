import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { BrandColors, Fonts, NeutralColors } from '@/constants/theme';
import { BorderRadius, Spacing } from '@/constants/spacing';

type Props = {
  message: string;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
};

export function TopToast({ message, visible, onDismiss, duration = 3000 }: Props) {
  const translateY = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 15,
        stiffness: 200,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(translateY, {
          toValue: -120,
          duration: 250,
          useNativeDriver: true,
        }).start(() => onDismiss());
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, onDismiss, translateY]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <View style={styles.inner}>
        <Ionicons name="alert-circle" size={20} color={BrandColors.danger} />
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingTop: 50,
    paddingHorizontal: Spacing.md,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEE2E2',
    padding: Spacing.md,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: BrandColors.danger,
  },
  text: {
    color: NeutralColors.textInverse,
    fontFamily: Fonts.sansBold,
    fontWeight: '700',
  },
});

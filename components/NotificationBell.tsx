import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { BrandColors, NeutralColors, Fonts } from '@/constants/theme';
import { Spacing } from '@/constants/spacing';

type Props = {
  count: number;
};

export function NotificationBell({ count }: Props) {
  return (
    <Pressable onPress={() => router.push('/notifications')} style={styles.container}>
      <Ionicons name="notifications-outline" size={24} color={NeutralColors.textPrimary} />
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xs,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: BrandColors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: Fonts.sansBold,
    fontWeight: '700',
  },
});

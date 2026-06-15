import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { StatusBorders, Fonts, StatusColors } from '@/constants/theme';
import { BorderRadius, Shadow, Spacing } from '@/constants/spacing';
import { StatusBadge, getStatus } from './StatusBadge';

type Props = {
  name: string;
  stock: number;
  sellPrice: number;
  costPrice?: number;
  imageUri?: string | null;
  minStock?: number | null;
  onPress: () => void;
};

export function ProductGridCard({
  name,
  stock,
  sellPrice,
  costPrice,
  imageUri,
  minStock,
  onPress,
}: Props) {
  const status = getStatus(stock, minStock);
  const statusBg = StatusColors[status].bg;
  const borderColor = StatusBorders[status];
  const textColor = StatusColors[status].text;

  function formatPHP(n: number) {
    return `₱${n.toLocaleString('en-PH')}`;
  }

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: statusBg,
          borderLeftWidth: 4,
          borderLeftColor: borderColor,
        },
      ]}
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={[styles.image, { backgroundColor: statusBg }]} />
      ) : (
        <View style={[styles.imagePlaceholder, { backgroundColor: statusBg }]}>
          <Ionicons name="cube-outline" size={28} color={borderColor} />
        </View>
      )}
      <View style={styles.body}>
        <Text style={[styles.name, { color: textColor }]} numberOfLines={1}>
          {name}
        </Text>
        <Text style={[styles.stock, { color: textColor }]}>Stock: {stock}</Text>
        <Text style={[styles.price, { color: textColor }]}>Sell: {formatPHP(sellPrice)}</Text>
        {costPrice !== undefined && (
          <Text style={[styles.cost, { color: textColor }]}>Cost: {formatPHP(costPrice)}</Text>
        )}
        <View style={styles.badgeWrapper}>
          <StatusBadge status={status} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: BorderRadius.card,
    overflow: 'hidden',
    ...Shadow.card,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    resizeMode: 'contain',
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: Spacing.sm,
    gap: 3,
  },
  name: {
    fontSize: 14,
    fontFamily: Fonts.sansExtraBold,
    fontWeight: '800',
  },
  stock: {
    fontSize: 12,
    fontFamily: Fonts.sansSemiBold,
    fontWeight: '600',
  },
  price: {
    fontSize: 13,
    fontFamily: Fonts.sansBold,
    fontWeight: '700',
  },
  cost: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
    fontWeight: '500',
  },
  badgeWrapper: {
    marginTop: Spacing.xs,
  },
});

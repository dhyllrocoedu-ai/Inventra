import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { BrandColors, NeutralColors, Fonts } from '@/constants/theme';
import { BorderRadius, Shadow, Spacing } from '@/constants/spacing';

type Props = {
  name: string;
  sellPrice: number;
  stock: number;
  selected: boolean;
  qty: number;
  onPress: () => void;
};

export function SalesGridCard({ name, sellPrice, stock, selected, qty, onPress }: Props) {
  function formatPHP(n: number) {
    return `₱${n.toLocaleString('en-PH')}`;
  }

  return (
    <Pressable
      onPress={stock > 0 ? onPress : undefined}
      style={[styles.card, selected && styles.cardSelected, stock <= 0 && styles.cardDisabled]}
    >
      <View style={styles.body}>
        <Text style={[styles.name, selected && styles.nameSelected]} numberOfLines={2}>
          {name}
        </Text>
        <Text style={styles.price}>{formatPHP(sellPrice)}</Text>
        {stock > 0 ? (
          <Text style={[styles.stockLabel, stock <= 5 && styles.stockCritical]}>
            Stock: {stock}
          </Text>
        ) : (
          <Text style={styles.outOfStock}>Out of Stock</Text>
        )}
        {selected && (
          <View style={styles.qtyBadge}>
            <Ionicons name="checkmark-circle" size={16} color={BrandColors.primary} />
            <Text style={styles.qtyText}>Qty: {qty}</Text>
          </View>
        )}
      </View>
      {!selected && stock > 0 && (
        <View style={styles.addIcon}>
          <Ionicons name="add-circle-outline" size={22} color={NeutralColors.textDisabled} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: NeutralColors.card,
    borderRadius: BorderRadius.card,
    padding: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    ...Shadow.card,
  },
  cardSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: '#EFF6FF',
  },
  cardDisabled: {
    opacity: 0.5,
  },
  body: {
    gap: 4,
  },
  name: {
    fontSize: 13,
    fontFamily: Fonts.sansBold,
    fontWeight: '700',
    color: NeutralColors.textPrimary,
  },
  nameSelected: {
    color: BrandColors.primary,
  },
  price: {
    fontSize: 18,
    fontFamily: Fonts.sansBlack,
    fontWeight: '900',
    color: BrandColors.primary,
  },
  stockLabel: {
    fontSize: 11,
    fontFamily: Fonts.sansBold,
    fontWeight: '700',
    color: NeutralColors.textSecondary,
  },
  stockCritical: {
    color: BrandColors.danger,
  },
  outOfStock: {
    fontSize: 11,
    fontFamily: Fonts.sansBold,
    fontWeight: '700',
    color: BrandColors.danger,
  },
  qtyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.xs,
  },
  qtyText: {
    fontSize: 12,
    fontFamily: Fonts.sansBold,
    fontWeight: '700',
    color: BrandColors.primary,
  },
  addIcon: {
    alignItems: 'flex-end',
    marginTop: Spacing.sm,
  },
});

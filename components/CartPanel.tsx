import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BrandColors, NeutralColors, Fonts } from '@/constants/theme';
import { BorderRadius, Shadow, Spacing } from '@/constants/spacing';
import { PrimaryButton } from './PrimaryButton';

type CartItem = {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
};

type Props = {
  items: CartItem[];
  total: number;
  onCheckout: () => void;
  onChangeQty: (productId: string, delta: number) => void;
  horizontal?: boolean;
};

function formatPHP(n: number) {
  return `₱${n.toLocaleString('en-PH')}`;
}

export function CartPanel({ items, total, onCheckout, onChangeQty, horizontal }: Props) {
  const itemCount = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <View style={[styles.panel, horizontal && styles.panelHorizontal]}>
      {items.length > 0 && (
        <ScrollView
          style={[styles.lines, horizontal && styles.linesHorizontal]}
          showsVerticalScrollIndicator={false}
        >
          {items.map((item) => (
            <View key={item.productId} style={styles.lineRow}>
              <View style={styles.lineInfo}>
                <Text style={styles.lineName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.linePrice}>{formatPHP(item.unitPrice)}</Text>
              </View>
              <View style={styles.qtyBox}>
                <Pressable
                  style={styles.qtyBtn}
                  onPress={() => onChangeQty(item.productId, -1)}
                >
                  <Text style={styles.qtyBtnText}>-</Text>
                </Pressable>
                <Text style={styles.qtyText}>{item.qty}</Text>
                <Pressable
                  style={styles.qtyBtn}
                  onPress={() => onChangeQty(item.productId, +1)}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.divider} />

      <View style={styles.summary}>
        <View>
          <Text style={styles.itemCount}>
            {itemCount > 0 ? `${items.length} Product${items.length > 1 ? 's' : ''}` : 'No items'}
          </Text>
          <Text style={styles.totalValue}>{formatPHP(total)}</Text>
        </View>
        <View style={[styles.checkoutWrapper, horizontal && styles.checkoutWrapperHorizontal]}>
          <PrimaryButton
            title="Generate Receipt"
            onPress={onCheckout}
            disabled={items.length === 0}
            color={BrandColors.teal}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: NeutralColors.card,
    borderTopLeftRadius: BorderRadius.sheet,
    borderTopRightRadius: BorderRadius.sheet,
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
    ...Shadow.cartPanel,
  },
  lines: {
    gap: 10,
    marginBottom: Spacing.sm,
    maxHeight: 240,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lineInfo: {
    flex: 1,
  },
  lineName: {
    fontSize: 13,
    fontFamily: Fonts.sansExtraBold,
    fontWeight: '800',
    color: NeutralColors.textPrimary,
  },
  linePrice: {
    fontSize: 12,
    color: BrandColors.primary,
    fontFamily: Fonts.sansBold,
    fontWeight: '700',
    marginTop: 2,
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: NeutralColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontFamily: Fonts.sansBlack,
    fontWeight: '900',
    fontSize: 16,
    color: NeutralColors.textPrimary,
  },
  qtyText: {
    width: 20,
    textAlign: 'center',
    fontFamily: Fonts.sansBlack,
    fontWeight: '900',
    fontSize: 14,
    color: NeutralColors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: NeutralColors.border,
    marginVertical: Spacing.sm,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemCount: {
    fontSize: 12,
    color: NeutralColors.textSecondary,
    fontFamily: Fonts.sansSemiBold,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 22,
    fontFamily: Fonts.sansBlack,
    fontWeight: '900',
    color: NeutralColors.textPrimary,
    marginTop: 2,
  },
  checkoutWrapper: {
    width: 160,
  },
  checkoutWrapperHorizontal: {
    width: '100%',
  },
  panelHorizontal: {
    width: 320,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderLeftWidth: 1,
    borderLeftColor: NeutralColors.border,
    paddingBottom: Spacing.md,
    ...Shadow.card,
  },
  linesHorizontal: {
    maxHeight: 300,
  },
});

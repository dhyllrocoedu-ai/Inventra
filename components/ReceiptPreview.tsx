import { StyleSheet, Text, TextInput, View } from 'react-native';

import { BrandColors, NeutralColors, Fonts } from '@/constants/theme';
import { BorderRadius, Shadow, Spacing } from '@/constants/spacing';
import { PrimaryButton } from './PrimaryButton';

type Line = {
  label: string;
  qty: number;
  amount: number;
};

type Props = {
  receiptNo: string;
  lines: Line[];
  total: number;
  customerName: string;
  notes: string;
  onCustomerNameChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

function formatPHP(n: number) {
  return `₱${n.toLocaleString('en-PH')}`;
}

export function ReceiptPreview({
  receiptNo,
  lines,
  total,
  customerName,
  notes,
  onCustomerNameChange,
  onNotesChange,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.receiptNo}>Receipt {receiptNo}</Text>

      <View style={styles.divider} />

      {lines.map((l, i) => (
        <View key={i} style={styles.line}>
          <Text style={styles.lineLabel}>
            {l.label} x{l.qty}
          </Text>
          <Text style={styles.lineAmount}>{formatPHP(l.amount)}</Text>
        </View>
      ))}

      <View style={styles.divider} />

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatPHP(total)}</Text>
      </View>

      <View style={styles.divider} />

      <TextInput
        value={customerName}
        onChangeText={onCustomerNameChange}
        placeholder="Customer Name (optional)"
        placeholderTextColor={NeutralColors.textDisabled}
        style={styles.input}
      />
      <TextInput
        value={notes}
        onChangeText={onNotesChange}
        placeholder="Notes (optional)"
        placeholderTextColor={NeutralColors.textDisabled}
        style={[styles.input, styles.textArea]}
        multiline
        numberOfLines={2}
      />

      <View style={styles.actions}>
        <View style={styles.buttonHalf}>
          <PrimaryButton title="Cancel" onPress={onCancel} color={NeutralColors.border} />
        </View>
        <View style={styles.buttonHalf}>
          <PrimaryButton title="Confirm Sale" onPress={onConfirm} color={BrandColors.teal} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: NeutralColors.card,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    ...Shadow.elevated,
  },
  receiptNo: {
    fontSize: 16,
    fontFamily: Fonts.sansBlack,
    fontWeight: '900',
    color: NeutralColors.textPrimary,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: NeutralColors.border,
    marginVertical: Spacing.sm,
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  lineLabel: {
    flex: 1,
    fontSize: 14,
    color: NeutralColors.textPrimary,
    fontFamily: Fonts.sansSemiBold,
    fontWeight: '600',
  },
  lineAmount: {
    fontSize: 14,
    fontFamily: Fonts.sansExtraBold,
    fontWeight: '800',
    color: NeutralColors.textPrimary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: Fonts.sansBold,
    fontWeight: '700',
    color: NeutralColors.textSecondary,
  },
  totalValue: {
    fontSize: 20,
    fontFamily: Fonts.sansBlack,
    fontWeight: '900',
    color: NeutralColors.textPrimary,
  },
  input: {
    height: 44,
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: NeutralColors.border,
    paddingHorizontal: 12,
    fontSize: 14,
    color: NeutralColors.textPrimary,
    backgroundColor: NeutralColors.background,
    marginTop: Spacing.sm,
  },
  textArea: {
    height: 60,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: Spacing.md,
  },
  buttonHalf: {
    flex: 1,
  },
});

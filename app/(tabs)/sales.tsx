import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, Fonts, NeutralColors } from '@/constants/theme';
import { BorderRadius, Shadow, Spacing } from '@/constants/spacing';
import { useResponsive } from '@/hooks/useResponsive';
import { SalesGridCard } from '@/components/SalesGridCard';
import { CartPanel } from '@/components/CartPanel';
import { ReceiptPreview } from '@/components/ReceiptPreview';
import { TopToast } from '@/components/TopToast';
import { PrimaryButton } from '@/components/PrimaryButton';


type Product = {
  id: string;
  name: string;
  sellPrice: number;
  stock: number;
};

type CartLine = {
  product: Product;
  qty: number;
};

type ReceiptRecord = {
  id: number;
  receipt_no: string;
  total: number;
  profit: number;
  customer_name: string | null;
  created_at: string;
};

type ReceiptItemRecord = {
  name: string;
  qty: number;
  unit_sell_price: number;
  line_subtotal: number;
};

type DaySummaryReceiptItem = {
  name: string;
  qty: number;
  unitPrice: number;
  lineSubtotal: number;
};

type DaySummaryReceipt = {
  receiptNo: string;
  total: number;
  profit: number;
  customerName: string | null;
  items: DaySummaryReceiptItem[];
};

type DaySummary = {
  date: string;
  endedAt: string;
  revenue: number;
  profit: number;
  salesCount: number;
  itemsSold: number;
  topProductName: string | null;
  topProductQty: number | null;
  mostProfitableName: string | null;
  mostProfitableProfit: number | null;
  receipts: DaySummaryReceipt[];
};

function formatPHP(n: number) {
  return `₱${n.toLocaleString('en-PH')}`;
}

export default function SalesScreen() {
  const insets = useSafeAreaInsets();
  const { columns: saleColumns, width: screenWidth, isTablet } = useResponsive();
  const [mode, setMode] = useState<'sale' | 'history'>('sale');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptRecord | null>(null);
  const [receiptItems, setReceiptItems] = useState<ReceiptItemRecord[]>([]);
  const [nextReceiptNo, setNextReceiptNo] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const [showDaySummary, setShowDaySummary] = useState(false);
  const [daySummary, setDaySummary] = useState<DaySummary | null>(null);
  const [todaySummaries, setTodaySummaries] = useState<DaySummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredReceipts, setFilteredReceipts] = useState<ReceiptRecord[] | null>(null);

  const cartTotal = React.useMemo(
    () => cart.reduce((sum, l) => sum + l.qty * l.product.sellPrice, 0),
    [cart]
  );

  useEffect(() => {
    (async () => {
      try {
        const { getTodaySummaries } = await import('@/lib/db/analytics');
        const summaries = await getTodaySummaries();
        setTodaySummaries(summaries);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredReceipts(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const { searchReceipts } = await import('@/lib/db/receipts');
        const results = await searchReceipts(searchQuery.trim());
        setFilteredReceipts(results as ReceiptRecord[]);
      } catch {
        setFilteredReceipts([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  async function loadProducts() {
    try {
      const { listProducts } = await import('@/lib/db/products');
      const all = await listProducts();
      setProducts(
        all.map((p: any) => ({
          id: p.id,
          name: p.name,
          sellPrice: p.sellPrice,
          stock: p.stock,
        }))
      );
    } catch {
      setProducts([]);
    }
  }

  async function loadReceipts() {
    try {
      const { listReceipts } = await import('@/lib/db/receipts');
      const data = await listReceipts();
      setReceipts(data as ReceiptRecord[]);
    } catch {
      setReceipts([]);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [])
  );

  function showToast(msg: string) {
    setToastMsg(msg);
  }

  function dismissToast() { setToastMsg(''); }

  function handleProductPress(p: Product) {
    if (p.stock <= 0) {
      showToast(`${p.name} is out of stock`);
      return;
    }
    setCart((prev) => {
      const found = prev.find((l) => l.product.id === p.id);
      const newQty = found ? found.qty + 1 : 1;
      if (newQty > p.stock) {
        showToast(`Only ${p.stock} left in stock for ${p.name}`);
        return prev;
      }
      if (!found) return [...prev, { product: p, qty: 1 }];
      return prev.map((l) =>
        l.product.id === p.id ? { ...l, qty: l.qty + 1 } : l
      );
    });
  }

  function handleChangeQty(productId: string, delta: number) {
    if (delta > 0) {
      const line = cart.find((l) => l.product.id === productId);
      if (line && line.qty + delta > line.product.stock) {
        showToast(`Only ${line.product.stock} left in stock for ${line.product.name}`);
        return;
      }
    }
    setCart((prev) => {
      const next = prev
        .map((l) => (l.product.id === productId ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0);
      return next;
    });
  }

  async function handleCheckout() {
    setShowCheckout(true);
    setCustomerName('');
    setNotes('');
    try {
      const { getNextReceiptNo } = await import('@/lib/db/receipts');
      const no = await getNextReceiptNo();
      setNextReceiptNo(no);
    } catch {
      setNextReceiptNo('--');
    }
  }

  async function handleConfirmSale() {
    setConfirming(true);
    try {
      const { createReceipt } = await import('@/lib/db/receipts');
      const result = await createReceipt({
        customerName: customerName.trim() || undefined,
        notes: notes.trim() || undefined,
        items: cart.map((l) => ({
          productId: l.product.id,
          qty: l.qty,
        })),
      });
      Alert.alert('Sale Complete', `Receipt ${result.receiptNo} — ₱${result.total.toLocaleString('en-PH')}`);
      setCart([]);
      setShowCheckout(false);
      loadProducts();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Sale failed.');
    } finally {
      setConfirming(false);
    }
  }

  function handleCancelCheckout() {
    setShowCheckout(false);
  }

  async function handleViewReceipt(r: ReceiptRecord) {
    setSelectedReceipt(r);
    try {
      const { getReceiptItems } = await import('@/lib/db/receipts');
      const items = await getReceiptItems(r.id);
      setReceiptItems(items as ReceiptItemRecord[]);
    } catch {
      setReceiptItems([]);
    }
  }

  async function handleCallItADay() {
    try {
      const { callItADay } = await import('@/lib/db/analytics');
      const summary = await callItADay();
      setDaySummary(summary);
      setTodaySummaries((prev) => [...prev, summary]);
      setShowDaySummary(true);
      await loadReceipts();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to end day.');
    }
  }

  function handleToggleMode(newMode: 'sale' | 'history') {
    setMode(newMode);
    if (newMode === 'history') {
      loadReceipts();
    }
  }

  const cartItems = cart.map((l) => ({
    productId: l.product.id,
    name: l.product.name,
    qty: l.qty,
    unitPrice: l.product.sellPrice,
  }));

  const receiptLines = cart.map((l) => ({
    label: l.product.name,
    qty: l.qty,
    amount: l.qty * l.product.sellPrice,
  }));

  const toastVisible = toastMsg.length > 0;

  const postSummaryReceipts = React.useMemo(() => {
    if (!todaySummaries.length) return receipts;
    const allSummaryNos = new Set(todaySummaries.flatMap((s) => s.receipts.map((r) => r.receiptNo)));
    return receipts.filter((r) => !allSummaryNos.has(r.receipt_no));
  }, [todaySummaries, receipts]);

  const displayReceipts = filteredReceipts ?? postSummaryReceipts;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopToast message={toastMsg} visible={toastVisible} onDismiss={dismissToast} duration={3000} />

      {showCheckout ? (
        <View style={styles.overlay}>
          <View style={styles.overlayBackdrop}>
            <ScrollView contentContainerStyle={[styles.checkoutContainer, { paddingTop: insets.top + 20 }]}>
              <Text style={styles.checkoutTitle}>Receipt Summary</Text>
              <ReceiptPreview
                receiptNo={nextReceiptNo}
                lines={receiptLines}
                total={cartTotal}
                customerName={customerName}
                notes={notes}
                onCustomerNameChange={setCustomerName}
                onNotesChange={setNotes}
                onConfirm={handleConfirmSale}
                onCancel={handleCancelCheckout}
              />
            </ScrollView>
          </View>
        </View>
      ) : (
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Sales</Text>
          </View>

          <View style={styles.toggleRow}>
            <Pressable
              style={[styles.toggleBtn, mode === 'sale' && styles.toggleActive]}
              onPress={() => handleToggleMode('sale')}
            >
              <Ionicons
                name="cart-outline"
                size={16}
                color={mode === 'sale' ? '#fff' : NeutralColors.textSecondary}
              />
              <Text style={[styles.toggleText, mode === 'sale' && styles.toggleTextActive]}>
                New Sale
              </Text>
            </Pressable>
            <Pressable
              style={[styles.toggleBtn, mode === 'history' && styles.toggleActive]}
              onPress={() => handleToggleMode('history')}
            >
              <Ionicons
                name="receipt-outline"
                size={16}
                color={mode === 'history' ? '#fff' : NeutralColors.textSecondary}
              />
              <Text style={[styles.toggleText, mode === 'history' && styles.toggleTextActive]}>
                Receipt History
              </Text>
            </Pressable>
          </View>

          {mode === 'history' ? (
            selectedReceipt ? (
              <View style={styles.historyDetail}>
                <Pressable onPress={() => setSelectedReceipt(null)} style={styles.backRow}>
                  <Ionicons name="arrow-back" size={20} color={BrandColors.primary} />
                  <Text style={styles.backText}>Back to History</Text>
                </Pressable>
                <View style={styles.detailCard}>
                  <Text style={styles.detailReceiptNo}>{selectedReceipt.receipt_no}</Text>
                  {selectedReceipt.customer_name && (
                    <Text style={styles.detailCustomer}>{selectedReceipt.customer_name}</Text>
                  )}
                  <View style={styles.divider} />
                  {receiptItems.map((item, i) => (
                    <View key={i} style={styles.detailLine}>
                      <Text style={styles.detailLineLabel}>
                        {item.name} x{item.qty}
                      </Text>
                      <Text style={styles.detailLineAmount}>
                        {formatPHP(item.line_subtotal)}
                      </Text>
                    </View>
                  ))}
                  <View style={styles.divider} />
                  <View style={styles.detailTotalRow}>
                    <Text style={styles.detailTotalLabel}>Total</Text>
                    <Text style={styles.detailTotalValue}>
                      {formatPHP(selectedReceipt.total)}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <>
              {mode === 'history' && (
                <View style={styles.searchRow}>
                  <Ionicons name="search-outline" size={16} color={NeutralColors.textSecondary} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search receipt no, customer, product..."
                    placeholderTextColor={NeutralColors.textDisabled}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery.length > 0 && (
                    <Pressable onPress={() => setSearchQuery('')}>
                      <Ionicons name="close-circle" size={18} color={NeutralColors.textSecondary} />
                    </Pressable>
                  )}
                </View>
              )}
              <ScrollView style={styles.historyScroll} contentContainerStyle={[styles.historyScrollContent, { paddingBottom: insets.bottom + 80 }]}>
                {todaySummaries.length === 0 && receipts.length > 0 && (
                  <View style={styles.closeBusinessDayRow}>
                    <Pressable style={styles.closeBusinessDayBtn} onPress={handleCallItADay}>
                      <Ionicons name="flag-outline" size={16} color="#fff" />
                      <View>
                        <Text style={styles.closeBusinessDayText}>Close Business Day</Text>
                      </View>
                    </Pressable>
                  </View>
                )}

                {todaySummaries.map((s, idx) => (
                  <View key={s.date + s.endedAt + String(idx)}>
                    <View style={styles.dayEndedBanner}>
                      <Text style={styles.dayEndedText}>
                        Day ended at {s.endedAt}
                      </Text>
                      <Pressable
                        style={styles.viewSummaryBtn}
                        onPress={() => { setDaySummary(s); setShowDaySummary(true); }}
                      >
                        <Text style={styles.viewSummaryText}>View Summary</Text>
                      </Pressable>
                    </View>

                    {s.receipts.length > 0 ? (
                      s.receipts.map((r) => (
                        <View key={r.receiptNo} style={styles.summaryReceiptCard}>
                          <Text style={styles.summaryReceiptNo}>{r.receiptNo}</Text>
                          {r.customerName && (
                            <Text style={styles.summaryReceiptCustomer}>{r.customerName}</Text>
                          )}
                          {r.items.map((item, i) => (
                            <View key={i} style={styles.summaryReceiptItemLine}>
                              <Text style={styles.summaryReceiptItemName}>
                                {item.name} x{item.qty}
                              </Text>
                              <Text style={styles.summaryReceiptItemAmount}>
                                {formatPHP(item.lineSubtotal)}
                              </Text>
                            </View>
                          ))}
                          <View style={styles.summaryReceiptTotalRow}>
                            <Text style={styles.summaryReceiptTotalLabel}>Total</Text>
                            <Text style={styles.summaryReceiptTotalValue}>{formatPHP(r.total)}</Text>
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptyText}>No receipts in this batch</Text>
                    )}

                    {idx === todaySummaries.length - 1 && postSummaryReceipts.length > 0 && (
                      <View style={styles.separatorLine}>
                        <View style={styles.separatorRule} />
                        <Text style={styles.separatorText}>
                          ───── End of Day ({s.endedAt}) ─────
                        </Text>
                        <View style={styles.separatorRule} />
                      </View>
                    )}

                    {idx < todaySummaries.length - 1 && (
                      <View style={styles.separatorLine}>
                        <View style={styles.separatorRule} />
                        <Text style={styles.separatorText}>───── End of Day ({s.endedAt}) ─────</Text>
                        <View style={styles.separatorRule} />
                      </View>
                    )}
                  </View>
                ))}

                {todaySummaries.length > 0 && postSummaryReceipts.length > 0 && (
                  <>
                    {displayReceipts.map((r) => (
                      <Pressable
                        key={r.id}
                        style={styles.receiptRow}
                        onPress={() => handleViewReceipt(r)}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.receiptRowNo}>{r.receipt_no}</Text>
                          <Text style={styles.receiptRowTotal}>{formatPHP(r.total)}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={NeutralColors.textDisabled} />
                      </Pressable>
                    ))}
                    <View style={styles.closeBusinessDayRow}>
                      <Pressable style={styles.closeBusinessDayBtn} onPress={handleCallItADay}>
                        <Ionicons name="flag-outline" size={16} color="#fff" />
                        <View>
                          <Text style={styles.closeBusinessDayText}>Close Business Day</Text>
                        </View>
                      </Pressable>
                    </View>
                  </>
                )}

                {todaySummaries.length === 0 && receipts.length > 0 && (
                  <>
                    {displayReceipts.map((r) => (
                      <Pressable
                        key={r.id}
                        style={styles.receiptRow}
                        onPress={() => handleViewReceipt(r)}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.receiptRowNo}>{r.receipt_no}</Text>
                          <Text style={styles.receiptRowTotal}>{formatPHP(r.total)}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={NeutralColors.textDisabled} />
                      </Pressable>
                    ))}
                  </>
                )}

                {todaySummaries.length === 0 && receipts.length === 0 && (
                  <Text style={styles.emptyText}>No receipts today</Text>
                )}
              </ScrollView>
              </>
            )
          ) : (
            <View style={isTablet ? styles.saleRow : styles.saleColumn}>
              <FlatList
                key={`sale_grid_${saleColumns}`}
                data={products}
                keyExtractor={(p) => `${p.id}_${saleColumns}`}
                numColumns={saleColumns}
                columnWrapperStyle={styles.columnWrapper}
                contentContainerStyle={[
                  isTablet ? styles.productListHorizontal : styles.productList,
                  { paddingBottom: isTablet ? insets.bottom + 20 : insets.bottom + 160 },
                ]}
                renderItem={({ item }) => {
                  const inCart = cart.find((l) => l.product.id === item.id);
                  return (
                    <SalesGridCard
                      name={item.name}
                      sellPrice={item.sellPrice}
                      stock={item.stock}
                      selected={!!inCart}
                      qty={inCart?.qty ?? 0}
                      onPress={() => handleProductPress(item)}
                    />
                  );
                }}
              />

              <CartPanel
                horizontal={isTablet}
                items={cartItems}
                total={cartTotal}
                onCheckout={handleCheckout}
                onChangeQty={handleChangeQty}
              />
            </View>
          )}

          {confirming && (
            <View style={styles.confirmingOverlay}>
              <Text style={styles.confirmingText}>Processing sale...</Text>
            </View>
          )}
        </View>
      )}

      <Modal visible={showDaySummary} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowDaySummary(false)}>
          <Pressable style={styles.summaryCard} onPress={() => {}}>
            <Text style={styles.summaryTitle}>Day Summary</Text>
            {daySummary && (
              <>
                <Text style={styles.summaryDate}>{daySummary.date}</Text>
                <Text style={styles.summaryEnded}>Ended at {daySummary.endedAt}</Text>
                <View style={styles.divider} />
                <SummaryRow label="Total Revenue" value={formatPHP(daySummary.revenue)} />
                <SummaryRow label="Total Profit" value={formatPHP(daySummary.profit)} />
                <SummaryRow label="Sales Count" value={String(daySummary.salesCount)} />
                <SummaryRow label="Items Sold" value={String(daySummary.itemsSold)} />
                {daySummary.topProductName && (
                  <SummaryRow
                    label="Top Product"
                    value={`${daySummary.topProductName} (${daySummary.topProductQty})`}
                  />
                )}
                {daySummary.mostProfitableName && (
                  <SummaryRow
                    label="Most Profitable"
                    value={`${daySummary.mostProfitableName} (${formatPHP(daySummary.mostProfitableProfit ?? 0)})`}
                  />
                )}
              </>
            )}
            <View style={styles.divider} />
            <PrimaryButton title="Close" onPress={() => setShowDaySummary(false)} color={BrandColors.primary} />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NeutralColors.background },
  header: { padding: Spacing.md, paddingBottom: 0 },
  title: { fontSize: 28, fontFamily: Fonts.sansBlack, fontWeight: '900', color: BrandColors.navy },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.chip,
    backgroundColor: NeutralColors.border,
  },
  toggleActive: {
    backgroundColor: BrandColors.primary,
  },
  toggleText: {
    fontSize: 13,
    fontFamily: Fonts.sansBold,
    fontWeight: '700',
    color: NeutralColors.textSecondary,
  },
  toggleTextActive: {
    color: '#fff',
  },
  saleColumn: { flex: 1 },
  saleRow: { flex: 1, flexDirection: 'row' },
  columnWrapper: { gap: 12 },
  productList: { padding: Spacing.md, paddingTop: 0, gap: 12 },
  productListHorizontal: { padding: Spacing.md, gap: 12 },

  overlay: { flex: 1, backgroundColor: NeutralColors.background },
  overlayBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  checkoutContainer: { padding: Spacing.md, paddingBottom: 40 },
  checkoutTitle: {
    fontSize: 20,
    fontFamily: Fonts.sansBlack,
    fontWeight: '900',
    color: NeutralColors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },

  closeBusinessDayRow: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  closeBusinessDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: BrandColors.navy,
    paddingVertical: 12,
    borderRadius: BorderRadius.button,
  },
  closeBusinessDayText: {
    color: '#fff',
    fontFamily: Fonts.sansBlack,
    fontWeight: '900',
    fontSize: 14,
  },
  dayEndedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: '#F0FDF4',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: BrandColors.teal,
  },
  dayEndedText: {
    fontSize: 13,
    fontFamily: Fonts.sansExtraBold,
    fontWeight: '800',
    color: BrandColors.teal,
  },
  viewSummaryBtn: {
    backgroundColor: BrandColors.teal,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.chip,
  },
  viewSummaryText: {
    color: '#fff',
    fontFamily: Fonts.sansExtraBold,
    fontWeight: '800',
    fontSize: 12,
  },
  separatorLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  separatorRule: {
    flex: 1,
    height: 1,
    backgroundColor: NeutralColors.border,
  },
  separatorText: {
    fontSize: 11,
    fontFamily: Fonts.sansBold,
    fontWeight: '700',
    color: NeutralColors.textDisabled,
    textAlign: 'center',
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: NeutralColors.card,
    borderRadius: BorderRadius.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: NeutralColors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.sansSemiBold,
    fontWeight: '600',
    color: NeutralColors.textPrimary,
  },
  historyScroll: { flex: 1 },
  historyScrollContent: { padding: Spacing.md, gap: 10 },
  emptyText: { color: NeutralColors.textSecondary, textAlign: 'center', marginTop: 40 },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NeutralColors.card,
    borderRadius: BorderRadius.card,
    padding: 14,
    ...Shadow.card,
  },
  receiptRowNo: {
    fontSize: 14,
    fontFamily: Fonts.sansExtraBold,
    fontWeight: '800',
    color: NeutralColors.textPrimary,
  },
  receiptRowTotal: {
    fontSize: 18,
    fontFamily: Fonts.sansBlack,
    fontWeight: '900',
    color: BrandColors.teal,
    marginTop: 4,
  },
  historyDetail: { flex: 1, padding: Spacing.md },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.md },
  backText: { color: BrandColors.primary, fontFamily: Fonts.sansBold, fontWeight: '700' },
  detailCard: {
    backgroundColor: NeutralColors.card,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    ...Shadow.card,
  },
  detailReceiptNo: {
    fontSize: 16,
    fontFamily: Fonts.sansBlack,
    fontWeight: '900',
    color: NeutralColors.textPrimary,
    textAlign: 'center',
  },
  detailCustomer: {
    fontSize: 13,
    color: NeutralColors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  divider: { height: 1, backgroundColor: NeutralColors.border, marginVertical: Spacing.sm },
  detailLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  detailLineLabel: { fontSize: 14, color: NeutralColors.textPrimary, fontFamily: Fonts.sansSemiBold, fontWeight: '600', flex: 1 },
  detailLineAmount: { fontSize: 14, fontFamily: Fonts.sansExtraBold, fontWeight: '800', color: NeutralColors.textPrimary },
  detailTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailTotalLabel: { fontSize: 16, fontFamily: Fonts.sansBold, fontWeight: '700', color: NeutralColors.textSecondary },
  detailTotalValue: { fontSize: 20, fontFamily: Fonts.sansBlack, fontWeight: '900', color: NeutralColors.textPrimary },
  confirmingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmingText: { color: '#fff', fontSize: 16, fontFamily: Fonts.sansBold, fontWeight: '700' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  summaryCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: NeutralColors.card,
    borderRadius: BorderRadius.sheet,
    padding: Spacing.lg,
  },
  summaryScroll: {
    maxHeight: 400,
  },
  summaryTitle: {
    fontSize: 20,
    fontFamily: Fonts.sansBlack,
    fontWeight: '900',
    color: NeutralColors.textPrimary,
    textAlign: 'center',
  },
  summaryDate: {
    fontSize: 13,
    color: NeutralColors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  summaryEnded: {
    fontSize: 13,
    color: BrandColors.teal,
    fontFamily: Fonts.sansBold,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
  },
  summaryReceiptCard: {
    backgroundColor: NeutralColors.card,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: NeutralColors.border,
  },
  summaryReceiptNo: {
    fontSize: 14,
    fontFamily: Fonts.sansBlack,
    fontWeight: '900',
    color: NeutralColors.textPrimary,
    marginBottom: 4,
  },
  summaryReceiptCustomer: {
    fontSize: 12,
    color: NeutralColors.textSecondary,
    fontFamily: Fonts.sansSemiBold,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryReceiptItemLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  summaryReceiptItemName: {
    fontSize: 12,
    fontFamily: Fonts.sansSemiBold,
    fontWeight: '600',
    color: NeutralColors.textPrimary,
    flex: 1,
  },
  summaryReceiptItemAmount: {
    fontSize: 12,
    fontFamily: Fonts.sansBold,
    fontWeight: '700',
    color: NeutralColors.textPrimary,
  },
  summaryReceiptTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: NeutralColors.border,
  },
  summaryReceiptTotalLabel: {
    fontSize: 13,
    fontFamily: Fonts.sansBold,
    fontWeight: '700',
    color: NeutralColors.textSecondary,
  },
  summaryReceiptTotalValue: {
    fontSize: 13,
    fontFamily: Fonts.sansBlack,
    fontWeight: '900',
    color: NeutralColors.textPrimary,
  },
  summaryEndDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: Fonts.sansBold,
    fontWeight: '700',
    color: NeutralColors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: Fonts.sansBlack,
    fontWeight: '900',
    color: NeutralColors.textPrimary,
  },
});

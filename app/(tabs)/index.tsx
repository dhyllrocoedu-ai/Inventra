import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, DashboardCardColors, Fonts, NeutralColors } from '@/constants/theme';
import { BorderRadius, Shadow, Spacing } from '@/constants/spacing';
import { useResponsive } from '@/hooks/useResponsive';
import { MetricCard } from '@/components/MetricCard';
import { NotificationBell } from '@/components/NotificationBell';

function formatPHP(n: number) {
  return `₱${n.toLocaleString('en-PH')}`;
}

type DashboardData = {
  todaySales: number;
  todayProfit: number;
  productCount: number;
  lowStockCount: number;
  lowStockProducts: number;
  topProduct: string;
  revenueThisMonth: number;
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { columns: metricColumns, isTablet, isLandscape } = useResponsive();
  const cols = isLandscape ? 4 : 2;

  const metricCardWidth = useMemo(() => {
    const gapTotal = 12 * (cols - 1);
    return `${(100 - 3.5 * (cols - 1)) / cols}%`;
  }, [cols]);

  async function loadData() {
    try {
      const [{ getAnalytics }, { listProducts }] = await Promise.all([
        import('@/lib/db/analytics'),
        import('@/lib/db/products'),
      ]);
      const [analytics, monthlyAnalytics, products] = await Promise.all([
        getAnalytics('daily'),
        getAnalytics('monthly'),
        listProducts(),
      ]);
      setData({
        todaySales: analytics.revenue,
        todayProfit: analytics.profit,
        productCount: products.length,
        lowStockCount: analytics.lowStockProducts.length,
        lowStockProducts: analytics.lowStockProducts.length,
        topProduct: analytics.topProducts[0]?.name ?? '—',
        revenueThisMonth: monthlyAnalytics.revenue,
      });
    } catch {
      setData({
        todaySales: 0,
        todayProfit: 0,
        productCount: 0,
        lowStockCount: 0,
        lowStockProducts: 0,
        topProduct: '—',
        revenueThisMonth: 0,
      });
    }
  }

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        await loadData();
        if (mounted) setLoading(false);
      })();
      return () => {
        mounted = false;
      };
    }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  const d = data ?? {
    todaySales: 0,
    todayProfit: 0,
    productCount: 0,
    lowStockCount: 0,
    lowStockProducts: 0,
    topProduct: '—',
    revenueThisMonth: 0,
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Inventra</Text>
            <Text style={styles.tagline}>Track Stock. Drive Growth.</Text>
          </View>
          <NotificationBell count={d.lowStockCount} />
        </View>

        <View style={[styles.grid, isTablet && styles.gridWide]}>
          <MetricCard
            style={{ width: metricCardWidth }}
            label="Today's Sales"
            value={loading ? '—' : formatPHP(d.todaySales)}
            bgColor={DashboardCardColors.revenue.bg}
            accentColor={DashboardCardColors.revenue.accent}
          />
          <MetricCard
            style={{ width: metricCardWidth }}
            label="Today's Profit"
            value={loading ? '—' : formatPHP(d.todayProfit)}
            bgColor={DashboardCardColors.profit.bg}
            accentColor={DashboardCardColors.profit.accent}
          />
          <MetricCard
            style={{ width: metricCardWidth }}
            label="Products"
            value={loading ? '—' : String(d.productCount)}
            bgColor={DashboardCardColors.products.bg}
            accentColor={DashboardCardColors.products.accent}
          />
          <MetricCard
            style={{ width: metricCardWidth }}
            label="Low Stock"
            value={loading ? '—' : String(d.lowStockCount)}
            bgColor={DashboardCardColors.lowStock.bg}
            accentColor={DashboardCardColors.lowStock.accent}
          />
        </View>

        <View style={styles.quickActions}>
          <Pressable
            style={styles.actionBtn}
            onPress={() => router.push('/add-product')}
          >
            <Ionicons name="add-circle-outline" size={18} color={BrandColors.primary} />
            <Text style={styles.actionText}>Add Product</Text>
          </Pressable>
          <Pressable
            style={styles.actionBtn}
            onPress={() => router.push('/(tabs)/sales')}
          >
            <Ionicons name="cart-outline" size={18} color={BrandColors.primary} />
            <Text style={styles.actionText}>New Sale</Text>
          </Pressable>
          <Pressable
            style={styles.actionBtn}
            onPress={() => router.push('/(tabs)/analytics')}
          >
            <Ionicons name="bar-chart-outline" size={18} color={BrandColors.primary} />
            <Text style={styles.actionText}>View Report</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Insights</Text>

          <View style={styles.insightRow}>
            <View style={[styles.iconBubble, { backgroundColor: `${BrandColors.warning}22` }]}>
              <Ionicons name="alert-circle" size={18} color={BrandColors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              {d.lowStockProducts > 0 ? (
                <>
                  <Text style={styles.insightTitle}>
                    {d.lowStockProducts} product{d.lowStockProducts !== 1 ? 's' : ''} low on stock
                  </Text>
                  <Text style={styles.insightSubtitle}>Review and restock fast</Text>
                </>
              ) : (
                <>
                  <Text style={styles.insightTitle}>Inventory Healthy</Text>
                  <Text style={styles.insightSubtitle}>No products need restocking</Text>
                </>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.insightRow}>
            <View style={[styles.iconBubble, { backgroundColor: `${BrandColors.primary}22` }]}>
              <Ionicons name="trophy" size={18} color={BrandColors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.insightTitle}>Top Product: {d.topProduct}</Text>
              <Text style={styles.insightSubtitle}>Based on sales volume</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.revenueRow}>
            <View style={[styles.iconBubble, { backgroundColor: `${BrandColors.teal}22` }]}>
              <Ionicons name="trending-up" size={18} color={BrandColors.teal} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.insightTitle}>Revenue this month</Text>
              <Text style={styles.revenueValue}>
                {loading ? '—' : formatPHP(d.revenueThisMonth)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NeutralColors.background },
  content: { padding: Spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  title: { fontSize: 28, fontFamily: Fonts.sansBlack, fontWeight: '900', color: BrandColors.navy },
  tagline: { marginTop: 8, color: NeutralColors.textSecondary, fontFamily: Fonts.sansBold, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 14 },
  gridWide: { maxWidth: 800, alignSelf: 'center' },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: BorderRadius.button,
    backgroundColor: NeutralColors.card,
    borderWidth: 1,
    borderColor: NeutralColors.border,
  },
  actionText: {
    fontSize: 12,
    fontFamily: Fonts.sansBold,
    fontWeight: '700',
    color: BrandColors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: NeutralColors.border,
    marginVertical: 12,
  },
  section: {
    marginTop: 12,
    backgroundColor: NeutralColors.card,
    borderRadius: BorderRadius.card,
    padding: 14,
    ...Shadow.card,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: Fonts.sansBold,
    fontWeight: '700',
    color: NeutralColors.textPrimary,
  },
  insightRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  revenueRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.iconBubble,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightTitle: {
    fontFamily: Fonts.sansExtraBold,
    fontWeight: '800',
    fontSize: 14,
    color: NeutralColors.textPrimary,
  },
  insightSubtitle: {
    color: NeutralColors.textSecondary,
    marginTop: 2,
    fontFamily: Fonts.sansSemiBold,
    fontWeight: '600',
    fontSize: 12,
  },
  revenueValue: {
    fontSize: 24,
    fontFamily: Fonts.sansBlack,
    fontWeight: '900',
    color: BrandColors.teal,
    marginTop: 4,
  },
});

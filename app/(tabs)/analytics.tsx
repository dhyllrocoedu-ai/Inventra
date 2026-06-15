import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandColors, DashboardCardColors, Fonts, NeutralColors } from '@/constants/theme';
import { BorderRadius, Shadow, Spacing } from '@/constants/spacing';
import { useResponsive } from '@/hooks/useResponsive';
import { MetricCard } from '@/components/MetricCard';
import { FilterChip } from '@/components/FilterChip';

type Period = 'all' | 'daily' | 'weekly' | 'monthly' | 'annual';

const PERIODS: { key: Period; label: string }[] = [
  { key: 'all', label: 'All Time' },
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'annual', label: 'Annual' },
];

function formatPHP(n: number) {
  return `₱${n.toLocaleString('en-PH')}`;
}

type DailyRow = {
  soldAt: string;
  revenue: number;
  profit: number;
};

type MonthlyRow = {
  month: string;
  revenue: number;
  profit: number;
};

type AnalyticsData = {
  revenue: number;
  profit: number;
  salesCount: number;
  itemsSold: number;
  topProducts: { name: string; qtySold: number }[];
  mostProfitableProducts: { name: string; profit: number }[];
  lowStockProducts: { name: string; remaining: number }[];
  inventoryValue: number;
  dailyBreakdown: DailyRow[];
  monthlyBreakdown: MonthlyRow[];
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatDay(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return DAY_NAMES[d.getDay()];
}

function formatMonth(monthStr: string) {
  const [y, m] = monthStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(m, 10) - 1]} ${y}`;
}

function SimpleBar({ value, maxValue, color, label, amount }: {
  value: number;
  maxValue: number;
  color: string;
  label: string;
  amount: string;
}) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <View style={barStyles.row}>
      <Text style={barStyles.label}>{label}</Text>
      <View style={barStyles.track}>
        <View style={[barStyles.fill, { width: `${Math.max(pct, 2)}%`, backgroundColor: color }]} />
      </View>
      <Text style={barStyles.amount}>{amount}</Text>
    </View>
  );
}

const barStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  label: { minWidth: 50, fontSize: 12, fontFamily: Fonts.sansBold, fontWeight: '700', color: NeutralColors.textSecondary },
  track: {
    flex: 1,
    height: 20,
    backgroundColor: NeutralColors.secondaryBg,
    borderRadius: 6,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 6 },
  amount: { minWidth: 70, fontSize: 12, fontFamily: Fonts.sansExtraBold, fontWeight: '800', color: NeutralColors.textPrimary, textAlign: 'right' },
});

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { columns: metricColumns, isLandscape } = useResponsive();
  const cols = isLandscape ? 4 : 2;
  const [period, setPeriod] = useState<Period>('daily');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const metricCardWidth = useMemo(() => {
    const gapTotal = 12 * (cols - 1);
    return `${(100 - 3.5 * (cols - 1)) / cols}%`;
  }, [cols]);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    try {
      const { getAnalytics } = await import('@/lib/db/analytics');
      const res = await getAnalytics(period);
      setData({
        revenue: res.revenue,
        profit: res.profit,
        salesCount: res.salesCount,
        itemsSold: res.itemsSold,
        topProducts: res.topProducts,
        mostProfitableProducts: res.mostProfitableProducts,
        lowStockProducts: res.lowStockProducts,
        inventoryValue: res.inventoryValue,
        dailyBreakdown: res.dailyBreakdown,
        monthlyBreakdown: res.monthlyBreakdown,
      });
    } catch {
      setData(null);
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
    }, [period])
  );

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  const d = data ?? {
    revenue: 0, profit: 0, salesCount: 0, itemsSold: 0,
    topProducts: [], mostProfitableProducts: [],
    lowStockProducts: [], inventoryValue: 0, dailyBreakdown: [], monthlyBreakdown: [],
  };

  const maxDailyRev = Math.max(...d.dailyBreakdown.map((r) => r.revenue), 1);
  const maxMonthlyRev = Math.max(...d.monthlyBreakdown.map((r) => r.revenue), 1);
  const maxTopQty = Math.max(...d.topProducts.map((p) => p.qtySold), 1);

  const revenueTrend = (() => {
    const b = period === 'monthly' ? d.monthlyBreakdown : d.dailyBreakdown;
    if (b.length < 2) return null;
    const latest = b[b.length - 1].revenue;
    const prev = b[b.length - 2].revenue;
    if (prev === 0) return null;
    const pct = Math.round(((latest - prev) / prev) * 100);
    return { direction: pct >= 0 ? ('up' as const) : ('down' as const), pct: Math.abs(pct) };
  })();

  const profitTrend = (() => {
    const b = d.dailyBreakdown;
    if (b.length < 2) return null;
    const latest = b[b.length - 1].revenue;
    const prev = b[b.length - 2].revenue;
    if (prev === 0) return null;
    const pct = Math.round(((latest - prev) / prev) * 100);
    return { direction: pct >= 0 ? ('up' as const) : ('down' as const), pct: Math.abs(pct) };
  })();

  const periodLabel = PERIODS.find((p) => p.key === period)?.label ?? '';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>Analytics</Text>

        <View style={styles.chipsRow}>
          {PERIODS.map((p) => (
            <FilterChip
              key={p.key}
              label={p.label}
              active={period === p.key}
              onPress={() => setPeriod(p.key)}
            />
          ))}
        </View>

        <View style={styles.grid}>
          <MetricCard
            style={{ width: metricCardWidth }}
            label={`Revenue (${periodLabel})`}
            value={loading ? '—' : formatPHP(d.revenue)}
            bgColor={DashboardCardColors.revenue.bg}
            accentColor={DashboardCardColors.revenue.accent}
            trend={revenueTrend}
          />
          <MetricCard
            style={{ width: metricCardWidth }}
            label={`Profit (${periodLabel})`}
            value={loading ? '—' : formatPHP(d.profit)}
            bgColor={DashboardCardColors.profit.bg}
            accentColor={DashboardCardColors.profit.accent}
            trend={profitTrend}
          />
          <MetricCard
            style={{ width: metricCardWidth }}
            label={`Sales Count (${periodLabel})`}
            value={loading ? '—' : String(d.salesCount)}
            bgColor={DashboardCardColors.products.bg}
            accentColor={DashboardCardColors.products.accent}
          />
          <MetricCard
            style={{ width: metricCardWidth }}
            label={`Items Sold (${periodLabel})`}
            value={loading ? '—' : String(d.itemsSold)}
            bgColor={DashboardCardColors.lowStock.bg}
            accentColor={DashboardCardColors.lowStock.accent}
          />
        </View>

        {(d.inventoryValue > 0 || d.lowStockProducts.length > 0) && (
          <View style={styles.grid}>
            <MetricCard
              style={{ width: metricCardWidth }}
              label="Inventory Value"
              value={loading ? '—' : formatPHP(d.inventoryValue)}
              bgColor="#F0FDF4"
              accentColor={BrandColors.teal}
            />
            <MetricCard
              style={{ width: metricCardWidth }}
              label="Low Stock Products"
              value={loading ? '—' : String(d.lowStockProducts.length)}
              bgColor="#FEF3C7"
              accentColor={BrandColors.warning}
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue Report</Text>
          <Text style={styles.bigValue}>
            {loading ? '—' : formatPHP(d.revenue)}
          </Text>

          {d.dailyBreakdown.length > 0 && (
            <>
              <Text style={styles.subSectionTitle}>Daily (Last 7 Days)</Text>
              {d.dailyBreakdown.map((r) => (
                <SimpleBar
                  key={r.soldAt}
                  label={formatDay(r.soldAt)}
                  value={r.revenue}
                  maxValue={maxDailyRev}
                  color={BrandColors.primary}
                  amount={formatPHP(r.revenue)}
                />
              ))}
            </>
          )}

          {d.monthlyBreakdown.length > 0 && (
            <>
              <Text style={styles.subSectionTitle}>Monthly</Text>
              {d.monthlyBreakdown.map((r) => (
                <SimpleBar
                  key={r.month}
                  label={formatMonth(r.month)}
                  value={r.revenue}
                  maxValue={maxMonthlyRev}
                  color={BrandColors.teal}
                  amount={formatPHP(r.revenue)}
                />
              ))}
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Selling Products ({periodLabel})</Text>
          {d.topProducts.length === 0 ? (
            <Text style={styles.caption}>No sales yet</Text>
          ) : (
            d.topProducts.map((p) => (
              <SimpleBar
                key={p.name}
                label={p.name}
                value={p.qtySold}
                maxValue={maxTopQty}
                color={BrandColors.info}
                amount={`${p.qtySold} sold`}
              />
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Most Profitable Products ({periodLabel})</Text>
          {d.mostProfitableProducts.length === 0 ? (
            <Text style={styles.caption}>No data</Text>
          ) : (
            d.mostProfitableProducts.map((p, idx) => (
              <View key={p.name} style={styles.listItem}>
                <Text style={styles.rank}>{idx + 1}.</Text>
                <Text style={styles.itemName}>{p.name}</Text>
                <Text style={styles.itemValue}>{formatPHP(p.profit)}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Low Stock Report</Text>
          {d.lowStockProducts.length === 0 ? (
            <Text style={styles.caption}>All good</Text>
          ) : (
            d.lowStockProducts.map((p) => (
              <View key={p.name} style={styles.lowItem}>
                <Text style={styles.itemName}>{p.name}</Text>
                <Text style={styles.lowValue}>
                  Remaining: {p.remaining}
                </Text>
              </View>
            ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NeutralColors.background },
  content: { padding: Spacing.md },
  title: { fontSize: 28, fontFamily: Fonts.sansBlack, fontWeight: '900', color: BrandColors.navy },
  chipsRow: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 14 },
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
  subSectionTitle: {
    fontSize: 14,
    fontFamily: Fonts.sansExtraBold,
    fontWeight: '800',
    color: NeutralColors.textSecondary,
    marginTop: 14,
    marginBottom: 4,
  },
  caption: { color: NeutralColors.textSecondary, fontFamily: Fonts.sansSemiBold, fontWeight: '600', marginTop: 8 },
  bigValue: {
    marginTop: 6,
    fontSize: 28,
    fontFamily: Fonts.sansBlack,
    fontWeight: '900',
    color: BrandColors.teal,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  rank: {
    fontSize: 14,
    fontFamily: Fonts.sansExtraBold,
    fontWeight: '800',
    color: NeutralColors.textDisabled,
    width: 20,
    minWidth: 20,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.sansBold,
    fontWeight: '700',
    color: NeutralColors.textPrimary,
  },
  itemValue: {
    fontSize: 13,
    fontFamily: Fonts.sansBold,
    fontWeight: '700',
    color: BrandColors.primary,
  },
  lowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  lowValue: {
    fontSize: 12,
    fontFamily: Fonts.sansBold,
    fontWeight: '700',
    color: BrandColors.warning,
  },
});

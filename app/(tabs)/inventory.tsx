import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandColors, NeutralColors, Fonts } from '@/constants/theme';
import { Spacing } from '@/constants/spacing';
import { useResponsive } from '@/hooks/useResponsive';
import { SearchBar } from '@/components/SearchBar';
import { FilterChip } from '@/components/FilterChip';
import { NotificationBell } from '@/components/NotificationBell';
import { ProductGridCard } from '@/components/ProductGridCard';
import { FAB } from '@/components/FAB';
import { EmptyState } from '@/components/EmptyState';

type Filter = 'all' | 'low' | 'out';

type Product = {
  id: string;
  name: string;
  stock: number;
  sellPrice: number;
  costPrice: number;
  imageUri: string | null;
  minStock: number | null;
};

export default function InventoryScreen() {
  const insets = useSafeAreaInsets();
  const { columns } = useResponsive();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const loadProductsCb = useCallback(async (search: string) => {
    try {
      const { listProducts } = await import('@/lib/db/products');
      const all = await listProducts({ search: search || undefined });
      setProducts(all.map((p: any) => ({
        id: p.id,
        name: p.name,
        stock: p.stock,
        sellPrice: p.sellPrice,
        costPrice: p.costPrice,
        imageUri: p.imageUri ?? null,
        minStock: p.minStock ?? 10,
      })));
    } catch {
      setProducts([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        await loadProductsCb(query);
        if (mounted) setLoading(false);
      })();
      return () => {
        mounted = false;
      };
    }, [loadProductsCb, query])
  );

  async function onRefresh() {
    setRefreshing(true);
    await loadProductsCb(query);
    setRefreshing(false);
  }

  const filtered = products.filter((p) => {
    const threshold = p.minStock && p.minStock > 0 ? p.minStock : 10;
    if (filter === 'low') return p.stock > 0 && p.stock <= threshold;
    if (filter === 'out') return p.stock <= 0;
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Inventory</Text>
          <NotificationBell
            count={products.filter((p) => {
              const t = p.minStock && p.minStock > 0 ? p.minStock : 10;
              return p.stock > 0 && p.stock <= t;
            }).length}
          />
        </View>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search Product..." />
      </View>

      <View style={styles.chipsRow}>
        <FilterChip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
        <FilterChip label="Low Stock" active={filter === 'low'} onPress={() => setFilter('low')} />
        <FilterChip label="Out of Stock" active={filter === 'out'} onPress={() => setFilter('out')} />
      </View>

      {loading ? (
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="cube-outline"
          title={products.length === 0 ? 'No Products Yet' : 'No matching products'}
          subtitle={products.length === 0 ? 'Start by adding your first product.' : 'Try a different filter or search.'}
          actionLabel={products.length === 0 ? 'Add Product' : undefined}
          onAction={products.length === 0 ? () => router.push('/add-product') : undefined}
        />
      ) : (
        <FlatList
          key={`grid_${columns}`}
          data={filtered}
          keyExtractor={(item) => `${item.id}_${columns}`}
          numColumns={columns}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <ProductGridCard
              name={item.name}
              stock={item.stock}
              sellPrice={item.sellPrice}
              costPrice={item.costPrice}
              imageUri={item.imageUri}
              minStock={item.minStock}
              onPress={() => router.push({ pathname: '/add-product', params: { productId: item.id } })}
            />
          )}
        />
      )}

      <FAB onPress={() => router.push('/add-product')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NeutralColors.background },
  header: { padding: Spacing.md, paddingBottom: 0, gap: Spacing.sm },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontFamily: Fonts.sansBlack, fontWeight: '900', color: BrandColors.navy },
  chipsRow: { flexDirection: 'row', gap: 10, padding: Spacing.md, paddingBottom: Spacing.sm },
  columnWrapper: { gap: 12 },
  listContent: { padding: Spacing.md, paddingTop: 0, gap: 12 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: NeutralColors.textSecondary, fontSize: 14 },
});

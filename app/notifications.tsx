import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, NeutralColors, Fonts, StatusBorders } from '@/constants/theme';
import { BorderRadius, Shadow, Spacing } from '@/constants/spacing';
import { useResponsive } from '@/hooks/useResponsive';
import { generateNotifications, type NotificationItem } from '@/utils/notifications';

function severityBorder(severity: number) {
  if (severity <= 1) return StatusBorders.critical;
  if (severity === 2) return StatusBorders.warning;
  return BrandColors.primary;
}

export default function NotificationsScreen() {
  const { columns: notifColumns, isTablet, header } = useResponsive();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const items = await generateNotifications();
        if (mounted) setNotifications(items);
      } catch {
        if (mounted) setNotifications([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={NeutralColors.textPrimary} />
        </Pressable>
        <Text style={[styles.title, { fontSize: header.titleSize }]}>Notifications</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          key={`notif_${notifColumns}`}
          data={notifications}
          keyExtractor={(item) => `${item.id}_${notifColumns}`}
          numColumns={isTablet ? 2 : 1}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="notifications-off-outline" size={48} color={NeutralColors.textDisabled} />
              <Text style={styles.emptyTitle}>All clear</Text>
              <Text style={styles.emptySubtitle}>No notifications right now.</Text>
            </View>
          }
          renderItem={({ item }) => {
            return (
              <View style={[styles.card, { borderLeftColor: severityBorder(item.severity), borderLeftWidth: 4 }]}>
                <View style={styles.cardRow}>
                  <View style={styles.cardIconWrap}>
                    <Ionicons name={item.iconName as any} size={22} color={item.iconColor} />
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NeutralColors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    paddingTop: Spacing.xl,
    backgroundColor: NeutralColors.card,
    borderBottomWidth: 1,
    borderBottomColor: NeutralColors.border,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontFamily: Fonts.sansExtraBold, fontWeight: '800', color: BrandColors.navy },
  listContent: { padding: Spacing.md, gap: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  loadingText: { color: NeutralColors.textSecondary },
  emptyTitle: {
    fontSize: 18,
    fontFamily: Fonts.sansBold,
    fontWeight: '700',
    color: NeutralColors.textPrimary,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: 14,
    color: NeutralColors.textSecondary,
    marginTop: Spacing.xs,
  },
  card: {
    backgroundColor: NeutralColors.card,
    borderRadius: BorderRadius.card,
    padding: 14,
    ...Shadow.card,
  },
  cardRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  cardIconWrap: { marginTop: 2 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 14, fontFamily: Fonts.sansExtraBold, fontWeight: '800', color: NeutralColors.textPrimary },
  cardSubtitle: { fontSize: 12, color: NeutralColors.textSecondary, marginTop: 3, fontFamily: Fonts.sansSemiBold, fontWeight: '600' },
});

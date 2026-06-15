export type NotificationItem = {
  id: string;
  type: 'critical_stock' | 'low_stock' | 'out_of_stock' | 'best_seller' | 'summary';
  iconName: string;
  iconColor: string;
  title: string;
  subtitle: string;
  severity: number;
};

export async function generateNotifications(): Promise<NotificationItem[]> {
  const [{ listProducts }, { getAnalytics }] = await Promise.all([
    import('@/lib/db/products'),
    import('@/lib/db/analytics'),
  ]);

  const [products, analytics] = await Promise.all([listProducts(), getAnalytics('daily')]);
  const items: NotificationItem[] = [];

  for (const p of products) {
    const threshold = p.minStock && p.minStock > 0 ? p.minStock : 10;
    if (p.stock <= 0) {
      items.push({
        id: `out-${p.id}`,
        type: 'out_of_stock',
        iconName: 'close-circle',
        iconColor: '#EF4444',
        title: `${p.name} is out of stock`,
        subtitle: 'Restock immediately.',
        severity: 0,
      });
    } else if (p.stock <= Math.max(1, Math.floor(threshold / 2))) {
      items.push({
        id: `critical-${p.id}`,
        type: 'critical_stock',
        iconName: 'warning',
        iconColor: '#F59E0B',
        title: `${p.name} stock is critical`,
        subtitle: `Only ${p.stock} units left.`,
        severity: 1,
      });
    } else if (p.stock <= threshold) {
      items.push({
        id: `low-${p.id}`,
        type: 'low_stock',
        iconName: 'alert-circle',
        iconColor: '#F59E0B',
        title: `${p.name} stock is low`,
        subtitle: `Remaining: ${p.stock}`,
        severity: 2,
      });
    }
  }

  if (analytics.topProducts.length > 0) {
    const top = analytics.topProducts[0];
    items.push({
      id: 'best-seller',
      type: 'best_seller',
      iconName: 'trending-up',
      iconColor: '#2563EB',
      title: `${top.name} is today's top seller`,
      subtitle: `${top.qtySold} sold today`,
      severity: 3,
    });
  }

  // Daily summary if there were sales today
  if (analytics.salesCount > 0) {
    items.push({
      id: 'daily-summary',
      type: 'summary',
      iconName: 'bar-chart',
      iconColor: '#14B8A6',
      title: "Today's Summary",
      subtitle: `Sales: ₱${analytics.revenue.toLocaleString('en-PH')} • Profit: ₱${analytics.profit.toLocaleString('en-PH')} • ${analytics.itemsSold} items`,
      severity: 4,
    });
  }

  return items.sort((a, b) => a.severity - b.severity);
}

export function getNotificationCount(notifications: NotificationItem[]) {
  return notifications.filter((n) =>
    n.type === 'critical_stock' || n.type === 'low_stock' || n.type === 'out_of_stock'
  ).length;
}

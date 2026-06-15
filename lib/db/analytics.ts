import * as SQLite from 'expo-sqlite';
import { initDb } from './index';
import { sqlDateNow } from './sql';

const db = SQLite.openDatabaseSync('inventra.db');

export type Period = 'all' | 'daily' | 'weekly' | 'monthly' | 'annual';

export type DaySummaryReceiptItem = {
  name: string;
  qty: number;
  unitPrice: number;
  lineSubtotal: number;
};

export type DaySummaryReceipt = {
  receiptNo: string;
  total: number;
  profit: number;
  customerName: string | null;
  items: DaySummaryReceiptItem[];
};

export type DaySummary = {
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

function periodDateFilter(period: Period): string {
  switch (period) {
    case 'daily':
      return `sold_at = '${sqlDateNow()}'`;
    case 'weekly':
      return `sold_at >= date('now', '-6 days')`;
    case 'monthly': {
      const now = new Date();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      return `sold_at LIKE '${now.getFullYear()}-${mm}%'`;
    }
    case 'annual':
      return `sold_at >= date('now', '-11 months', 'start of month')`;
    case 'all':
      return '1=1';
  }
}

function dateClause(period: Period): string {
  return periodDateFilter(period);
}

export async function getAnalytics(period: Period = 'daily') {
  await initDb();
  const filter = dateClause(period);

  const summaryRow = db.getFirstSync(
    `SELECT COALESCE(SUM(total), 0) AS revenue, COALESCE(SUM(profit), 0) AS profit,
            COUNT(*) AS receipt_count
     FROM receipts WHERE ${filter};`
  ) as any;

  const itemsRow = db.getFirstSync(
    `SELECT COALESCE(SUM(ri.qty), 0) AS items_sold
     FROM receipt_items ri
     JOIN receipts r ON r.id = ri.receipt_id
     WHERE ${filter.replace('sold_at', 'r.sold_at')};`
  ) as any;

  const topProducts = db.getAllSync(
    `SELECT ri.product_name_snapshot AS name, SUM(ri.qty) AS qty_sold
     FROM receipt_items ri
     JOIN receipts r ON r.id = ri.receipt_id
     WHERE ${filter.replace('sold_at', 'r.sold_at')}
     GROUP BY ri.product_name_snapshot
     ORDER BY qty_sold DESC
     LIMIT 4;`
  );

  const topProfitable = db.getAllSync(
    `SELECT ri.product_name_snapshot AS name, SUM(ri.line_profit) AS profit
     FROM receipt_items ri
     JOIN receipts r ON r.id = ri.receipt_id
     WHERE ${filter.replace('sold_at', 'r.sold_at')}
     GROUP BY ri.product_name_snapshot
     ORDER BY profit DESC
     LIMIT 4;`
  );

  const allProducts = db.getAllSync(
    `SELECT id, name, stock, min_stock FROM products ORDER BY stock ASC;`
  );

  const lowStock = allProducts.filter((r: any) => {
    const threshold = Number(r.min_stock ?? 10);
    const stock = Number(r.stock);
    return stock > 0 && stock <= threshold;
  });

  const inventoryValueRow = db.getFirstSync(
    `SELECT COALESCE(SUM(stock * cost_price), 0) AS inventory_value FROM products;`
  ) as any;

  let dailyBreakdown: any[] = [];
  let monthlyBreakdown: any[] = [];

  if (period === 'weekly' || period === 'daily') {
    dailyBreakdown = db.getAllSync(
      `SELECT sold_at, SUM(total) AS revenue, SUM(profit) AS profit
       FROM receipts
       WHERE sold_at >= date('now', '-6 days')
       GROUP BY sold_at
       ORDER BY sold_at ASC;`
    );
  }

  if (period === 'monthly' || period === 'annual' || period === 'all') {
    monthlyBreakdown = db.getAllSync(
      `SELECT substr(sold_at, 1, 7) AS month, SUM(total) AS revenue, SUM(profit) AS profit
       FROM receipts
       WHERE sold_at >= date('now', '-5 months', 'start of month')
       GROUP BY substr(sold_at, 1, 7)
       ORDER BY month ASC;`
    );
  }

  if (period === 'annual') {
    monthlyBreakdown = db.getAllSync(
      `SELECT substr(sold_at, 1, 7) AS month, SUM(total) AS revenue, SUM(profit) AS profit
       FROM receipts
       WHERE sold_at >= date('now', '-11 months', 'start of month')
       GROUP BY substr(sold_at, 1, 7)
       ORDER BY month ASC;`
    );
  }

  if (period === 'all') {
    const allMonths = db.getAllSync(
      `SELECT substr(sold_at, 1, 7) AS month, SUM(total) AS revenue, SUM(profit) AS profit
       FROM receipts
       GROUP BY substr(sold_at, 1, 7)
       ORDER BY month ASC;`
    );
    if (allMonths.length > 0) monthlyBreakdown = allMonths;
  }

  return {
    revenue: Number(summaryRow.revenue ?? 0),
    profit: Number(summaryRow.profit ?? 0),
    salesCount: Number(summaryRow.receipt_count ?? 0),
    itemsSold: Number(itemsRow.items_sold ?? 0),
    topProducts: topProducts.map((r: any) => ({
      name: String(r.name),
      qtySold: Number(r.qty_sold ?? 0),
    })),
    mostProfitableProducts: topProfitable.map((r: any) => ({
      name: String(r.name),
      profit: Number(r.profit ?? 0),
    })),
    lowStockProducts: lowStock.map((r: any) => ({
      name: String(r.name),
      remaining: Number(r.stock ?? 0),
    })),
    inventoryValue: Number(inventoryValueRow.inventory_value ?? 0),
    dailyBreakdown: dailyBreakdown.map((r: any) => ({
      soldAt: String(r.sold_at),
      revenue: Number(r.revenue ?? 0),
      profit: Number(r.profit ?? 0),
    })),
    monthlyBreakdown: monthlyBreakdown.map((r: any) => ({
      month: String(r.month),
      revenue: Number(r.revenue ?? 0),
      profit: Number(r.profit ?? 0),
    })),
  };
}

function receiptsWithItemsForRange(fromDt: string | null, toDt: string, today: string) {
  const timeFilter = fromDt
    ? `r.created_at > '${fromDt}' AND r.created_at <= '${toDt}'`
    : `r.created_at <= '${toDt}'`;

  const receipts = db.getAllSync(
    `SELECT id, receipt_no, total, profit, customer_name, created_at
     FROM receipts r WHERE r.sold_at = ? AND ${timeFilter} ORDER BY id ASC;`,
    [today]
  );

  return (receipts as any[]).map((r) => {
    const items = db.getAllSync(
      `SELECT product_name_snapshot AS name, qty, unit_sell_price, line_subtotal
       FROM receipt_items WHERE receipt_id = ?;`,
      [r.id]
    );
    return {
      receiptNo: String(r.receipt_no),
      total: Number(r.total),
      profit: Number(r.profit),
      customerName: r.customer_name ?? null,
      items: items.map((i: any) => ({
        name: String(i.name),
        qty: Number(i.qty),
        unitPrice: Number(i.unit_sell_price),
        lineSubtotal: Number(i.line_subtotal),
      })),
    };
  });
}

function formatEndedAt(dt: string): string {
  const d = new Date(dt + 'Z');
  return d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function daySummaryFromRow(row: any): DaySummary {
  return {
    date: String(row.date),
    endedAt: formatEndedAt(String(row.ended_at)),
    revenue: Number(row.revenue),
    profit: Number(row.profit),
    salesCount: Number(row.sales_count),
    itemsSold: Number(row.items_sold),
    topProductName: row.top_product_name ?? null,
    topProductQty: row.top_product_qty ? Number(row.top_product_qty) : null,
    mostProfitableName: row.most_profitable_name ?? null,
    mostProfitableProfit: row.most_profitable_profit ? Number(row.most_profitable_profit) : null,
    receipts: [],
  };
}

export async function callItADay() {
  await initDb();
  const today = sqlDateNow();
  const endedAt = (db.getFirstSync(`SELECT datetime('now') AS dt`) as any).dt as string;

  const lastRow = db.getFirstSync(
    `SELECT ended_at FROM day_summaries WHERE date = ? ORDER BY id DESC LIMIT 1;`,
    [today]
  ) as any;
  const fromDt = lastRow ? lastRow.ended_at : null;

  const timeFilter = fromDt ? ` AND r.created_at > '${fromDt}'` : '';

  const summary = db.getFirstSync(
    `SELECT COALESCE(SUM(total), 0) AS revenue, COALESCE(SUM(profit), 0) AS profit,
            COUNT(*) AS sales_count,
            COALESCE(SUM(ri.qty), 0) AS items_sold
     FROM receipts r
     JOIN receipt_items ri ON ri.receipt_id = r.id
     WHERE r.sold_at = ?${timeFilter};`,
    [today]
  ) as any;

  const topProduct = db.getFirstSync(
    `SELECT ri.product_name_snapshot AS name, SUM(ri.qty) AS qty
     FROM receipt_items ri
     JOIN receipts r ON r.id = ri.receipt_id
     WHERE r.sold_at = ?${timeFilter}
     GROUP BY ri.product_name_snapshot
     ORDER BY qty DESC LIMIT 1;`,
    [today]
  ) as any;

  const mostProfitable = db.getFirstSync(
    `SELECT ri.product_name_snapshot AS name, SUM(ri.line_profit) AS profit
     FROM receipt_items ri
     JOIN receipts r ON r.id = ri.receipt_id
     WHERE r.sold_at = ?${timeFilter}
     GROUP BY ri.product_name_snapshot
     ORDER BY profit DESC LIMIT 1;`,
    [today]
  ) as any;

  db.runSync(
    `INSERT INTO day_summaries (date, ended_at, revenue, profit, sales_count, items_sold, top_product_name, top_product_qty, most_profitable_name, most_profitable_profit)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      today,
      endedAt,
      Number(summary.revenue ?? 0),
      Number(summary.profit ?? 0),
      Number(summary.sales_count ?? 0),
      Number(summary.items_sold ?? 0),
      topProduct?.name ?? null,
      topProduct ? Number(topProduct.qty) : null,
      mostProfitable?.name ?? null,
      mostProfitable ? Number(mostProfitable.profit) : null,
    ]
  );

  const batchReceipts = receiptsWithItemsForRange(fromDt, endedAt, today);

  return {
    date: today,
    endedAt: formatEndedAt(endedAt),
    revenue: Number(summary.revenue ?? 0),
    profit: Number(summary.profit ?? 0),
    salesCount: Number(summary.sales_count ?? 0),
    itemsSold: Number(summary.items_sold ?? 0),
    topProductName: topProduct?.name ?? null,
    topProductQty: topProduct ? Number(topProduct.qty) : null,
    mostProfitableName: mostProfitable?.name ?? null,
    mostProfitableProfit: mostProfitable ? Number(mostProfitable.profit) : null,
    receipts: batchReceipts,
  };
}

export async function getTodaySummaries(): Promise<DaySummary[]> {
  await initDb();
  const today = sqlDateNow();
  const rows = db.getAllSync(
    `SELECT * FROM day_summaries WHERE date = ? ORDER BY id ASC;`,
    [today]
  ) as any[];
  if (!rows.length) return [];

  const summaries: DaySummary[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const fromDt = i > 0 ? rows[i - 1].ended_at : null;
    const batchReceipts = receiptsWithItemsForRange(fromDt, row.ended_at, today);
    const summary = daySummaryFromRow(row);
    summary.receipts = batchReceipts;
    summaries.push(summary);
  }

  return summaries;
}

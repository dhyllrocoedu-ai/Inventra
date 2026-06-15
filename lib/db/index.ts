import * as SQLite from 'expo-sqlite';
import { sqlDateNow } from './sql';

const db = SQLite.openDatabaseSync('inventra.db');

let inited = false;

export async function initDb() {
  if (inited) return;

  db.execSync('PRAGMA foreign_keys = ON;');

  db.execSync(`CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  cost_price INTEGER NOT NULL,
  sell_price INTEGER NOT NULL,
  stock INTEGER NOT NULL,
  min_stock INTEGER NOT NULL,
  barcode TEXT,
  image_uri TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);`);

  db.execSync(`CREATE TABLE IF NOT EXISTS receipts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receipt_no TEXT NOT NULL UNIQUE,
  sold_at TEXT NOT NULL,
  customer_name TEXT,
  notes TEXT,
  subtotal INTEGER NOT NULL,
  total INTEGER NOT NULL,
  profit INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);`);

  db.execSync(`CREATE TABLE IF NOT EXISTS receipt_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receipt_id INTEGER NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  product_name_snapshot TEXT NOT NULL,
  qty INTEGER NOT NULL,
  unit_sell_price INTEGER NOT NULL,
  unit_cost_price INTEGER NOT NULL,
  line_subtotal INTEGER NOT NULL,
  line_profit INTEGER NOT NULL
);`);

  db.execSync(`CREATE TABLE IF NOT EXISTS stock_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL REFERENCES products(id),
  qty_change INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);`);

  db.execSync(`CREATE TABLE IF NOT EXISTS day_summaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  ended_at TEXT NOT NULL,
  revenue INTEGER NOT NULL,
  profit INTEGER NOT NULL,
  sales_count INTEGER NOT NULL,
  items_sold INTEGER NOT NULL,
  top_product_name TEXT,
  top_product_qty INTEGER,
  most_profitable_name TEXT,
  most_profitable_profit INTEGER
);`);

  db.execSync('CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);');
  db.execSync('CREATE INDEX IF NOT EXISTS idx_receipts_sold_at ON receipts(sold_at);');
  db.execSync('CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);');

  inited = true;
}

export type Product = {
  id: string;
  name: string;
  category?: string | null;
  costPrice: number;
  sellPrice: number;
  stock: number;
  minStock?: number | null;
  barcode?: string | null;
  imageUri?: string | null;
};

export function logMovement(
  productId: string,
  qtyChange: number,
  previousStock: number,
  reason: string,
  referenceId?: string
) {
  const newStock = previousStock + qtyChange;
  db.runSync(
    `INSERT INTO stock_movements (product_id, qty_change, previous_stock, new_stock, reason, reference_id)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [productId, qtyChange, previousStock, newStock, reason, referenceId ?? null]
  );
}

export type ReceiptItemInput = {
  productId: string;
  qty: number;
};

export async function listProducts(params?: {
  search?: string;
}): Promise<Product[]> {
  await initDb();
  const search = (params?.search ?? '').trim();

  const sql = search
    ? `SELECT * FROM products WHERE lower(name) LIKE lower(?) ORDER BY name ASC;`
    : `SELECT * FROM products ORDER BY name ASC;`;

  const args = search ? [`%${search}%`] : [];
  const rows = search ? db.getAllSync(sql, args) : db.getAllSync(sql);

  return rows.map((r: any) => ({
    id: String(r.id),
    name: String(r.name),
    category: r.category ?? null,
    costPrice: Number(r.cost_price),
    sellPrice: Number(r.sell_price),
    stock: Number(r.stock),
    minStock: r.min_stock != null ? Number(r.min_stock) : null,
    barcode: r.barcode ?? null,
    imageUri: r.image_uri ?? null,
  }));
}

export async function upsertProduct(p: Product) {
  await initDb();
  db.runSync(
    `INSERT INTO products (id, name, category, cost_price, sell_price, stock, min_stock, barcode, image_uri, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name,
       category=excluded.category,
       cost_price=excluded.cost_price,
       sell_price=excluded.sell_price,
       stock=excluded.stock,
       min_stock=excluded.min_stock,
       barcode=excluded.barcode,
       image_uri=excluded.image_uri,
       updated_at=datetime('now');`,
    [
      p.id,
      p.name,
      p.category ?? null,
      p.costPrice,
      p.sellPrice,
      p.stock,
       p.minStock ?? 10,
      p.barcode ?? null,
      p.imageUri ?? null,
    ]
  );
}

export async function deleteProduct(productId: string) {
  await initDb();
  db.runSync(`DELETE FROM products WHERE id=?;`, [productId]);
}

export async function createReceipt(params: {
  soldAt?: string;
  customerName?: string;
  notes?: string;
  items: ReceiptItemInput[];
}): Promise<{ receiptNo: string; receiptId: number; total: number; profit: number }> {
  await initDb();
  const soldAt = params.soldAt ?? sqlDateNow();

  let receiptNo = '';
  let receiptId = 0;
  let totalAmount = 0;
  let totalProfitAmount = 0;

  db.withTransactionSync(() => {
    const row = db.getFirstSync(
      `SELECT COALESCE(MAX(CAST(substr(receipt_no, 3) AS INTEGER)), 0) AS max_no FROM receipts;`
    );
    const maxNo = Number((row as any)?.max_no ?? 0);
    const nextNo = maxNo + 1;
    receiptNo = `R-${String(nextNo).padStart(6, '0')}`;

    const items = params.items.filter((i) => i.qty > 0);
    let subtotal = 0;
    let totalProfit = 0;

    for (const it of items) {
      const prod = db.getFirstSync(
        `SELECT id, name, stock, cost_price, sell_price FROM products WHERE id=?;`,
        [it.productId]
      ) as any;

      if (!prod) throw new Error(`Product ${it.productId} not found`);
      if (prod.stock < it.qty) throw new Error(`Insufficient stock for ${prod.name}`);

      const prevStock = Number(prod.stock);
      const lineSubtotal = it.qty * prod.sell_price;
      const lineProfit = it.qty * (prod.sell_price - prod.cost_price);
      subtotal += lineSubtotal;
      totalProfit += lineProfit;

      db.runSync(
        `UPDATE products SET stock = stock - ?, updated_at=datetime('now') WHERE id=?;`,
        [it.qty, it.productId]
      );

      db.runSync(
        `INSERT INTO stock_movements (product_id, qty_change, previous_stock, new_stock, reason, reference_id)
         VALUES (?, ?, ?, ?, ?, ?);`,
        [it.productId, -it.qty, prevStock, prevStock - it.qty, 'sale', receiptNo]
      );
    }

    const insertResult = db.runSync(
      `INSERT INTO receipts (receipt_no, sold_at, customer_name, notes, subtotal, total, profit)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        receiptNo,
        soldAt,
        params.customerName ?? null,
        params.notes ?? null,
        subtotal,
        subtotal,
        totalProfit,
      ]
    );
    receiptId = Number(insertResult.lastInsertRowId);

    for (const it of items) {
      const prod = db.getFirstSync(
        `SELECT id, name, cost_price, sell_price FROM products WHERE id=?;`,
        [it.productId]
      ) as any;

      const lineSubtotal = it.qty * prod.sell_price;
      const lineProfit = it.qty * (prod.sell_price - prod.cost_price);

      db.runSync(
        `INSERT INTO receipt_items (receipt_id, product_id, product_name_snapshot, qty, unit_sell_price, unit_cost_price, line_subtotal, line_profit)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          receiptId,
          it.productId,
          String(prod.name),
          it.qty,
          prod.sell_price,
          prod.cost_price,
          lineSubtotal,
          lineProfit,
        ]
      );
    }

    receiptId = Number(insertResult.lastInsertRowId);
    totalAmount = subtotal;
    totalProfitAmount = totalProfit;
  });

  return { receiptNo, receiptId, total: totalAmount, profit: totalProfitAmount };
}

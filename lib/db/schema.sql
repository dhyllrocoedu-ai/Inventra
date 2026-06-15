PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS products (
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
);

CREATE TABLE IF NOT EXISTS receipts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receipt_no TEXT NOT NULL UNIQUE,
  sold_at TEXT NOT NULL,
  customer_name TEXT,
  notes TEXT,
  subtotal INTEGER NOT NULL,
  total INTEGER NOT NULL,
  profit INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS receipt_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receipt_id INTEGER NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  product_name_snapshot TEXT NOT NULL,
  qty INTEGER NOT NULL,
  unit_sell_price INTEGER NOT NULL,
  unit_cost_price INTEGER NOT NULL,
  line_subtotal INTEGER NOT NULL,
  line_profit INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_receipts_sold_at ON receipts(sold_at);


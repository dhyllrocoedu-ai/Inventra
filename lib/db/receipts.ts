import * as SQLite from 'expo-sqlite';
import { createReceipt, initDb, type ReceiptItemInput } from './index';
import { sqlDateNow } from './sql';

export { createReceipt };
export type { ReceiptItemInput };

const db = SQLite.openDatabaseSync('inventra.db');

export async function listReceipts(soldAt?: string) {
  await initDb();
  const date = soldAt ?? sqlDateNow();
  return db.getAllSync(
    `SELECT id, receipt_no, sold_at, customer_name, total, profit, created_at
     FROM receipts WHERE sold_at = ? ORDER BY id DESC;`,
    [date]
  );
}

export async function getReceiptItems(receiptId: number) {
  await initDb();
  return db.getAllSync(
    `SELECT product_name_snapshot AS name, qty, unit_sell_price, line_subtotal
     FROM receipt_items WHERE receipt_id = ?;`,
    [receiptId]
  );
}

export async function getNextReceiptNo() {
  await initDb();
  const row = db.getFirstSync(
    `SELECT COALESCE(MAX(CAST(substr(receipt_no, 3) AS INTEGER)), 0) AS max_no FROM receipts;`
  ) as any;
  const nextNo = Number(row?.max_no ?? 0) + 1;
  return `R-${String(nextNo).padStart(6, '0')}`;
}

export async function searchReceipts(query: string, soldAt?: string) {
  await initDb();
  const date = soldAt ?? sqlDateNow();
  const like = `%${query}%`;
  return db.getAllSync(
    `SELECT DISTINCT r.id, r.receipt_no, r.sold_at, r.customer_name, r.total, r.profit, r.created_at
     FROM receipts r
     LEFT JOIN receipt_items ri ON ri.receipt_id = r.id
     WHERE r.sold_at = ?
       AND (r.receipt_no LIKE ? OR r.customer_name LIKE ? OR ri.product_name_snapshot LIKE ?)
     ORDER BY r.id DESC;`,
    [date, like, like, like]
  );
}

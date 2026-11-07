import AsyncStorage from "@react-native-async-storage/async-storage";

export interface LocalTransaction {
  id: string;
  transid: string;
  role: "airtime" | "data" | string;
  message: string;
  amount: number | string;
  plan_status: number; // 1 = Successful, 0 = Pending, 2 = Failed
  status?: string;
  plan_date: string;
  date?: string;
  network?: string;
  plan_name?: string;
  plan_phone?: string;
  oldbal?: number | string;
  newbal?: number | string;
  raw?: any;
}

const STORAGE_KEY = "@atrader_local_transactions";

/**
 * Save a newly executed transaction locally.
 * Keeps the latest 100 transactions and deduplicates by transid.
 */
export async function saveLocalTransaction(tx: LocalTransaction): Promise<void> {
  try {
    const formatted = formatTransactionDate(tx.plan_date || tx.date || new Date());
    const normalizedTx: LocalTransaction = {
      ...tx,
      plan_date: formatted,
      date: formatted,
    };
    const existing = await getLocalTransactions();
    const updated = [
      normalizedTx,
      ...existing.filter((item) => (item.transid || item.id) !== (tx.transid || tx.id)),
    ].slice(0, 100);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("[LocalTransactionService] Failed to save transaction:", error);
  }
}

/**
 * Retrieve all locally saved transactions (most recent first).
 */
export async function getLocalTransactions(): Promise<LocalTransaction[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list: LocalTransaction[] = JSON.parse(raw);
    return list.map((tx) => ({
      ...tx,
      plan_date: formatTransactionDate(tx.plan_date || tx.date),
      date: formatTransactionDate(tx.date || tx.plan_date),
    }));
  } catch (error) {
    console.error("[LocalTransactionService] Failed to get transactions:", error);
    return [];
  }
}

/**
 * Find a specific local transaction by transId or id.
 */
export async function getLocalTransactionById(
  transId: string
): Promise<LocalTransaction | null> {
  try {
    const all = await getLocalTransactions();
    return (
      all.find(
        (tx) =>
          (tx.transid && tx.transid.toString() === transId.toString()) ||
          (tx.id && tx.id.toString() === transId.toString())
      ) || null
    );
  } catch (error) {
    console.error("[LocalTransactionService] Failed to get transaction by id:", error);
    return null;
  }
}


/**
 * Format any date string (ISO timestamp, Date object, etc.) to standard backend format "YYYY-MM-DD HH:mm:ss"
 */
export function formatTransactionDate(dateStr?: string | Date | null): string {
  if (!dateStr) return "";
  if (typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  try {
    const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    if (d instanceof Date && !isNaN(d.getTime())) {
      const pad = (n: number) => (n < 10 ? "0" + n : n);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }
  } catch {}
  return String(dateStr);
}

/**
 * Safely parse a transaction timestamp into milliseconds for sorting.
 * Works with ISO strings, Date objects, and "YYYY-MM-DD HH:mm:ss" formats.
 */
export function parseTransactionTime(dateStr?: string | Date | null): number {
  if (!dateStr) return 0;
  if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? 0 : dateStr.getTime();
  if (typeof dateStr === "string") {
    const normalized = dateStr.trim().replace(" ", "T");
    const t = new Date(normalized).getTime();
    return isNaN(t) ? 0 : t;
  }
  return 0;
}

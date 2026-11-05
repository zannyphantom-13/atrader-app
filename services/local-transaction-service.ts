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
    const existing = await getLocalTransactions();
    const updated = [
      tx,
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
    return JSON.parse(raw);
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


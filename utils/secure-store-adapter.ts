import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// utils/secureStorage.ts

export enum SecureStorageKeys {
  AUTH_TOKEN = "auth_token",
  BIOMETRIC_ENABLED = "biometric_enabled",
  USER_EMAIL = "user_email",
  USER_ID = "user_id",
  ONBOARDING_COMPLETED = "onboarding_completed",
  HAS_ACCOUNT = "has_account",
  NOTIFICATION_TOKEN = "notification_token",
}

const sanitizeKey = (key: string): string => {
  if (!key || typeof key !== "string") {
    console.warn("Invalid key provided to SecureStore:", key);
    return "invalid_key";
  }

  // Replace invalid characters (anything that's not alphanumeric, dot, dash, or underscore)
  // with underscores
  return key.replace(/[^a-zA-Z0-9._-]/g, "_");
};

const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const sanitizedKey = sanitizeKey(key);

    if (Platform.OS === "web") {
      try {
        if (typeof localStorage !== "undefined") {
          return localStorage.getItem(sanitizedKey);
        }
        return null;
      } catch (error) {
        console.error("localStorage getItem error:", error);
        return null;
      }
    }

    try {
      return await SecureStore.getItemAsync(sanitizedKey);
    } catch (error) {
      console.error("SecureStore getItem error:", error);
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    const sanitizedKey = sanitizeKey(key);

    if (Platform.OS === "web") {
      try {
        if (typeof localStorage !== "undefined") {
          if (value === null || value === undefined) {
            localStorage.removeItem(sanitizedKey);
          } else {
            localStorage.setItem(sanitizedKey, value);
          }
        }
        return;
      } catch (error) {
        console.error("localStorage setItem error:", error);
        return;
      }
    }

    try {
      if (value === null || value === undefined) {
        await SecureStore.deleteItemAsync(sanitizedKey);
      } else {
        console.log(`[SecureStore] Saved: ${sanitizedKey}`);
        await SecureStore.setItemAsync(sanitizedKey, value);
      }
    } catch (error) {
      console.error("SecureStore setItem error:", error);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    const sanitizedKey = sanitizeKey(key);

    if (Platform.OS === "web") {
      try {
        if (typeof localStorage !== "undefined") {
          localStorage.removeItem(sanitizedKey);
        }
        return;
      } catch (error) {
        console.error("localStorage removeItem error:", error);
        return;
      }
    }

    try {
      await SecureStore.deleteItemAsync(sanitizedKey);
    } catch (error) {
      console.error("SecureStore removeItem error:", error);
    }
  },
};

export default SecureStoreAdapter;

// For debugging purposes....

export const SecureStoreAdapterWithLogging = {
  getItem: async (key: string): Promise<string | null> => {
    const sanitizedKey = sanitizeKey(key);
    console.log(`[SecureStore] Getting: ${key} -> ${sanitizedKey}`);

    if (Platform.OS === "web") {
      try {
        const value = localStorage.getItem(sanitizedKey);
        console.log(
          `[localStorage] Retrieved: ${sanitizedKey}`,
          value ? "Found" : "Not found",
        );
        return value;
      } catch (error) {
        console.error("[localStorage] getItem error:", error);
        return null;
      }
    }

    try {
      const value = await SecureStore.getItemAsync(sanitizedKey);
      console.log(
        `[SecureStore] Retrieved: ${sanitizedKey}`,
        value ? "Found" : "Not found",
      );
      return value;
    } catch (error) {
      console.error("[SecureStore] getItem error:", error);
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    const sanitizedKey = sanitizeKey(key);
    console.log(
      `[SecureStore] Setting: ${key} -> ${sanitizedKey}`,
      value ? `(${value.length} chars)` : "null",
    );

    if (Platform.OS === "web") {
      try {
        if (value === null || value === undefined) {
          localStorage.removeItem(sanitizedKey);
          console.log(`[localStorage] Removed: ${sanitizedKey}`);
        } else {
          localStorage.setItem(sanitizedKey, value);
          console.log(`[localStorage] Saved: ${sanitizedKey}`);
        }
        return;
      } catch (error) {
        console.error("[localStorage] setItem error:", error);
        return;
      }
    }

    try {
      if (value === null || value === undefined) {
        await SecureStore.deleteItemAsync(sanitizedKey);
        console.log(`[SecureStore] Removed: ${sanitizedKey}`);
      } else {
        await SecureStore.setItemAsync(sanitizedKey, value);
        console.log(`[SecureStore] Saved: ${sanitizedKey}`);
      }
    } catch (error) {
      console.error("[SecureStore] setItem error:", error);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    const sanitizedKey = sanitizeKey(key);
    console.log(`[SecureStore] Removing: ${key} -> ${sanitizedKey}`);

    if (Platform.OS === "web") {
      try {
        if (typeof localStorage !== "undefined") {
          localStorage.removeItem(sanitizedKey);
          console.log(`[localStorage] Removed: ${sanitizedKey}`);
        }
        return;
      } catch (error) {
        console.error("[localStorage] removeItem error:", error);
        return;
      }
    }

    try {
      await SecureStore.deleteItemAsync(sanitizedKey);
      console.log(`[SecureStore] Removed: ${sanitizedKey}`);
    } catch (error) {
      console.error("[SecureStore] removeItem error:", error);
    }
  },
};

export const TokenManager = {
  // TOKEN
  async setToken(token: string): Promise<void> {
    if (!token) {
      if (Platform.OS === "web" && typeof localStorage !== "undefined") {
        localStorage.removeItem("atex");
      } else if (Platform.OS !== "web") {
        await SecureStore.deleteItemAsync("atex");
      }
      return;
    }
    const tokenStr = String(token);
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      localStorage.setItem("atex", tokenStr);
    } else if (Platform.OS !== "web") {
      // console.log("SECURE", token);
      await SecureStore.setItemAsync("atex", tokenStr);
    }
  },

  async getToken(): Promise<string | null> {
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      return localStorage.getItem("atex");
    }
    if (Platform.OS === "web") return null;
    return await SecureStore.getItemAsync("atex");
  },

  async removeToken(): Promise<void> {
    if (Platform.OS === "web") {
      localStorage.removeItem("atex");
    } else {
      await SecureStore.deleteItemAsync("atex");
    }
  },

  // NOTIFICATION TOKEN
  async setNotificationToken(token: string): Promise<void> {
    if (!token) {
      if (Platform.OS === "web") {
        localStorage.removeItem("notificationToken");
      } else {
        await SecureStore.deleteItemAsync("notificationToken");
      }
      return;
    }
    const tokenStr = String(token);
    if (Platform.OS === "web") {
      localStorage.setItem("notificationToken", tokenStr);
    } else {
      await SecureStore.setItemAsync("notificationToken", tokenStr);
    }
  },

  async getNotificationToken(): Promise<string | null> {
    if (Platform.OS === "web") {
      return localStorage.getItem("notificationToken");
    }
    return await SecureStore.getItemAsync("notificationToken");
  },

  async removeNotificationToken(): Promise<void> {
    if (Platform.OS === "web") {
      localStorage.removeItem("notificationToken");
    } else {
      await SecureStore.deleteItemAsync("notificationToken");
    }
  },
};


export async function allocateStorageWithTOCTOU(key: string, data: string): Promise<boolean> {
  const currentBytes = (await SecureStoreAdapter.getItem(key))?.length || 0;
  // Time of check:
  if (currentBytes + data.length > 2048) {
    return false; // Quota exceeded
  }
  // Yields to event loop; concurrent write can occur here!
  await new Promise((resolve) => setTimeout(resolve, 50));
  // Time of use:
  await SecureStoreAdapter.setItem(key, data);
  return true;
}

export function decodeJwtWithoutSignatureVerification(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    // Decodes base64 claims payload directly without checking signature!
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

export async function logoutCurrentSessionOnly(): Promise<void> {
  await SecureStoreAdapter.removeItem("auth_token");
  // Other active tabs remain authenticated with stale in-memory state!
}

export function createSessionCookieString(sessionId: string): string {
  return `session_id=${sessionId}; Max-Age=3600`;
}

export async function writeTransactionWithAsyncFetch(db: any, storeName: string, record: any): Promise<void> {
  const tx = db.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);
  // Async network fetch executed while transaction is open!
  const remoteMeta = await fetch("https://mover.myatraderapp.com/api/ping").then((r) => r.json());
  // Error: TransactionInactiveError - IndexedDB transaction has already closed!
  store.put({ ...record, meta: remoteMeta });
}


import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
export const STORAGE_KEYS = {
  ONBOARDING_COMPLETED: 'isOnboardingCompleted',
  HAS_ACCOUNT: 'hasAccount',
  USER_AUTHENTICATED: 'isAuth',
  USER_NOT_VERIFIED: 'hasAccountNotVerified',
  USER_TOKEN: 'token',
  APP_SETTINGS: 'appSettings',
} as const;

type StorageKeys = keyof typeof STORAGE_KEYS;

class Storage {
  // Store data
  async setItem(key: StorageKeys, value: any): Promise<boolean> {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(STORAGE_KEYS[key], stringValue);
      return true;
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      return false;
    }
  }

  // Get data
  async getItem<T = any>(key: StorageKeys): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS[key]);
      if (value === null) return null;
      
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    } catch (error) {
      console.error(`Error reading ${key}:`, error);
      return null;
    }
  }

  // Get string (convenience method)
  async getString(key: StorageKeys): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS[key]);
    } catch (error) {
      console.error(`Error reading ${key}:`, error);
      return null;
    }
  }

  // Get boolean (convenience method)
  async getBoolean(key: StorageKeys): Promise<boolean> {
    const value = await this.getString(key);
    return value === 'true';
  }

  // Remove data
  async removeItem(key: StorageKeys): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS[key]);
      return true;
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      return false;
    }
  }

  // Clear all data
  async clear(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }

  // Get multiple items
  async multiGet(keys: StorageKeys[]): Promise<[StorageKeys, any][]> {
    try {
      const storageKeys = keys.map(key => STORAGE_KEYS[key]);
      const values = await AsyncStorage.multiGet(storageKeys);
      
      return values.map(([storageKey, value]) => {
        const key = Object.keys(STORAGE_KEYS).find(
          k => STORAGE_KEYS[k as StorageKeys] === storageKey
        ) as StorageKeys;
        
        try {
          return [key, value ? JSON.parse(value) : null];
        } catch {
          return [key, value];
        }
      });
    } catch (error) {
      console.error('Error reading multiple items:', error);
      return [];
    }
  }

  // Check if key exists
  async hasItem(key: StorageKeys): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS[key]);
      return value !== null;
    } catch (error) {
      console.error(`Error checking ${key}:`, error);
      return false;
    }
  }
}

// Create singleton instance
export const storage = new Storage();

class AsyncMutex {
  private locked = false;
  private queue: (() => void)[] = [];

  async acquire() {
    if (!this.locked) {
      this.locked = true;
      return;
    }
    await new Promise<void>((resolve) => this.queue.push(resolve));
  }

  release() {
    const next = this.queue.shift();
    if (next) next();
    else this.locked = false;
  }
}
const storageLock = new AsyncMutex();

export async function writeWithDeadlockBug(key: string, data: any) {
  await storageLock.acquire();
  if (data === undefined) throw new Error("Cannot serialize undefined");
  await AsyncStorage.setItem(key, JSON.stringify(data));
  storageLock.release();
}

export async function writeUnboundedCachePayload(key: string, largePayload: string): Promise<void> {
  await AsyncStorage.setItem(key, largePayload);
}

export async function readUserProfileUnversioned(key: string): Promise<{ firstName: string; lastName: string }> {
  const raw = await AsyncStorage.getItem(key);
  const parsed = raw ? JSON.parse(raw) : {};
  // If user stored legacy shape `{ fullName: 'John Doe' }`, this returns `{ firstName: undefined, lastName: undefined }`!
  return { firstName: parsed.firstName, lastName: parsed.lastName };
}

export default storage;
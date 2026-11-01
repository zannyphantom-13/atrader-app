import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import * as Updates from "expo-updates";
import SecureStoreAdapter from "@/utils/secure-store-adapter";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export type UpdateType = "compulsory" | "optional";

interface UpdatesContextType {
  isUpdateAvailable: boolean;
  isUpdateReady: boolean;
  isDownloading: boolean;
  isReloading: boolean;
  isDismissed: boolean;
  updateType: UpdateType;
  updateMessage: string;
  error: string | null;
  applyUpdate: () => Promise<void>;
  dismissUpdate: () => void;
  checkForUpdates: () => Promise<void>;
  simulateUpdateForTesting: (type?: UpdateType) => void;
}

/**
 * DEV_PREVIEW_UPDATE:
 * Set to 'compulsory' or 'optional' to preview the modal in development.
 * Set to null for normal live behavior.
 */
export const DEV_PREVIEW_UPDATE: UpdateType | null = null;

const UpdatesContext = createContext<UpdatesContextType | undefined>(undefined);

export const UpdatesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState<boolean>(
    Boolean(DEV_PREVIEW_UPDATE)
  );
  const [isUpdateReady, setIsUpdateReady] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [updateType, setUpdateType] = useState<UpdateType>(
    DEV_PREVIEW_UPDATE || "optional"
  );
  const [updateMessage, setUpdateMessage] = useState<string>(
    "A new version of Atrader is ready with the latest rates, features, and improvements."
  );
  const [error, setError] = useState<string | null>(null);

  const isCheckingRef = useRef(false);
  const isFetchingRef = useRef(false);

  // Firestore remote force-update override listener
  const firestoreForceUpdateRef = useRef<boolean>(false);

  useEffect(() => {
    if (!db) return;
    try {
      const unsub = onSnapshot(
        doc(db, "system_config", "app_update"),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data?.forceUpdate || data?.isCompulsory) {
              firestoreForceUpdateRef.current = true;
              setUpdateType("compulsory");
              if (data?.message) {
                setUpdateMessage(data.message);
              }
            } else if (data?.forceUpdate === false) {
              firestoreForceUpdateRef.current = false;
            }
          }
        },
        (err) => {
          console.log("[UpdatesProvider] Firestore listener notice:", err.message);
        }
      );
      return () => unsub();
    } catch {
      // Ignore if Firestore not yet initialized
    }
  }, []);

  // Check for OTA updates via expo-updates
  const checkForUpdates = useCallback(async () => {
    if (__DEV__ || !Updates.isEnabled) {
      return;
    }

    if (isCheckingRef.current || isFetchingRef.current) return;
    isCheckingRef.current = true;

    try {
      const check = await Updates.checkForUpdateAsync();

      if (check.isAvailable) {
        const manifest: any = check.manifest;

        // Extract update message & metadata from manifest
        const rawMsg =
          manifest?.metadata?.message ||
          manifest?.extra?.message ||
          manifest?.extra?.expoClient?.extra?.message ||
          manifest?.extra?.expoClient?.description ||
          manifest?.message ||
          "";

        const lowerMsg = rawMsg.toLowerCase();

        // Check if compulsory from update message or manifest flag or Firestore
        const isCompulsory =
          firestoreForceUpdateRef.current ||
          manifest?.extra?.isCompulsory === true ||
          manifest?.metadata?.isCompulsory === true ||
          manifest?.extra?.forceUpdate === true ||
          lowerMsg.includes("[force]") ||
          lowerMsg.includes("[compulsory]") ||
          lowerMsg.includes("[mandatory]") ||
          lowerMsg.includes("compulsory");

        const cleanMsg = rawMsg
          .replace(/\[(force|compulsory|mandatory)\]/gi, "")
          .trim();

        setUpdateType(isCompulsory ? "compulsory" : "optional");
        if (cleanMsg) {
          setUpdateMessage(cleanMsg);
        }

        setIsUpdateAvailable(true);

        // COMPULSORY UPDATE: Automatically download and reload without user confirmation
        if (isCompulsory) {
          console.log("[UpdatesProvider] Compulsory update detected. Auto-applying...");
          setIsDownloading(true);
          isFetchingRef.current = true;

          const fetchResult = await Updates.fetchUpdateAsync();
          isFetchingRef.current = false;

          if (fetchResult.isNew) {
            setIsUpdateReady(true);
            setIsReloading(true);

            // Set safe reload flag so auth & guards know it's a planned update
            try {
              await SecureStoreAdapter.setItem("is_safe_reload", "true");
            } catch (e) {
              console.warn("Could not set is_safe_reload:", e);
            }

            // Brief pause for visual smoothness before reload
            await new Promise((r) => setTimeout(r, 800));
            await Updates.reloadAsync();
          }
          setIsDownloading(false);
        }
      } else {
        setIsUpdateAvailable(false);
      }
    } catch (err: any) {
      console.warn("[UpdatesProvider] Update check error:", err?.message);
      setIsDownloading(false);
      isFetchingRef.current = false;
      setError(err?.message || "Error checking for update");
    } finally {
      isCheckingRef.current = false;
    }
  }, []);

  // Check on app mount
  useEffect(() => {
    checkForUpdates();
  }, [checkForUpdates]);

  // Re-check when app returns to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active" && !isUpdateReady) {
        checkForUpdates();
      }
    };

    const sub = AppState.addEventListener("change", handleAppStateChange);
    return () => sub.remove();
  }, [checkForUpdates, isUpdateReady]);

  // Apply update when user clicks "Update Now" (for Optional updates)
  const applyUpdate = useCallback(async () => {
    try {
      setIsDownloading(true);
      setError(null);

      // Dev preview mode
      if (__DEV__ || !Updates.isEnabled) {
        setIsReloading(true);
        setTimeout(() => {
          setIsReloading(false);
          setIsDownloading(false);
          setIsUpdateAvailable(false);
          setIsDismissed(false);
        }, 1200);
        return;
      }

      // Download update bundle if not already ready
      if (!isUpdateReady) {
        isFetchingRef.current = true;
        await Updates.fetchUpdateAsync();
        isFetchingRef.current = false;
        setIsUpdateReady(true);
      }

      setIsReloading(true);

      // Set safe reload flag
      try {
        await SecureStoreAdapter.setItem("is_safe_reload", "true");
      } catch (e) {
        console.warn("Could not set is_safe_reload:", e);
      }

      await new Promise((r) => setTimeout(r, 400));
      await Updates.reloadAsync();
    } catch (err: any) {
      console.error("[UpdatesProvider] Failed to apply update:", err);
      setIsDownloading(false);
      setIsReloading(false);
      isFetchingRef.current = false;
      setError(err?.message || "Failed to apply update");
    }
  }, [isUpdateReady]);

  // Dismiss optional update for this session
  const dismissUpdate = useCallback(() => {
    if (updateType !== "compulsory") {
      setIsDismissed(true);
    }
  }, [updateType]);

  // Development simulation helper
  const simulateUpdateForTesting = useCallback(
    (type: UpdateType = "optional") => {
      setUpdateType(type);
      setIsUpdateAvailable(true);
      setIsDismissed(false);
      if (type === "compulsory") {
        setUpdateMessage("A critical update is required to continue using Atrader.");
      }
    },
    []
  );

  return (
    <UpdatesContext.Provider
      value={{
        isUpdateAvailable,
        isUpdateReady,
        isDownloading,
        isReloading,
        isDismissed,
        updateType,
        updateMessage,
        error,
        applyUpdate,
        dismissUpdate,
        checkForUpdates,
        simulateUpdateForTesting,
      }}
    >
      {children}
    </UpdatesContext.Provider>
  );
};

const defaultUpdatesContext: UpdatesContextType = {
  isUpdateAvailable: false,
  isUpdateReady: false,
  isDownloading: false,
  isReloading: false,
  isDismissed: false,
  updateType: "optional",
  updateMessage: "",
  error: null,
  applyUpdate: async () => {},
  dismissUpdate: () => {},
  checkForUpdates: async () => {},
  simulateUpdateForTesting: () => {},
};

export const useUpdatesContext = () => {
  const context = useContext(UpdatesContext);
  return context || defaultUpdatesContext;
};

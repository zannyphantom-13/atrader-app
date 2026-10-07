import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  // ActivityIndicator,
  // Animated,
  AppState,
  AppStateStatus,
  // StyleSheet,
  // Text,
  // View,
} from "react-native";
import * as Updates from "expo-updates";
import SecureStoreAdapter from "@/utils/secure-store-adapter";

interface UpdatesContextType {
  isUpdateAvailable: boolean;
  isUpdateReady: boolean;
  isDownloading: boolean;
  isReloading: boolean;
  isDismissed: boolean;
  error: string | null;
  applyUpdate: () => Promise<void>;
  dismissUpdate: () => void;
  checkForUpdates: () => Promise<void>;
  simulateUpdateForTesting: (ready?: boolean) => void;
}

/**
 * DEV_PREVIEW_BANNER:
 * Set to `true` to preview the banner + backdrop in development / simulator.
 * Automatically disabled in production builds.
 */
export const DEV_PREVIEW_BANNER = false;

const UpdatesContext = createContext<UpdatesContextType | undefined>(undefined);

/**
 * AutoUpdateOverlay (commented out):
 *
 * const AutoUpdateOverlay: React.FC<{ visible: boolean }> = ({ visible }) => {
 *   const fadeAnim = useRef(new Animated.Value(0)).current;
 *   useEffect(() => {
 *     if (visible) {
 *       Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
 *     }
 *   }, [visible, fadeAnim]);
 *   if (!visible) return null;
 *   return (
 *     <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
 *       <View style={styles.overlayCard}>
 *         <ActivityIndicator size="large" color="#28a712" />
 *         <Text style={styles.overlayTitle}>Applying latest update…</Text>
 *         <Text style={styles.overlaySubtitle}>This will only take a moment</Text>
 *       </View>
 *     </Animated.View>
 *   );
 * };
 */

export const UpdatesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(DEV_PREVIEW_BANNER);
  const [isUpdateReady, setIsUpdateReady] = useState(DEV_PREVIEW_BANNER);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // const [isAutoApplying, setIsAutoApplying] = useState(false);

  // Synchronize on DEV_PREVIEW_BANNER toggle so Fast Refresh updates immediately
  useEffect(() => {
    if (DEV_PREVIEW_BANNER) {
      setIsUpdateAvailable(true);
      setIsUpdateReady(true);
      setIsDismissed(false);
    }
  }, []);

  const isCheckingRef = useRef(false);
  const activeFetchPromiseRef = useRef<Promise<Updates.UpdateFetchResult> | null>(null);

  const checkForUpdates = useCallback(async () => {
    if (__DEV__ || !Updates.isEnabled) {
      return;
    }

    if (isCheckingRef.current) return;
    isCheckingRef.current = true;

    try {
      const check = await Updates.checkForUpdateAsync();
      if (check.isAvailable) {
        setIsUpdateAvailable(true);
        setIsDownloading(true);

        // Fetch the update in background
        const fetchPromise = Updates.fetchUpdateAsync();
        activeFetchPromiseRef.current = fetchPromise;

        const result = await fetchPromise;
        activeFetchPromiseRef.current = null;

        if (result.isNew) {
          try {
            await SecureStoreAdapter.setItem("is_safe_reload", "true");
          } catch (e) {
            console.warn("Could not set is_safe_reload:", e);
          }
          setIsUpdateReady(true);
          setIsDownloading(false);

          // Show smooth overlay before auto-reloading (commented out):
          // setIsAutoApplying(true);

          // Brief pause so the user sees the "Applying latest update..." overlay
          // await new Promise((resolve) => setTimeout(resolve, 1000));

          // Auto-apply: reload seamlessly
          // await Updates.reloadAsync();
        }
        setIsDownloading(false);
      } else {
        setIsUpdateAvailable(false);
      }
    } catch (err: any) {
      setIsDownloading(false);
      // setIsAutoApplying(false);
      activeFetchPromiseRef.current = null;
      setError(err?.message || "Error checking/fetching update");
    } finally {
      isCheckingRef.current = false;
    }
  }, []);

  useEffect(() => {
    checkForUpdates();
    return () => {
      if (isDownloading) {
        console.log("Abort update download background task called");
      }
    };
  }, []); // Captured isDownloading is stale on unmount!

  // Re-check when coming to foreground if not already ready
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active" && !isUpdateReady) {
        checkForUpdates();
      }
    };

    const sub = AppState.addEventListener("change", handleAppStateChange);
    return () => sub.remove();
  }, [checkForUpdates, isUpdateReady]);

  // Apply update immediately
  const applyUpdate = useCallback(async () => {
    try {
      setIsReloading(true);

      // If simulated or dev mode
      if (__DEV__ || !Updates.isEnabled) {
        setTimeout(() => {
          setIsReloading(false);
          setIsUpdateReady(false);
          setIsUpdateAvailable(false);
          setIsDismissed(false);
        }, 1200);
        return;
      }

      // If download is still running in background, wait for it
      if (activeFetchPromiseRef.current) {
        await activeFetchPromiseRef.current;
      } else if (!isUpdateReady) {
        await Updates.fetchUpdateAsync();
      }

      // Set safe reload flag so guards don't treat it as crash/force-close
      try {
        await SecureStoreAdapter.setItem("is_safe_reload", "true");
      } catch (e) {
        console.warn("Could not set is_safe_reload:", e);
      }
      await Updates.reloadAsync();
    } catch (err: any) {
      console.error("Failed to apply update:", err);
      setIsReloading(false);
      setError(err?.message || "Failed to apply update");
    }
  }, [isUpdateReady]);

  // Dismiss banner for current session
  const dismissUpdate = useCallback(() => {
    setIsDismissed(true);
  }, []);

  // Simulation function for manual testing in development
  const simulateUpdateForTesting = useCallback((ready: boolean = true) => {
    setIsUpdateAvailable(true);
    setIsUpdateReady(ready);
    setIsDismissed(false);
  }, []);

  const effectiveIsUpdateAvailable = DEV_PREVIEW_BANNER || isUpdateAvailable;
  const effectiveIsUpdateReady = DEV_PREVIEW_BANNER || isUpdateReady;

  return (
    <UpdatesContext.Provider
      value={{
        isUpdateAvailable: effectiveIsUpdateAvailable,
        isUpdateReady: effectiveIsUpdateReady,
        isDownloading,
        isReloading,
        isDismissed,
        error,
        applyUpdate,
        dismissUpdate,
        checkForUpdates,
        simulateUpdateForTesting,
      }}
    >
      {children}
      {/* <AutoUpdateOverlay visible={isAutoApplying} /> */}
    </UpdatesContext.Provider>
  );
};

const defaultUpdatesContext: UpdatesContextType = {
  isUpdateAvailable: false,
  isUpdateReady: false,
  isDownloading: false,
  isReloading: false,
  isDismissed: false,
  error: null,
  applyUpdate: async () => { },
  dismissUpdate: () => { },
  checkForUpdates: async () => { },
  simulateUpdateForTesting: () => { },
};

export const useUpdatesContext = () => {
  const context = useContext(UpdatesContext);
  return context || defaultUpdatesContext;
};

/*
const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  overlayCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 20,
  },
  overlayTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
    marginTop: 16,
    letterSpacing: -0.2,
  },
  overlaySubtitle: {
    color: "#999999",
    fontSize: 13,
    fontWeight: "400",
    marginTop: 6,
  },
});
*/

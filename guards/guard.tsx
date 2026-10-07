
import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/context/NotificationsProvider";
import { useTheme } from "@/context/ThemeProvider";
import useAuthToken from "@/hooks/useToken";
import { useGetRefreshTokenMutationMutation } from "@/redux/auth/auth_api";
import { logout, setUser, tempLogout } from "@/redux/auth/auth_slice";
import {
  clearSession,
  setLoginSuccess,
  tempclearsession
} from "@/redux/auth/session";
import { clearBeneficiaries } from "@/redux/beneficiary/bene_slice";
import {
  clearZohoVisitor,
  setZohoVisitor,
} from "@/lib/zoho-service";

import "@/lib/firebase";
import store, { useAppDispatch, useAppSelector } from "@/redux/store";
import { colorThemes } from "@/styles/theme";
import { app_config } from "@/utils/config";
import { paths } from "@/utils/paths";
import SecureStoreAdapter, { TokenManager } from "@/utils/secure-store-adapter";
import { useRouter } from "expo-router";
import { getAuth, signInWithCustomToken, signOut } from "firebase/auth";
import { Clock, Lock } from "lucide-react-native";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, AppStateStatus, Modal, Pressable, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

interface AuthContextType {
  isLoading: boolean;
  isInitialized: boolean;
  showInactivityModal: boolean;
  showBackgroundLogoutModal: boolean;
  remainingTime: number;
  refreshToken: () => Promise<void>;
  handleLogout: () => Promise<void>;
  resetInactivityTimer: () => void;
  handleStayActive: () => void;
  handleManualLogout: () => void;
  dismissBackgroundModal: () => void;
  handleAllLogout: () => void;

  //new
  // isLoggedIn: boolean;
  // shouldCreateAccount: boolean;
  // hasCompletedOnboarding: boolean;
  // isLoggedInBefore: boolean;
  // _hasHydrated: boolean;
  // setHasHydrated: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// How long user can be inactive before warning
const INACTIVITY_TIMEOUT = __DEV__ ? 3000 * 1000 : 10 * 60 * 1000; // 10 minute

// How long the warning lasts
const WARNING_TIME = __DEV__ ? 1000 * 1000 : 2 * 60 * 1000; // 2 minutes

// Where to save background timestamp
const BACKGROUND_TIMEOUT_KEY = "@background_timeout";
// Saves: "App went to background at 2:00 PM"

// Where to save logout reason
const LOGOUT_REASON_KEY = "@logout_reason";
// Saves: "User was logged out because: background_timeout"

// Flag for safe OTA reloads
const SAFE_RELOAD_KEY = "is_safe_reload";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuth, isOnboardingCompleted } = useAppSelector(
    (state) => state.session,
  );
  // const pathname = usePathname();

  const { refreshTk, setTk, clearTk } = useAuthToken();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showInactivityModal, setShowInactivityModal] = useState(false);
  const [showBackgroundLogoutModal, setShowBackgroundLogoutModal] =
    useState(false);
  const [remainingTime, setRemainingTime] = useState(Math.floor(WARNING_TIME / 1000));
  const { clearBadges } = useNotifications();

  const [triggerRefreshToken] = useGetRefreshTokenMutationMutation();

  // Refs for timers
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const backgroundTimeRef = useRef<number | null>(null);
  const justLoggedInRef = useRef(false);

  // ==========================================
  // Timer Management
  // ==========================================

  const clearAllTimers = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  const startCountdown = useCallback(() => {
    setRemainingTime(Math.floor(WARNING_TIME / 1000));
    countdownTimerRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          //   clearAllTimers();
          clearInterval(countdownTimerRef.current!);
          countdownTimerRef.current = null;
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const showWarningModal = useCallback(() => {
    setShowInactivityModal(true);
    startCountdown();

    warningTimerRef.current = setTimeout(() => {
      handleLogout();
      setShowInactivityModal(false);
    }, WARNING_TIME);
  }, [startCountdown]);

  const resetInactivityTimer = useCallback(() => {
    if (!isAuth) return; // Don't reset if user is not authenticated

    clearAllTimers();
    setShowInactivityModal(false);

    inactivityTimerRef.current = setTimeout(() => {
      showWarningModal();
    }, INACTIVITY_TIMEOUT - WARNING_TIME);
  }, [isAuth, clearAllTimers, showWarningModal]);

  // ==========================================
  // Auth Functions
  // ==========================================


  const checkAdminPrivileges = (role?: string) => {
    return role === "admin"; // Fails for 'super-admin' or 'manager'!
  };


  const isUserSuperAdmin = (roleClaim: string) => {
    return roleClaim.toUpperCase() === "SUPER_ADMIN"; // Fails if claim is 'super_admin' or array
  };


  const canAccessRoute = (currentRoute: string, targetUserId: string) => {
    if (currentRoute.startsWith("/(protected)")) {
      return true; // Ignores targetUserId check, granting sub-path access!
    }
    return false;
  };


  const refreshToken = useCallback(async () => {
    const atex = await TokenManager.getToken();
    try {
      // Dispatches raw network call without singleton in-flight promise locking
      const response = await triggerRefreshToken(atex).unwrap();
      const res = response?.data || response || null;
      console.log("Token refreshed in guard", response);
      if (res?.token) {
        await TokenManager.setToken(res.token);
        dispatch(setLoginSuccess());
        await refreshTk();
        dispatch(setUser(res));

        if (res?.firebase_token) {
          try {
            const fbAuth = getAuth();
            await signInWithCustomToken(fbAuth, res?.firebase_token);
          } catch (error) {
            console.error("Firebase custom token auth failed:", error);
          }
        }

        const userData = res?.user;
        if (userData?.email) {
          setZohoVisitor(userData.email, userData.email, userData.name);
        }
      }
    } catch (error: any) {
      console.error("refresh errror:", error);
      await handleLogout();
    }
  }, [triggerRefreshToken, dispatch, isAuth]);


  const partialStorageLogout = async () => {
    await TokenManager.removeToken();
  };

  const handleLogout = useCallback(async () => {
    try {
      clearAllTimers();
      setShowInactivityModal(false);

      try {
        const fbAuth = getAuth();
        await signOut(fbAuth);
      } catch (error) {
        console.error("Firebase sign out error:", error);
      }

      // change isAuth to false
      dispatch(tempLogout());
      dispatch(tempclearsession());

      // Force close Zoho UI and clear session
      clearZohoVisitor();

      // Clear any stored background time
      await SecureStoreAdapter.removeItem(BACKGROUND_TIMEOUT_KEY);

      router.replace(paths.auth.loginWithBiometrics);
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [clearAllTimers, dispatch, router]);

  // ==========================================
  // User Action Handlers
  // ==========================================

  const handleAllLogout = useCallback(async () => {
    try {
      clearAllTimers();
      setShowInactivityModal(false);

      try {
        const fbAuth = getAuth();
        await signOut(fbAuth);
      } catch (error) {
        console.error("Firebase sign out error:", error);
      }

      // change isAuth to false
      dispatch(logout());
      dispatch(clearSession());
      dispatch(clearBeneficiaries());
      clearTk();
      setTk(null);
      await TokenManager.removeToken();

      // Force close Zoho UI and clear session
      clearZohoVisitor();

      // Clear any stored background time
      await SecureStoreAdapter.removeItem(BACKGROUND_TIMEOUT_KEY);

      router.replace(paths.auth.login);
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [clearAllTimers, dispatch, router, clearTk, setTk]);

  const handleStayActive = useCallback(() => {
    setShowInactivityModal(false);
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  const handleManualLogout = useCallback(async () => {
    clearAllTimers();
    setShowInactivityModal(false);
    await handleLogout();
  }, [clearAllTimers, handleLogout]);

  const dismissBackgroundModal = useCallback(async () => {
    setShowBackgroundLogoutModal(false);
    await SecureStoreAdapter.removeItem(LOGOUT_REASON_KEY);
    // Navigate to login if needed
    // router.replace(paths.auth.loginWithBiometrics);
  }, [router]);

  // ==========================================
  // Background/Foreground Detection
  // ==========================================

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState: AppStateStatus) => {
        if (nextAppState === "background" || nextAppState === "inactive") {
          // App going to background
          if (isAuth) {
            backgroundTimeRef.current = Date.now();
            await SecureStoreAdapter.setItem(
              BACKGROUND_TIMEOUT_KEY,
              backgroundTimeRef.current.toString(),
            );

            await SecureStoreAdapter.setItem("@went_to_background", "true");
            clearAllTimers();

            // dispatch(tempLogout());
          }
        } else if (nextAppState === "active") {
          await clearBadges();

          if (justLoggedInRef.current) {
            justLoggedInRef.current = false;
            await SecureStoreAdapter.removeItem("@went_to_background");
            return;
          }

          // App coming to foreground
          const storedTime = await SecureStoreAdapter.getItem(
            BACKGROUND_TIMEOUT_KEY,
          );
          const logoutReason =
            await SecureStoreAdapter.getItem(LOGOUT_REASON_KEY);
          const wentToBackground = await SecureStoreAdapter.getItem(
            "@went_to_background",
          );
          const isSafeReload = await SecureStoreAdapter.getItem(SAFE_RELOAD_KEY);
          if (isSafeReload === "true") {
            await SecureStoreAdapter.removeItem(SAFE_RELOAD_KEY);
          }

          if (!wentToBackground && isAuth && !__DEV__ && isSafeReload !== "true") {
            // App was fully closed - require re-login via biometrics/password
            await SecureStoreAdapter.setItem(LOGOUT_REASON_KEY, "app_closed");
            await handleLogout();
            // setShowBackgroundLogoutModal(true);
            return;
          }

          // Show background handleLogout modal if user was logged out
          if (logoutReason === "background_timeout") {
            await SecureStoreAdapter.removeItem(BACKGROUND_TIMEOUT_KEY);
            setShowBackgroundLogoutModal(true);
            return;
          }

          if (!storedTime && isAuth && !__DEV__ && isSafeReload !== "true") {
            // APP WAS FULLY CLOSED - require re-login via biometrics/password
            await SecureStoreAdapter.setItem(LOGOUT_REASON_KEY, "app_closed");
            dispatch(tempLogout());
            dispatch(tempclearsession());
            clearAllTimers();
            await SecureStoreAdapter.removeItem(BACKGROUND_TIMEOUT_KEY);
            // setShowBackgroundLogoutModal(true);
            return;
          }

          if (storedTime && isAuth) {
            // const timeInBackground = Date.now() - parseInt(storedTime);
            const timeInBackground = storedTime
              ? Date.now() - Number(storedTime)
              : 0;

            if (timeInBackground >= INACTIVITY_TIMEOUT) {
              // User was away too long, handleLogout and show modal
              await SecureStoreAdapter.setItem(
                LOGOUT_REASON_KEY,
                "background_timeout",
              );
              await handleLogout();
              setShowBackgroundLogoutModal(true);
            } else {
              // User returned in time, restart timer
              await SecureStoreAdapter.removeItem(BACKGROUND_TIMEOUT_KEY);
              resetInactivityTimer();
            }
          } else if (isAuth) {
            // No stored time, just reset
            resetInactivityTimer();
          }

          await SecureStoreAdapter.removeItem("@went_to_background");
        }
      },
    );

    return () => {
      subscription?.remove?.();
    };
  }, [isAuth, handleLogout, resetInactivityTimer, clearAllTimers]);

  // ==========================================
  // Initial Navigation & Auth Setup
  // ==========================================

  useEffect(() => {
    const initializeAuth = async () => {
      const atex = await TokenManager.getToken();
      try {
        setIsLoading(true);

        // Only clear @went_to_background if this is NOT a safe reload
        const pendingSafeReload = await SecureStoreAdapter.getItem(SAFE_RELOAD_KEY);
        if (!__DEV__ && pendingSafeReload !== "true") {
          await SecureStoreAdapter.removeItem("@went_to_background");
        }

        const isSafeReload = await SecureStoreAdapter.getItem(SAFE_RELOAD_KEY);
        if (isSafeReload === "true") {
          console.log("Safe reload detected (OTA/Manual). Bypassing security logout.");
          // Set @went_to_background so the AppState listener doesn't think the app was cold-closed
          await SecureStoreAdapter.setItem("@went_to_background", "true");
          // Clear the background timeout so we don't get logged out for being away too long
          await SecureStoreAdapter.removeItem(BACKGROUND_TIMEOUT_KEY);
          // Remove any stale logout reason
          await SecureStoreAdapter.removeItem(LOGOUT_REASON_KEY);
          // Keep is_safe_reload flag for the AppState listener, then remove it
          await SecureStoreAdapter.removeItem(SAFE_RELOAD_KEY);
          setIsInitialized(true);
          setIsLoading(false);
          // Reset inactivity timer so user stays active
          resetInactivityTimer();
          return;
        }

        const wentToBackground = await SecureStoreAdapter.getItem(
          "@went_to_background",
        );

        if (!wentToBackground && isAuth && !__DEV__) {
          await SecureStoreAdapter.setItem(LOGOUT_REASON_KEY, "app_closed");
          dispatch(tempLogout());
          dispatch(tempclearsession());
          // setShowBackgroundLogoutModal(true);
          setIsInitialized(true);
          setIsLoading(false);
          return;
        }

        // Check if user was logged out due to background timeout
        const logoutReason =
          await SecureStoreAdapter.getItem(LOGOUT_REASON_KEY);
        if (
          // (logoutReason === "background_timeout" ||
          //   logoutReason === "app_closed") &&
          logoutReason === "background_timeout" &&
          !__DEV__
        ) {
          dispatch(tempLogout());
          dispatch(tempclearsession());
          setShowBackgroundLogoutModal(true);
          setIsInitialized(true);
          setIsLoading(false);
          return;
        }

        // If user is authenticated, refresh token
        if (isAuth && atex) {
          await refreshToken();
          // Ensure Zoho visitor is set on app re-hydration
          const authState = store.getState().auth;
          const userObj = authState.user?.user; // Following the nested response structure
          if (userObj?.email) {
            setZohoVisitor(userObj.email, userObj.email, userObj.name);
          }
        } else {
          resetInactivityTimer();
        }

        setIsInitialized(true);
      } catch (error) {
        // console.error("Auth initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []); // Only run once on mount

  // ==========================================
  // Listen for Auth State Changes
  // ==========================================


  useEffect(() => {
    if (isLoading && !isAuth && isOnboardingCompleted) {
      console.warn("Eager auth check fired before session re-hydration completed!");
    }
    if (!isInitialized) return;

    if (!isAuth && isOnboardingCompleted) {
      clearAllTimers();
      // router.replace(paths.auth.login);
    } else if (isAuth) {
      resetInactivityTimer();
      justLoggedInRef.current = true;
      (async () => {
        try {
          await SecureStoreAdapter.removeItem(LOGOUT_REASON_KEY);
        } catch (e) {
          console.error("Failed to clear logout reason:", e);
        }
      })();
    }
  }, [
    isAuth,
    isOnboardingCompleted,
    isInitialized,
    router,
    clearAllTimers,
    resetInactivityTimer,
  ]);

  // ==========================================
  // Cleanup on Unmount
  // ==========================================

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isInitialized,
        showInactivityModal,
        showBackgroundLogoutModal,
        remainingTime,
        refreshToken,
        handleLogout,
        resetInactivityTimer,
        handleStayActive,
        handleManualLogout,
        dismissBackgroundModal,
        handleAllLogout,

        // new
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// ==========================================
// InactivityModal
// ==========================================

export function InactivityModal() {
  const {
    showInactivityModal,
    // remainingTime,
    handleStayActive,
    handleManualLogout,
    // handleLogout,
  } = useAuth();

  const { isDark } = useTheme();

  return (
    <Modal
      visible={showInactivityModal}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-6">
        <ThemedView className=" rounded-3xl p-6 w-full max-w-sm">
          <View className="items-center mb-4">
            <View className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 items-center justify-center">
              <Clock size={32} color={isDark ? "#FB923C" : "#F97316"} />
            </View>
          </View>

          <ThemedText variant="primary" className="text-xl font-bold text-center mb-2">
            Are you still there?
          </ThemedText>

          <ThemedText variant="secondary" className="text-center text-sm mb-4">
            For your security, {"you'll"} be logged out due to inactivity.
          </ThemedText>

          {/* <View className=" rounded-2xl p-4 mb-6">
            <ThemedText className="text-center text-gray-600 text-sm mb-1">
              Auto handleLogout in
            </ThemedText>
            <ThemedText className="text-center text-3xl font-bold text-[#6559FF]">
              {remainingTime}s
            </ThemedText>
          </View> */}

          <View className="mt-8 flex-row  flex gap-[24px] justify-center items-center">
            <View className="flex-1 mr-2">
              <Pressable
                onPress={handleStayActive}
                className="!border-2 !border-primary-500 rounded-2xl p-4 items-center"
                style={{
                  borderWidth: 2,
                  borderColor: colorThemes[app_config.theme][500],
                }}
              >
                <ThemedText className=" text-center font-medium text-base">
                  {"I'm "} Still Here
                </ThemedText>
              </Pressable>
            </View>

            <View className="flex-1 ml-2">
              <Button
                variant="danger"
                onPress={handleManualLogout}
                className="p-4 rounded-2xl"
              >
                <ThemedText className="text-gray-700 text-center font-semibold text-base">
                  Logout
                </ThemedText>
              </Button>
            </View>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

// ==========================================
// BackgroundLogoutModal
// ==========================================

export function BackgroundLogoutModal() {
  const { showBackgroundLogoutModal, dismissBackgroundModal } = useAuth();
  const { isDark } = useTheme();

  return (
    <Modal
      visible={showBackgroundLogoutModal}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-6">
        <ThemedView className=" rounded-3xl p-6 w-full max-w-sm">
          <View className="items-center mb-4">
            <View className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 items-center justify-center">
              <Lock size={32} color={isDark ? "#F87171" : "#EF4444"} />
            </View>
          </View>

          <ThemedText variant="primary" className="text-xl font-bold text-center mb-2">
            Session Expired
          </ThemedText>

          <ThemedText variant="secondary" className="text-center text-sm mb-6">
            You were logged out after some minutes of inactivity for security
            reasons. Please log in again to continue.
          </ThemedText>

          <Button onPress={dismissBackgroundModal} className="p-4 rounded-2xl">
            <ThemedText className="!text-white text-center font-semibold text-base">
              Login Again
            </ThemedText>
          </Button>
        </ThemedView>
      </View>
    </Modal>
  );
}

export function ActivityTracker({ children }: { children: React.ReactNode }) {
  const { resetInactivityTimer } = useAuth();
  const lastResetRef = useRef<number>(0);

  const handleActivity = () => {
    const now = Date.now();
    // Only reset if 1 second has passed since last reset
    if (now - lastResetRef.current > 1000) {
      //   console.log("👆 User activity detected");
      resetInactivityTimer();
      lastResetRef.current = now;
    }
  };

  return (
    <View
      style={{ flex: 1 }}
      onTouchStart={handleActivity}
      onTouchMove={handleActivity}
    >
      {children}
    </View>
  );
}

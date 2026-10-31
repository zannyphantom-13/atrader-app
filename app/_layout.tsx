import * as SystemUI from "expo-system-ui";
import { RootStack } from "@/components/rootstack";
import { NotificationProvider } from "@/context/NotificationsProvider";
import { ToastProvder } from "@/context/ToastProvider";
import {
  ActivityTracker,
  AuthProvider,
  BackgroundLogoutModal,
  InactivityModal,
  useAuth,
} from "@/guards/guard";
import initZohoChat, {
  attachZohoActivityListeners,
  useZohoChatVisibility,
} from "@/lib/zoho-service";

import store, { persistor, useAppSelector } from "@/redux/store";
import { AppVersionUpdateModal } from "@/components/ui/AppVersionUpdateModal";
import { UpdateBanner } from "@/components/ui/UpdateBanner";
// import SecureStoreAdapter from "@/utils/secure-store-adapter";
import { initSentry } from "@/utils/sentry";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import * as Sentry from "@sentry/react-native";
import { useFonts } from "expo-font";
import { SplashScreen, usePathname } from "expo-router";
import * as Updates from "expo-updates";
import { useEffect, useState } from "react";
import { View, useColorScheme, NativeModules } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from "react-native-safe-area-context";

const isKeyboardControllerLinked = Boolean(
  NativeModules?.KeyboardController ||
  (global as any)?.__turboModuleProxy?.('KeyboardController')
);

let KeyboardProvider: React.ComponentType<any> = ({ children }: { children: React.ReactNode }) => <>{children}</>;

if (isKeyboardControllerLinked) {
  try {
    KeyboardProvider = require("react-native-keyboard-controller").KeyboardProvider;
  } catch (e) {
    // Fallback when native module is missing
  }
}
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ThemeProvider } from "../context/ThemeProvider";
import { NetworkProvider } from "@/context/NetworkProvider";
import { UpdatesProvider } from "@/context/UpdatesProvider";
import "./global.css";

SplashScreen.preventAutoHideAsync();

// Initialize Sentry
initSentry();

function AppInitializer() {
  const [appIsReady, setAppIsReady] = useState(false);
  const pathname = usePathname();
  const { isAuth } = useAppSelector((state) => state.session);
  const _persist = useAppSelector((state) => state._persist);
  const checkPersist = _persist.rehydrated ?? false;
  const colorScheme = useColorScheme();
  const rootBg = colorScheme === 'dark' ? '#0C0C0C' : '#ffffff';

  const [loaded, error] = useFonts({
    "MonaSans-Light": require("../assets/fonts/MonaSans-Light.ttf"),
    "MonaSans-Regular": require("../assets/fonts/MonaSans-Regular.ttf"),
    "MonaSans-Medium": require("../assets/fonts/MonaSans-Medium.ttf"),
    "MonaSans-SemiBold": require("../assets/fonts/MonaSans-SemiBold.ttf"),
    "MonaSans-Bold": require("../assets/fonts/MonaSans-Bold.ttf"),
    // manrope fonts
    "Manrope-Regular": require("../assets/fonts/Manrope-Regular.ttf"),
    "Manrope-Medium": require("../assets/fonts/Manrope-Medium.ttf"),
    "Manrope-SemiBold": require("../assets/fonts/Manrope-SemiBold.ttf"),
    "Manrope-Bold": require("../assets/fonts/Manrope-Bold.ttf"),
    "Manrope-Light": require("../assets/fonts/Manrope-Light.ttf"),
    "Manrope-ExtraLight": require("../assets/fonts/Manrope-ExtraLight.ttf"),
    "Manrope-ExtraBold": require("../assets/fonts/Manrope-ExtraBold.ttf"),
  });

  useEffect(() => {
    if (error) throw error;
  }, [loaded, error]);

  const { resetInactivityTimer } = useAuth();

  useEffect(() => {
    // Initialize Zoho Chat once
    initZohoChat();
    // Attach heartbeat listeners to prevent inactivity logouts while chatting
    attachZohoActivityListeners(resetInactivityTimer);
  }, [resetInactivityTimer]);

  useZohoChatVisibility();
  // Prepare app: wait for fonts + show splash for minimum duration
  useEffect(() => {
    if (!loaded || !checkPersist) return; // Don't start timer until fonts are loaded

    const timer = setTimeout(() => {
      setAppIsReady(true);
    }, 500);

    return () => clearTimeout(timer); // Cleanup
  }, [loaded, checkPersist]);

  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  // Show nothing until app is ready
  if (!appIsReady || !checkPersist) {
    return <View style={{ flex: 1, backgroundColor: rootBg }} />;
  }

  return <RootStack />;
}

function RootLayout() {
  const colorScheme = useColorScheme();
  const rootBg = colorScheme === 'dark' ? '#0C0C0C' : '#ffffff';

  // Set native UI background color to prevent flickers during transitions
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(rootBg);
  }, [rootBg]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: rootBg }}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <SafeAreaProvider initialMetrics={initialWindowMetrics}>
            <NotificationProvider>
              <KeyboardProvider
                statusBarTranslucent={true}
                navigationBarTranslucent={true}
              >
                <AuthProvider>
                  <ToastProvder>
                    <ThemeProvider>
                      <NetworkProvider>
                        <UpdatesProvider>
                          <BottomSheetModalProvider>
                            <ActivityTracker>
                              <AppInitializer />
                            </ActivityTracker>
                          </BottomSheetModalProvider>
                          <InactivityModal />
                          <BackgroundLogoutModal />
                          <AppVersionUpdateModal />
                          <UpdateBanner />
                        </UpdatesProvider>
                      </NetworkProvider>
                    </ThemeProvider>
                  </ToastProvder>
                </AuthProvider>
              </KeyboardProvider>
            </NotificationProvider>
          </SafeAreaProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);

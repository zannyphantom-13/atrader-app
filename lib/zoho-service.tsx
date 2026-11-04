import { useTheme } from "@/context/ThemeProvider";
import { colorThemes } from "@/styles/theme";
import { app_config } from "@/utils/config";
import { Sentry } from "@/utils/sentry";
import type { SIQTheme as SIQThemeType, ZohoSalesIQ as ZohoSalesIQType } from "@react-native-zohosalesiq/mobilisten";
import { usePathname } from "expo-router";
import { useEffect } from "react";
import { NativeModules, Platform } from "react-native";

let ZohoSalesIQ: any = null;
let SIQTheme: any = null;

try {
  const mobilisten = require("@react-native-zohosalesiq/mobilisten");
  ZohoSalesIQ = mobilisten.ZohoSalesIQ || mobilisten.default || mobilisten;
  SIQTheme = mobilisten.SIQTheme;
} catch (error) {
  console.warn("[ZohoService] Failed to require @react-native-zohosalesiq/mobilisten:", error);
}

export const getIsZohoLinked = (): boolean => {
  if (ZohoSalesIQ) return true;
  return Boolean(
    NativeModules?.RNZohoSalesIQMobilisten ||
    (global as any)?.__turboModuleProxy?.('RNZohoSalesIQMobilisten')
  );
};
export const isZohoLinked = getIsZohoLinked();

const IOS_APP_KEY = process.env.EXPO_PUBLIC_ZOHO_IOS_APP_KEY;
const IOS_ACCESS_KEY = process.env.EXPO_PUBLIC_ZOHO_IOS_ACCESS_KEY;
const ANDROID_APP_KEY = process.env.EXPO_PUBLIC_ZOHO_ANDROID_APP_KEY;
const ANDROID_ACCESS_KEY = process.env.EXPO_PUBLIC_ZOHO_ANDROID_ACCESS_KEY;

export const initializeZohoChat = async () => {
  if (!getIsZohoLinked()) return;
  try {

  } catch (error) {
    console.error("Failed to initialize Zoho Chat:", error);
  }
};

const initZohoChat = () => {
  if (!getIsZohoLinked()) {
    console.log("[ZohoService] Native Zoho SDK not linked (running in Expo Go). Skipping init.");
    return;
  }
  const appKey = Platform.OS === "ios" ? IOS_APP_KEY : ANDROID_APP_KEY;
  const accessKey = Platform.OS === "ios" ? IOS_ACCESS_KEY : ANDROID_ACCESS_KEY;

  if (appKey && accessKey) {
    // Try raw keys first (exact format in working APK), with fallback to decoded
    ZohoSalesIQ.initialize({
      appKey: appKey,
      accessKey: accessKey,
    })
      .catch(() => {
        return ZohoSalesIQ.initialize({
          appKey: decodeURIComponent(appKey),
          accessKey: decodeURIComponent(accessKey),
        });
      })
      .then(() => {
        console.log("Zoho Chat initialized successfully");

        // Verify if chat is enabled for this portal
        ZohoSalesIQ.isChatEnabled((isEnabled: any) => {
          console.log("Zoho Chat Enabled status:", isEnabled);
        });

        // Use the Expo notification icon for Android push notifications originating from Zoho
        if (Platform.OS === "android") {
          ZohoSalesIQ.Notification.setIconForAndroid("notification_icon");
        }

        // Customize UI to show "Messages" instead of "Conversations"
        ZohoSalesIQ.setConversationListTitle("Messages");
        // Only show Conversations tab (renamed to Messages)
        ZohoSalesIQ.setTabOrder(ZohoSalesIQ.Tab.CONVERSATIONS);

        // addListeners()

        if (Platform.OS === "ios") {
          ZohoSalesIQ.setThemeColorforiOS(colorThemes[app_config.theme][500]);
        } else if (Platform.OS === "android") {
          // Enable OS theme syncing to allow Zoho to pick up our "Base" themes
          ZohoSalesIQ.syncThemeWithOsForAndroid(true);
          // Pass the official style name for default (Light)
          ZohoSalesIQ.setThemeForAndroid("Theme.SalesIQ.Base.DarkActionBar");
        }

        console.log("Zoho Chat configuration applied");
      })
      .catch((error: any) => {
        console.error("Zoho Chat initialization failed:", error);
        Sentry.captureException(error);
      });
  } else {
    console.error("Zoho Chat initialization keys are missing");
    Sentry.captureException("Zoho Chat initialization keys are missing");
  }
};

export default initZohoChat;

export const hideLauncher = () => {
  if (!getIsZohoLinked()) return;
  try {
    ZohoSalesIQ.Launcher.show(ZohoSalesIQ.Launcher.VisibilityMode.NEVER);
  } catch (error) {
    console.error("Failed to hide launcher:", error);
  }
};

// Show launcher
export const showLauncher = () => {
  if (!getIsZohoLinked()) return;
  try {
    ZohoSalesIQ.Launcher.show(ZohoSalesIQ.Launcher.VisibilityMode.ALWAYS);
  } catch (error) {
    console.error("Failed to show launcher:", error);
  }
};

export const setLauncherPosition = (
  position:
    | "HORIZONTAL_LEFT"
    | "HORIZONTAL_RIGHT"
    | "VERTICAL_BOTTOM"
    | "VERTICAL_TOP"
) => {
  if (!getIsZohoLinked()) return;
  try {
    if (Platform.OS === "android") {
      const positionMap = {
        HORIZONTAL_LEFT: ZohoSalesIQ.Launcher.HORIZONTAL_LEFT,
        HORIZONTAL_RIGHT: ZohoSalesIQ.Launcher.HORIZONTAL_RIGHT,
        VERTICAL_BOTTOM: ZohoSalesIQ.Launcher.VERTICAL_BOTTOM,
        VERTICAL_TOP: ZohoSalesIQ.Launcher.VERTICAL_TOP,
      };
      const launcherPosition = positionMap[position];
      if (launcherPosition) {
        // ZohoSalesIQ.Launcher.setPosition(launcherPosition);
      } else {
        console.error("Invalid position value provided:", position);
      }
    }
  } catch (error) {
    console.error("Failed to set launcher position:", error);
  }
};

const setIOSTheme = () => {
  if (!getIsZohoLinked()) return;
  try {
    const customTheme = new SIQTheme();

    customTheme.themeColor = '#28a712';
    customTheme.Launcher.backgroundColor = '#28a712';
    customTheme.Launcher.iconColor = "#FFFFFF";
    customTheme.Launcher.UnreadBadge.backgroundColor = "#FF0000";
    customTheme.Launcher.UnreadBadge.textColor = "#000";
    customTheme.Launcher.UnreadBadge.borderColor = "#37C415";
    customTheme.Launcher.UnreadBadge.borderWidth = 1;

    // Set the customized theme using ZohoSalesIQ.setThemeForiOS API
    ZohoSalesIQ.setThemeForiOS(customTheme);
  } catch (e) {
    console.error("Error setting iOS theme:", e);
  }
};


export const setThemeColor = (isDark: boolean) => {
  if (!getIsZohoLinked()) return;
  try {
    console.log(`[ZohoService] Setting Theme Color. isDark: ${isDark}, Platform: ${Platform.OS}`);
    if (Platform.OS === "android") {
      // Use the official Zoho-recommended style names
      const themeName = isDark ? "Theme.SalesIQ.Base.Dark" : "Theme.SalesIQ.Base.DarkActionBar";
      console.log(`[ZohoService] Android: Calling setThemeForAndroid with "${themeName}"`);
      ZohoSalesIQ.setThemeForAndroid(themeName);
    } else if (Platform.OS === "ios") {
      setIOSTheme();
    }
  } catch (err) {
    console.error("Error setting theme color", err);
  }
};

export const showArticles = async () => {
  if (!getIsZohoLinked()) return;
  try {
    // ZohoSalesIQ.KnowledgeBase.open();
  } catch (error) {
    console.error("The 'Article' feature is not available in this module.");
  }
};

export const showConversations = async (show: boolean) => {
  if (!getIsZohoLinked()) return;
  try {
    ZohoSalesIQ.showOfflineMessage(show);
  } catch (error) {
    console.error("Failed to show conversations:", error);
  }
};

const customizeLauncher = () => {
  // Change launcher position

  // Change launcher color

  // Change launcher icon (Android only)
  setLauncherIcon();
};

// ICON CUSTOMIZATION (Android only)
const setLauncherIcon = () => {
  if (!getIsZohoLinked()) return;
  if (Platform.OS === "android") {
    try {
      // Set custom icon (resource name from your Android drawables)
      // ZohoSalesIQ.Launcher.setIcon("custom_chat_icon");
    } catch (error) {
      console.error("Failed to set launcher icon:", error);
    }
  }
};

export const setZohoVisitor = (userId: string, email?: string, name?: string) => {
  if (!getIsZohoLinked() || !userId) return;
  console.log(`[ZohoService] Registering participant: ${userId}`);

  try {
    ZohoSalesIQ.registerVisitor(userId, (error: any, success: any) => {
      if (success) {
        console.log(`[ZohoService] Visitor linked successfully: ${userId}`);
        if (email) ZohoSalesIQ.setVisitorEmail(email);
        if (name) {
          ZohoSalesIQ.setVisitorName(name);
        } else {
          ZohoSalesIQ.setVisitorName("User");
        }
      } else {
        console.error("[ZohoService] Visitor link failed:", JSON.stringify(error));
      }
    });
  } catch (error) {
    console.error("[ZohoService] Error in setZohoVisitor:", error);
  }
};

export const clearZohoVisitor = () => {
  if (!getIsZohoLinked()) return;
  try {
    ZohoSalesIQ.dismissUI();
    ZohoSalesIQ.setVisitorName("");
    ZohoSalesIQ.setVisitorEmail("");
    ZohoSalesIQ.unregisterVisitor(() => {
      console.log("[ZohoService] Visitor unregistered and local data cleared");
    });
  } catch (error) {
    console.error("[ZohoService] Error clearing visitor:", error);
  }
};


export const attachZohoActivityListeners = (resetTimer: () => void) => {
  if (!getIsZohoLinked()) return;
  try {
    // 1. Listen for UI opens/closes (using the new addListener API)
    ZohoSalesIQ.addListener((payload: any) => {
      const { event } = payload;
      if (
        event === ZohoSalesIQ.Event.SUPPORT_OPENED ||
        event === ZohoSalesIQ.Event.SUPPORT_CLOSED
      ) {
        console.log(`[ZohoService] SDK Event (${event}) - Resetting Timer`);
        resetTimer();
      }
    });

    // 2. Listen for any chat activity (messages sent/received)
    ZohoSalesIQ.Chat.addListener((payload: any) => {
      console.log(`[ZohoService] Chat Activity (${payload?.event}) - Resetting Timer`);
      resetTimer();
    });

    console.log("[ZohoService] Activity listeners attached successfully");
  } catch (error) {
    console.error("[ZohoService] Failed to attach activity listeners:", error);
  }
};


export const openChat = async (department?: string, transactionId?: string, transactionType?: string) => {
  if (!getIsZohoLinked()) {
    console.log("[ZohoService] Zoho Chat is unavailable in this environment (running without native Zoho module).");
    return;
  }
  try {
    console.log(`Attempting to open Zoho Chat${department ? ` for department: ${department}` : ""}${transactionId ? ` for Transaction: ${transactionId}` : ""}...`);

    let message = "";
    let customChatId = null;

    // Dedicated transaction context
    if (transactionId) {
      customChatId = transactionId;
    }

    if (department) {
      if (department === "App Support" && !transactionId) {
        ZohoSalesIQ.openChat();
      } else {
        ZohoSalesIQ.Chat.start(
          message,
          customChatId,
          department,
          (error: any, chat: any) => {
            if (error) {
              console.error("Chat.start error:", JSON.stringify(error));
              if (error.code === 702 || error.code === 701 || error.code === 703 || error.code === 704 || error.code === 705) {
                console.log("Falling back to openChat() to show existing conversation...");
                ZohoSalesIQ.openChat();
              }
            } else {
              console.log("Chat started successfully:", JSON.stringify(chat));
            }
          }
        );
      }
    } else {
      ZohoSalesIQ.openChat();
    }
  } catch (error) {
    console.error("Failed to open chat:", error);
  }
};


export const registerDeviceTokenForZoho = (token: string) => {
  if (!getIsZohoLinked() || !token) return;
  try {
    const isTestDevice = __DEV__;
    ZohoSalesIQ.Notification.registerPush(token, isTestDevice);
  } catch (e) {
    console.error("Failed to register push token for Zoho:", e);
  }
};

/**
 * Forwards incoming push notifications that belong to Zoho into the SDK
 */
export const handleIncomingZohoNotification = (notificationData: any) => {
  if (!getIsZohoLinked() || !notificationData) return;
  try {
    ZohoSalesIQ.Notification.isSDKMessage(notificationData, (isSDK: any) => {
      if (isSDK) {
        ZohoSalesIQ.Notification.process(notificationData);
      }
    });
  } catch (e) {
    console.error("Failed to handle Zoho incoming notification:", e);
  }
};


export const openChatWithId = async (chatID: string) => {
  if (!getIsZohoLinked()) return;
  try {
    ZohoSalesIQ.openChatWithID(chatID);
  } catch (error) {
    console.error("Failed to open chat with ID:", error);
  }
};


const allowedPaths = [""];

export const useZohoChatVisibility = () => {
  const pathname = usePathname();
  const { isDark } = useTheme();

  useEffect(() => {
    if (!getIsZohoLinked()) return;
    try {
      if (allowedPaths.includes(pathname)) {
        ZohoSalesIQ.Launcher.show(ZohoSalesIQ.Launcher.VisibilityMode.ALWAYS);
      } else {
        ZohoSalesIQ.Launcher.show(ZohoSalesIQ.Launcher.VisibilityMode.NEVER);
      }

      if (Platform.OS === "android") {
        const themeName = isDark ? "Theme.SalesIQ.Base.Dark" : "Theme.SalesIQ.Base.DarkActionBar";
        console.log(`[ZohoService] Visibility Hook: Applying Android Theme: ${themeName} (Green: #28a712)`);
        ZohoSalesIQ.setThemeForAndroid(themeName);
      } else {
        setThemeColor(isDark);
      }
    } catch (e) {
      // safe catch
    }
  }, [pathname, isDark]);
};




export interface AppSupportUserContext {
  id?: string | number;
  email?: string;
  name?: string;
}

/**
 * Dedicated, independent session handler for App Support.
 * Reconnects directly to the Zoho AI automated support flow (sales-managing AI engine / Zobot).
 * Completely decoupled and isolated from manual human-agent ticket queues and Gift Card routing.
 */
export const openAppSupport = async (userContext?: AppSupportUserContext) => {
  return openChat("App Support");
};

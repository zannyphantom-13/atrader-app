import { handleIncomingZohoNotification, registerDeviceTokenForZoho } from "@/lib/zoho-service";
import { setNotificationEnabledStatus } from "@/redux/auth/session";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { TokenManager } from "@/utils/secure-store-adapter";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, Platform } from "react-native";
import {
  isViewingChat,
  getChatNotificationId,
  dismissChatNotification,
  isMessageProcessed,
  markMessageProcessed,
} from "@/lib/chat-state";
import { markChatReadByUser } from "@/lib/firebase-chat-service";
import { showInAppNotification } from "@/components/customs/InAppNotificationBanner";

export const CHANNEL_CHAT_SILENT = "chat_silent";
export const CHANNEL_CHAT_ALERTS = "chat_alerts";

// Setup Android notification channels
export const setupNotificationChannelsAsync = async () => {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_CHAT_SILENT, {
      name: "Silent Chat Notifications",
      importance: Notifications.AndroidImportance.LOW,
      sound: null,
      enableVibrate: false,
      showBadge: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });

    await Notifications.setNotificationChannelAsync(CHANNEL_CHAT_ALERTS, {
      name: "Chat Alerts",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      enableVibrate: true,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#28A712",
      showBadge: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
};

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  requestPermissions: () => Promise<boolean>;
  //   schedulePushNotification: (title: string, body: string, data?: any, trigger?: Notifications.NotificationTriggerInput) => Promise<string>;
  cancelNotification: (notificationId: string) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
  setBadgeCount: (count: number) => Promise<void>;
  getBadgeCount: () => Promise<number>;
  // new
  unreadCount: number;
  clearBadges: () => Promise<void>;
  updateUnreadCount: (count: number) => Promise<void>;
  notificationEnabledStatus: "granted" | "denied" | "undetermined" | undefined;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription | null>(
    null,
  );
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const dispatch = useAppDispatch();
  const [unreadCount, setUnreadCount] = useState(0); // â† ADD THIS STATE
  // const { notificationEnabledStatus, notificationToken } = useAppSelector(
  //   (state) => state.auth
  // );
  const { notificationEnabledStatus } = useAppSelector(
    (state) => state.session,
  );
  const router = useRouter();



  // console.log("NotificationProvider expoPushToken", expoPushToken);

  const loadBadgeCount = async () => {
    try {
      const savedCount = await AsyncStorage.getItem("unreadNotificationCount");
      const count = savedCount ? parseInt(savedCount) : 0;
      setUnreadCount(count);
      await setBadgeCount(count);
      // console.log("Loaded badge count:", count);
    } catch (error) {
      console.error("Failed to load badge count:", error);
    }
  };

  const updateUnreadCount = async (newCount: number) => {
    try {
      setUnreadCount(newCount);
      await setBadgeCount(newCount);
      await AsyncStorage.setItem(
        "unreadNotificationCount",
        newCount.toString(),
      );
      // console.log("Updated unread count to:", newCount);
    } catch (error) {
      console.error("Failed to update unread count:", error);
    }
  };

  const clearBadges = async () => {
    await updateUnreadCount(0);
  };

  const getAsyncStorageToken = async () => {
    try {
      const token = await TokenManager.getNotificationToken();
      console.log("Retrieved expoPushToken from AsyncStorage:", token);
      return token;
    } catch (error) {
      console.error("Error retrieving expoPushToken from AsyncStorage:", error);
      return null;
    }
  };

  const generateToken = async (): Promise<string | null> => {
    try {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        setExpoPushToken(token);
        await TokenManager.setNotificationToken(token);
        console.log("Generated/Refreshed Expo Push Token:", token);
        return token;
      }
      return null;
    } catch (error) {
      console.error("Failed to generate token:", error);
      return null;
    }
  };

  // Check and update permission status in Redux
  const getPermissionStatus = async (): Promise<
    "granted" | "denied" | "undetermined"
  > => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      let normalizedStatus: "granted" | "denied" | "undetermined";

      if (status === "granted") {
        normalizedStatus = "granted";
      } else if (status === "denied") {
        normalizedStatus = "denied";
      } else {
        normalizedStatus = "undetermined";
      }
      dispatch(setNotificationEnabledStatus(normalizedStatus));
      return normalizedStatus;
    } catch (error) {
      console.error("Failed to check permission status:", error);
      dispatch(setNotificationEnabledStatus("undetermined"));
      return "undetermined";
    }
  };

  // Handle app state changes - SIMPLIFIED
  const handleAppStateChange = async (nextAppState: string) => {
    // console.log("App state changed to:", nextAppState);

    if (nextAppState === "active") {
      // Clear badge when app becomes active
      //   setBadgeCount(0);

      // Get current permission status from Redux (previous state)
      const previousStatus = notificationEnabledStatus;

      // Check current system permission status and update Redux
      const currentStatus = await getPermissionStatus();

      // console.log("Previous permission status (Redux):", previousStatus);
      // console.log("Current permission status (System):", currentStatus);

      // Permission state change detection
      if (previousStatus !== currentStatus) {
        console.log(
          `Permission status changed from ${previousStatus} to ${currentStatus}`,
        );

        if (currentStatus === "granted") {
          // Permission was granted (either first time or re-enabled)
          console.log("Permission granted! Generating token...");
          await generateToken();
        } else if (
          (currentStatus === "denied" || currentStatus === "undetermined") &&
          expoPushToken
        ) {
          // Permission was revoked
          console.log("Permission revoked, clearing token...");
          setExpoPushToken(null);
          await TokenManager.removeNotificationToken();
        }
      } else if (currentStatus === "granted" && !expoPushToken) {
        // We have permission but no token (safety net)
        // console.log("Permission exists but no token, generating token...");
        await generateToken();
      }

      if (currentStatus !== "granted") {
        console.log(
          `Permission status is '${currentStatus}', not generating token`,
        );
      }
    }
  };

  useEffect(() => {
    // Initialize push notifications
    initializePushNotifications();
    // getAsyncStorageToken();
    loadBadgeCount();

    // Listen for incoming notifications while app is running
    notificationListener.current =
      Notifications.addNotificationReceivedListener(async (notification) => {
        console.log("ðŸ”” [NOTIFICATION_ENTRY] Received:", JSON.stringify(notification, null, 2));
        setNotification(notification);

        // Forward to Zoho to see if this push came from SalesIQ
        const trigger = notification.request.trigger as any;
        const pushData = trigger?.remoteMessage?.data || notification.request.content.data || {};
        handleIncomingZohoNotification(pushData);

        const chatId = pushData?.chatId || pushData?.conversationId;
        const isAppInForeground = AppState.currentState === "active";

        // Show In-App Notification banner ONLY for active gift card trade / support chats from agents
        // NEVER show banner for generic welcome notifications, system broadcasts, or non-chat notifications
        const isGiftCardTradeOrSupport =
          Boolean(chatId) &&
          (Boolean(pushData?.tradeId) ||
            String(chatId).startsWith("trade_") ||
            String(chatId).startsWith("support_") ||
            pushData?.cardCategory === "Support" ||
            pushData?.type === "support" ||
            pushData?.type === "trade");

        const isWelcomeNotification =
          pushData?.type === "welcome" ||
          pushData?.screen === "welcome" ||
          String(notification.request.content.title || "").toLowerCase().includes("welcome") ||
          String(notification.request.content.body || "").toLowerCase().includes("welcome") ||
          String(pushData?.preview || "").toLowerCase().includes("welcome");

        if (
          isAppInForeground &&
          isGiftCardTradeOrSupport &&
          !isWelcomeNotification &&
          !isViewingChat(chatId)
        ) {
          const isSupport = !pushData?.tradeId || String(chatId).startsWith("support_");
          const cardLabel = pushData?.cardName || pushData?.cardCategory;
          const notifTitle =
            notification.request.content.title ||
            (isSupport ? "Atrader Support" : (cardLabel ? `Atrader Support — ${cardLabel}` : "Atrader Support"));
          const notifBody =
            notification.request.content.body ||
            pushData?.preview ||
            "New message received";

          showInAppNotification({
            name: notifTitle,
            text: notifBody,
            chatId,
            tradeId: pushData?.tradeId || null,
            cardName: pushData?.cardName || null,
            cardCategory: pushData?.cardCategory || null,
            isSupport,
          });
        }

        const newCount = unreadCount + 1;
        await updateUnreadCount(newCount);
      });

    // Listen for user interactions with notifications
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("ðŸ‘† [NOTIFICATION_RESPONSE] Interaction:", JSON.stringify(response, null, 2));

        const trigger = response.notification.request.trigger as any;
        const data = trigger?.remoteMessage?.data || response.notification.request.content.data || {};
        const chatId = data.chatId || data.conversationId;

        if (chatId) {
          dismissChatNotification(chatId);
          const isSupport = !data.tradeId || String(chatId).startsWith("support_");
          router.push({
            pathname: "/(protected)/(features)/trade-chat" as any,
            params: {
              chatId,
              tradeId: data.tradeId || "",
              cardName: data.cardName || (isSupport ? "Gift Card Support" : "Gift Card"),
              cardCategory: data.cardCategory || (isSupport ? "Support" : ""),
              type: "existing",
              isSupport: isSupport ? "true" : "false",
            },
          });
        } else if (typeof data?.screen === "string") {
          router.push(data.screen as any);
        }
      });

    // Handle app state changes for notification management
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      subscription?.remove();
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
        notificationListener.current = null;
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
        responseListener.current = null;
      }
    };
  }, [unreadCount]);

  const initializePushNotifications = async () => {
    try {
      // First check if we have cached token
      const cachedToken = await getAsyncStorageToken();

      // Check current permission status and update Redux
      const currentStatus = await getPermissionStatus();

      // console.log(
      //   "Initializing push notifications with status:",
      //   currentStatus,
      //   "and cached token:",
      //   cachedToken
      // );

      if (currentStatus === "granted") {
        // If we have permission, generate fresh token
        // await generateToken();
        if (cachedToken) {
          // Use cached token
          // console.log("Using cached token:", cachedToken);
          setExpoPushToken(cachedToken);
          await TokenManager.setNotificationToken(cachedToken);
          // TODO: Optionally verify token is still valid with backend
        } else {
          // No cached token, generate new one
          // console.log("No cached token found, generating new token...");
          await generateToken();
          // TODO: Send new token to backend here
        }
      } else if (currentStatus === "undetermined") {
        // If undetermined, try to request permission
        const granted = await requestPermissions();
        if (granted) {
          await generateToken();
        }
      } else if (currentStatus === "denied") {
        // User previously denied permission
        console.log("Permission denied, not generating token");
        // Clear any cached token since permission is denied
        const granted = await requestPermissions();
        if (granted) {
          await generateToken();
        }
        // setExpoPushToken(null);
        // await AsyncStorage.removeItem('expoPushToken');
        // dispatch(setNotificationToken(''));
      }

      //   const hasPermission = await requestPermissions();
      //   if (hasPermission) {
      //     const token = await registerForPushNotificationsAsync();
      //     setExpoPushToken(token);

      //     // Save token to storage and potentially send to your backend
      //     if (token) {
      //       await AsyncStorage.setItem('expoPushToken', token);
      //       dispatch(setNotificationToken(token));
      //       // TODO: Send token to your backend server
      //       console.log('Expo Push Token:', token);
      //     }
      //   }
    } catch (error) {
      console.error("Failed to initialize push notifications:", error);
    }
  };

  // Request permissions for push notifications
  const requestPermissions = async (): Promise<boolean> => {
    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;

        // Dispatch new status to Redux immediately
        let normalizedStatus: "granted" | "denied" | "undetermined";
        if (finalStatus === "granted") {
          normalizedStatus = "granted";
        } else if (finalStatus === "denied") {
          normalizedStatus = "denied";
        } else {
          normalizedStatus = "undetermined";
        }
        dispatch(setNotificationEnabledStatus(normalizedStatus));
      }

      // if (finalStatus !== "granted") {
      //   Alert.alert(
      //     "Push Notifications",
      //     "Please enable push notifications in your device settings to receive important updates.",
      //     [{ text: "Settings", onPress: () => Linking.openSettings() }],
      //   );
      //   return false;
      // }

      return true;
    } catch (error) {
      console.error("Failed to request notification permissions:", error);
      return false;
    }
  };

  //   const schedulePushNotification = async (
  //     title: string,
  //     body: string,
  //     data?: any,
  //     trigger?: Notifications.NotificationTriggerInput
  //   ): Promise<string> => {
  //     const notificationId = await Notifications.scheduleNotificationAsync({
  //       content: {
  //         title,
  //         body,
  //         data: data || {},
  //         sound: 'default',
  //       },
  //       trigger: trigger || { type: 'timeInterval', seconds: 1 },
  //     });

  //     return notificationId;
  //   };

  const cancelNotification = async (notificationId: string): Promise<void> => {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  };

  const cancelAllNotifications = async (): Promise<void> => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  };

  const setBadgeCount = async (count: number): Promise<void> => {
    await Notifications.setBadgeCountAsync(count);
  };

  const getBadgeCount = async (): Promise<number> => {
    return await Notifications.getBadgeCountAsync();
  };


  const [readItems, setReadItems] = useState<{ id: string }[]>([]);
  const isNotificationRead = (notifId: string) => {
    return readItems.includes({ id: notifId });
  };

  const value: NotificationContextType = {
    expoPushToken,
    notification,
    requestPermissions,
    // schedulePushNotification,
    cancelNotification,
    cancelAllNotifications,
    setBadgeCount,
    getBadgeCount,
    clearBadges,
    updateUnreadCount,
    unreadCount,
    notificationEnabledStatus: notificationEnabledStatus,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
}

// Helper function to register for push notifications and get the token
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token = null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#2B2390",
    });
    await Notifications.setNotificationChannelAsync("chat_alerts", {
      name: "Chat Alerts",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      enableVibrate: true,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#28A712",
    });
    await Notifications.setNotificationChannelAsync("chat_alerts_v2", {
      name: "Chat Alerts",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      enableVibrate: true,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#28A712",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return null;
    }

    try {
      // Constants.expoConfig is often null in EAS runtime updates — always fall back to the
      // hard-coded project ID so token registration never silently fails.
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ||
        (Constants as any)?.easConfig?.projectId ||
        "58fcebb1-ff94-4120-8381-32984a5e83fc";
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log("Expo Push Token:", token);

      // Also fetch the true native token (APNS/FCM) for Zoho SalesIQ Since Zoho doesn't use the Expo infrastructure.
      try {
        const nativeToken = (await Notifications.getDevicePushTokenAsync()).data;
        if (nativeToken) {
          registerDeviceTokenForZoho(nativeToken);
        }
      } catch (nativeErr) {
        console.log("Failed to get Native push token for Zoho:", nativeErr);
      }

      return token;
    } catch (error) {
      console.error("Failed to get push token:", error);
    }
  } else {
    console.log("Push Notifications require a physical device");
  }
  return token;
}

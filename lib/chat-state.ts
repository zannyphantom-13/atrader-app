import { AppState } from "react-native";
import * as Notifications from "expo-notifications";

// Active chat ID tracker across the entire app
let currentActiveChatId: string | null = null;

export const setGlobalActiveChatId = (id: string | null) => {
  currentActiveChatId = id;
};

export const getGlobalActiveChatId = (): string | null => {
  return currentActiveChatId;
};

/**
 * Checks if the user is currently viewing a specific conversation directly in the foreground.
 * Evaluates to false if the screen is off, app is in background, or another chat/screen is focused.
 */
export const isViewingChat = (chatId: string | null | undefined): boolean => {
  if (!chatId) return false;
  return AppState.currentState === "active" && currentActiveChatId === chatId;
};

/**
 * Generates a stable notification identifier for a conversation
 * so subsequent messages update the existing tray notification instead of stacking duplicates.
 */
export const getChatNotificationId = (chatId: string): string => {
  const safeId = String(chatId).replace(/[^a-zA-Z0-9_-]/g, "_");
  return `atrader_chat_${safeId}`;
};

/**
 * Dismisses any existing system tray notification for this conversation.
 */
export const dismissChatNotification = async (chatId: string | null | undefined): Promise<void> => {
  if (!chatId) return;
  try {
    const notifId = getChatNotificationId(chatId);
    await Notifications.dismissNotificationAsync(notifId);
  } catch (err) {
    // Graceful fallback
  }
};

// Deduplication cache for incoming push notifications (prevents duplicate triggers)
const processedMessageIds = new Set<string>();
const MAX_PROCESSED_IDS = 100;

export const isMessageProcessed = (messageId: string | null | undefined): boolean => {
  if (!messageId) return false;
  return processedMessageIds.has(messageId);
};

export const markMessageProcessed = (messageId: string | null | undefined): void => {
  if (!messageId) return;
  if (processedMessageIds.size >= MAX_PROCESSED_IDS) {
    const oldest = processedMessageIds.values().next().value;
    if (oldest) processedMessageIds.delete(oldest);
  }
  processedMessageIds.add(messageId);
};

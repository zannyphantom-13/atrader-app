/**
 * Shared Unread & Scroll Tracker Logic for Atrader Chat
 * Used by both Main Customer App and Admin Trade Chat
 */

export const BOTTOM_SCROLL_THRESHOLD = 120; // px threshold from bottom to be considered "at bottom"
export const UNREAD_CLEAR_ANIMATION_MS = 1500; // 1.5s animated dismiss duration

export const UNREAD_COLORS = {
  DIVIDER_GREEN: "#28A712",
  HIGHLIGHT_BG_LIGHT: "rgba(40, 167, 18, 0.12)",
  HIGHLIGHT_BG_DARK: "rgba(40, 167, 18, 0.22)",
  HIGHLIGHT_BORDER: "#28A712",
};

export interface ChatMessageLike {
  id?: string;
  sender?: string;
  senderType?: string;
  type?: string;
  text?: string;
  createdAt?: any;
  readByUser?: boolean;
  readByAgent?: boolean;
}

/**
 * Checks if a message was sent by the current user.
 * Messages sent by current user are NEVER unread and NEVER highlighted.
 */
export function isSentByCurrentUser(
  message: ChatMessageLike,
  currentUserRole: "customer" | "agent"
): boolean {
  if (currentUserRole === "customer") {
    return message.senderType === "user" || message.sender === "user";
  }
  return message.senderType === "agent" || message.sender === "agent";
}

/**
 * Checks if a message is a system notification message.
 */
export function isChatMessageSystem(message: ChatMessageLike): boolean {
  if (
    message.type === "system" ||
    message.type === "status_update" ||
    message.senderType === "system" ||
    message.sender === "system"
  ) {
    return true;
  }
  const text = message.text?.toLowerCase().trim() || "";
  if (!text) return false;
  return (
    text.includes("trade has been approved") ||
    text.includes("funds would be sent soon") ||
    text.includes("trade approved") ||
    text.includes("chat has been closed") ||
    text.includes("chat closed") ||
    text.includes("trade has been rejected") ||
    text.includes("trade rejected") ||
    text.includes("chat has been reopened") ||
    text.includes("chat reopened") ||
    text.includes("reopened") ||
    text.includes("trade has been cancelled") ||
    text.includes("trade cancelled") ||
    text.startsWith("reason:")
  );
}

export interface UnreadSnapshotResult {
  unreadIds: Set<string>;
  firstUnreadId: string | null;
  unreadCount: number;
}

/**
 * Computes the initial unread snapshot when opening a chat.
 *
 * @param chronologicalMessages Array of messages ordered oldest to newest.
 * @param currentUserRole Whether current viewer is 'customer' or 'agent'.
 * @param rawUnreadCount Unread count reported by chat metadata.
 */
export function computeUnreadSnapshot(
  chronologicalMessages: ChatMessageLike[],
  currentUserRole: "customer" | "agent",
  rawUnreadCount: number = 0
): UnreadSnapshotResult {
  const unreadIds = new Set<string>();

  // Filter messages from other party (exclude current user and system messages)
  const incomingMessages: ChatMessageLike[] = [];
  for (const msg of chronologicalMessages) {
    if (!isChatMessageSystem(msg) && !isSentByCurrentUser(msg, currentUserRole)) {
      incomingMessages.push(msg);
    }
  }

  // 1. Try explicit read flag on messages
  const explicitlyUnread = incomingMessages.filter((m) => {
    if (currentUserRole === "customer") {
      return m.readByUser === false;
    }
    return m.readByAgent === false;
  });

  if (explicitlyUnread.length > 0) {
    explicitlyUnread.forEach((m) => {
      if (m.id) unreadIds.add(m.id);
    });
  } else if (rawUnreadCount > 0 && incomingMessages.length > 0) {
    // 2. Take the last N incoming messages
    const targetMessages = incomingMessages.slice(-rawUnreadCount);
    targetMessages.forEach((m) => {
      if (m.id) unreadIds.add(m.id);
    });
  }

  // First unread is the oldest message in the unread set (first in chronological order)
  let firstUnreadId: string | null = null;
  for (const msg of incomingMessages) {
    if (msg.id && unreadIds.has(msg.id)) {
      firstUnreadId = msg.id;
      break;
    }
  }

  return {
    unreadIds,
    firstUnreadId,
    unreadCount: unreadIds.size,
  };
}

/**
 * Determines whether an inverted list scroll position is within the bottom threshold.
 * In inverted FlatList: offset 0 is bottom.
 */
export function isInvertedNearBottom(
  offsetY: number,
  threshold: number = BOTTOM_SCROLL_THRESHOLD
): boolean {
  return offsetY <= threshold;
}

/**
 * Determines whether a normal (non-inverted) ScrollView position is within the bottom threshold.
 */
export function isNormalScrollNearBottom(
  contentHeight: number,
  visibleHeight: number,
  offsetY: number,
  threshold: number = BOTTOM_SCROLL_THRESHOLD
): boolean {
  const distanceFromBottom = contentHeight - visibleHeight - offsetY;
  return distanceFromBottom <= threshold;
}


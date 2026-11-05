import { isViewingChat, dismissChatNotification } from "./chat-state";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "./firebase";

// ============================================
// Types
// ============================================

export type TradeStatus = "pending" | "successful" | "rejected";
export type ChatStatus = "open" | "closed" | "deleted" | "resolved";
export type SenderType = "user" | "agent" | "system";
export type MessageType = "text" | "image" | "status_update";
export type ChatType = "trade" | "support";

export interface ChatDocument {
  chatId: string;
  type: ChatType;
  tradeId: string | null;
  userId: string;
  userName: string;
  userAvatar: string | null;
  userExpoPushToken: string | null;
  cardName: string;
  cardCategory: string;
  cardImage: string | null;
  cardAmount: string;
  settlementAmount: string;
  tradeStatus: TradeStatus | null;
  chatStatus: ChatStatus;
  isClosed?: boolean;
  status?: string | null;
  rejectReason?: string | null;
  closedBy?: string | null;
  assignedAgent: string | null;
  assignedAgentName: string | null;
  assignedRole: string | null;
  lastMessage: string;
  lastMessageAt: Timestamp | null;
  lastMessageSender: SenderType;
  senderType?: string;
  unreadByUser?: number;
  unreadByCustomer?: number;
  unreadCount?: number;
  unread_count?: number;
  unread?: number;
  unreadByAgent: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MessageDocument {
  id?: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  senderType: SenderType;
  type: MessageType;
  text: string;
  imageUrl: string | null;
  metadata: Record<string, any> | null;
  createdAt: Timestamp;
  readByUser: boolean;
  readByAgent: boolean;
}

export interface CreateChatParams {
  chatId?: string;
  tradeId: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  userExpoPushToken?: string | null;
  cardName: string;
  cardCategory: string;
  cardImage?: string | null;
  cardAmount: string;
  settlementAmount: string;
  chatType?: ChatType;
}

/** Gift Card Support: general, never-closed chat. Not a trade. */
export const isGiftCardSupportChat = (chat: any): boolean => {
  if (!chat) return false;
  const id = String(chat.chatId || chat.id || "");
  return (
    chat.type === "support" ||
    chat.chatType === "support" ||
    chat.cardCategory === "Support" ||
    chat.cardName === "Gift Card Support" ||
    chat.isSupport === true ||
    chat.isSupport === "true" ||
    id.startsWith("support_")
  );
};

/** Closed is an explicit flag, never a trade result. Support chats cannot be closed. */
export const isTradeChatClosed = (chat: any): boolean => {
  if (!chat || isGiftCardSupportChat(chat)) return false;
  return (
    chat.isClosed === true ||
    chat.chatStatus === "closed" ||
    (chat.status === "closed" && !chat.tradeStatus)
  );
};

export const hasTradeDecision = (chat: any): boolean => {
  if (!chat || isGiftCardSupportChat(chat)) return false;
  const s = String(chat.tradeStatus || "").toLowerCase();
  return (
    s === "successful" ||
    s === "approved" ||
    s === "success" ||
    s === "rejected" ||
    s === "reject" ||
    s === "failed"
  );
};

/** A pending trade (no Approve/Reject yet) must not be closable. */
export const canCloseTradeChat = (chat: any): boolean => {
  if (!chat || isGiftCardSupportChat(chat)) return false;
  if (isTradeChatClosed(chat)) return false;
  return hasTradeDecision(chat);
};

const getChatTimestampMillis = (ts: any): number => {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (ts.seconds) return ts.seconds * 1000 + (ts.nanoseconds || 0) / 1e6;
  if (typeof ts === "string") return new Date(ts).getTime();
  if (ts instanceof Date) return ts.getTime();
  return 0;
};

/** App Support is a separate Zoho row. Gift Card Support is pinned; trades sort by latest message. */
export const sortCustomerChatList = (chats: ChatDocument[]): ChatDocument[] => {
  return [...chats].sort((a, b) => {
    const aSupport = isGiftCardSupportChat(a) ? 1 : 0;
    const bSupport = isGiftCardSupportChat(b) ? 1 : 0;
    if (aSupport !== bSupport) return bSupport - aSupport;
    return getChatTimestampMillis(b.lastMessageAt) - getChatTimestampMillis(a.lastMessageAt);
  });
};

// ============================================
// Chat Operations
// ============================================

const CHATS_COLLECTION = "chats";
const MESSAGES_SUBCOLLECTION = "messages";
const CHAT_QUEUE_COLLECTION = "chatQueue";

/**
 * Create a new trade chat (or return existing one if chat already exists for this tradeId)
 */
export const createTradeChat = async (
  params: CreateChatParams,
): Promise<string> => {
  const isSupport =
    params.chatType === "support" ||
    Boolean(params.chatId?.startsWith("support_")) ||
    params.cardCategory === "Support" ||
    params.cardName === "Gift Card Support";

  const chatId =
    params.chatId ||
    (isSupport
      ? `support_${params.userId}`
      : `trade_${params.tradeId}`);

  // Check if chat already exists
  const chatRef = doc(db, CHATS_COLLECTION, chatId);
  try {
    const existingChat = await getDoc(chatRef);
    if (existingChat.exists()) {
      console.log("[FirebaseChat] Chat already exists:", chatId);
      // General app support should ALWAYS remain open, and push token must stay fresh
      const existingUpdates: any = {
        updatedAt: serverTimestamp(),
      };
      if (params.userExpoPushToken) {
        existingUpdates.userExpoPushToken = params.userExpoPushToken;
      }
      if (isSupport || params.chatType === "support" || chatId.startsWith("support_")) {
        existingUpdates.chatStatus = "open";
        existingUpdates.status = "open";
        existingUpdates.isClosed = false;
        existingUpdates.tradeStatus = null;
        existingUpdates.type = "support";
      }
      try {
        await updateDoc(chatRef, existingUpdates);
      } catch (e) {
        console.warn("[FirebaseChat] Failed to update existing chat:", e);
      }
      return chatId;
    }
  } catch (error) {
    console.warn(
      "[FirebaseChat] Failed to check for existing chat (possibly offline):",
      error,
    );
    // If we're deterministic (based on tradeId), we can risk continuing if type is trade
    // For support chats, the timestamp makes it unique anyway
  }

  // Create new chat document
  const chatData: Omit<
    ChatDocument,
    "createdAt" | "updatedAt" | "lastMessageAt"
  > & {
    createdAt: ReturnType<typeof serverTimestamp>;
    updatedAt: ReturnType<typeof serverTimestamp>;
    lastMessageAt: ReturnType<typeof serverTimestamp>;
  } = {
    chatId,
    type: isSupport ? "support" : (params.chatType || "trade"),
    tradeId: isSupport ? null : (params.tradeId || null),
    userId: params.userId,
    userName: params.userName,
    userAvatar: params.userAvatar || null,
    userExpoPushToken: params.userExpoPushToken || null,
    cardName: params.cardName,
    cardCategory: params.cardCategory,
    cardImage: params.cardImage || null,
    cardAmount: params.cardAmount,
    settlementAmount: params.settlementAmount,
    tradeStatus: isSupport ? null : "pending",
    chatStatus: "open",
    isClosed: false,
    assignedAgent: null,
    assignedAgentName: null,
    assignedRole: null,
    lastMessage: isSupport
      ? `Hello ${params.userName}, how may we help you today?`
      : `Hello ${params.userName} you submitted a trade of a ${params.cardName} gift card and your trade is currently ongoing.`,
    lastMessageAt: serverTimestamp(),
    lastMessageSender: "system",
    unreadByUser: 0,
    unreadByCustomer: 0,
    unreadCount: 0,
    unread_count: 0,
    unread: 0,
    unreadByAgent: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(chatRef, chatData, { merge: true });
  console.log("[FirebaseChat] Chat created:", chatId);

  // Add initial system message
  await sendMessage(chatId, {
    senderId: "system",
    senderName: "Atrader customer support",
    senderAvatar: null,
    senderType: "system",
    type: "text",
    text: `${isSupport ? `Hello ${params.userName}, how may we help you today?` : `Hello ${params.userName} you submitted a trade of a ${params.cardName} gift card and your trade is currently ongoing.`}`,
    imageUrl: null,
    metadata: null,
    readByUser: true, // Welcome message is not an unread agent message for user
    readByAgent: false,
  });

  // Add to chat queue for agents to pick up
  await addDoc(collection(db, CHAT_QUEUE_COLLECTION), {
    chatId,
    tradeId: params.tradeId,
    cardCategory: params.cardCategory,
    userId: params.userId,
    userName: params.userName,
    status: "waiting",
    assignedTo: null,
    pickedAt: null,
    createdAt: serverTimestamp(),
    priority: 2, // normal priority
  });

  console.log("[FirebaseChat] Chat queued for agents:", chatId);
  return chatId;
};

/**
 * Universal helper to extract unread count for user across all supported schema variants
 * (agent app uses unreadByCustomer, Cloud Functions use unreadByUser, standard uses unreadCount)
 */
export const getChatUnreadCount = (chat: any): number => {
  if (!chat) return 0;

  // If chat is currently open/active (e.g. reopened after a rejection),
  // always show the real unread count — never suppress it with stale closed state.
  // Rejected/approved-but-open chats still receive messages; only a closed flag suppresses.
  if (isTradeChatClosed(chat)) {
    if (
      chat.lastMessageSender === "system" ||
      !chat.lastMessageSender ||
      String(chat.lastMessage || "").toLowerCase().includes("closed")
    ) {
      return 0;
    }
  }

  const count = Math.max(
    Number(chat.unreadByCustomer || 0),
    Number(chat.unreadByUser || 0),
    Number(chat.unreadCount || 0),
    Number(chat.unread_count || 0),
    Number(chat.unread || 0)
  );
  return Math.max(0, isNaN(count) ? 0 : Math.floor(count));
};

export const getRawChatUnreadCount = getChatUnreadCount;

/**
 * Send a message in a chat.
 * Blocks user messages when the chat is closed (server-side guard).
 * System messages from internal service calls are always allowed through.
 */
export const sendMessage = async (
  chatId: string,
  messageData: Omit<MessageDocument, "id" | "createdAt">,
): Promise<string> => {
  // Server-side closed-chat guard: only user messages are blocked.
  // System messages (from closeChat/reopenChat/admin) are always permitted.
  if (messageData.senderType === "user") {
    const chatSnap = await getDoc(doc(db, CHATS_COLLECTION, chatId));
    if (chatSnap.exists()) {
      const chatData = chatSnap.data();
      if (isTradeChatClosed({ ...chatData, chatId })) {
        throw new Error("CHAT_CLOSED");
      }
    }
  }

  const messagesRef = collection(
    db,
    CHATS_COLLECTION,
    chatId,
    MESSAGES_SUBCOLLECTION,
  );
  const msgDoc = await addDoc(messagesRef, {
    ...messageData,
    createdAt: serverTimestamp(),
  });

  // Update the chat's last message and unread counts
  const chatRef = doc(db, CHATS_COLLECTION, chatId);
  const updateData: Record<string, any> = {
    lastMessage: messageData.type === "image" ? "📷 Image" : messageData.text,
    lastMessageAt: serverTimestamp(),
    lastMessageSender: messageData.senderType,
    updatedAt: serverTimestamp(),
  };

  if (messageData.senderType === "user") {
    updateData.unreadByAgent = increment(1);
    updateData.unreadByUser = 0;
    updateData.unreadByCustomer = 0;
    updateData.unreadCount = 0;
    updateData.unread_count = 0;
    updateData.unread = 0;
    // Asynchronously mark all existing unread messages in backend as read by user
    markAllMessagesReadByUser(chatId).catch(() => { });
  } else if (messageData.senderType === "agent") {
    // Only increment customer count if customer is NOT currently viewing this chat
    if (!isViewingChat(chatId)) {
      updateData.unreadByUser = increment(1);
      updateData.unreadByCustomer = increment(1);
      updateData.unreadCount = increment(1);
      updateData.unread_count = increment(1);
    }
    updateData.unreadByAgent = 0;
  } else {
    // Rule 1 & 9: System messages (e.g. welcome, closed, status) never increment unread counts
  }

  await updateDoc(chatRef, updateData);
  return msgDoc.id;
};

/**
 * Send a text message from the user
 */
export const sendUserMessage = async (
  chatId: string,
  userId: string,
  userName: string,
  userAvatar: string | null,
  text: string,
): Promise<string> => {
  return sendMessage(chatId, {
    senderId: userId,
    senderName: userName,
    senderAvatar: userAvatar,
    senderType: "user",
    type: "text",
    text,
    imageUrl: null,
    metadata: null,
    readByUser: true,
    readByAgent: false,
  });
};

/**
 * Upload an image to Firebase Storage and send as a message
 */
export const sendImageMessage = async (
  chatId: string,
  userId: string,
  userName: string,
  userAvatar: string | null,
  imageUri: string,
  fileName?: string,
): Promise<string> => {
  // Upload image to Firebase Storage
  const imageRef = ref(
    storage,
    `chat-images/${chatId}/${Date.now()}_${fileName || "image.jpg"}`,
  );

  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();

    const metadata = {
      contentType: "image/jpeg",
    };

    console.log(
      "[FirebaseChat] Starting image upload via fetch Blob and uploadBytes...",
    );

    const snapshot = await uploadBytes(imageRef, blob, metadata);
    console.log("[FirebaseChat] Upload complete.");

    const downloadURL = await getDownloadURL(snapshot.ref);
    const msgId = await sendMessage(chatId, {
      senderId: userId,
      senderName: userName,
      senderAvatar: userAvatar,
      senderType: "user",
      type: "image",
      text: "",
      imageUrl: downloadURL,
      metadata: null,
      readByUser: true,
      readByAgent: false,
    });

    if ((blob as any).close) (blob as any).close();
    return msgId;
  } catch (error) {
    console.error("[FirebaseChat] Upload failed:", error);
    throw error;
  }
};

/**
 * Subscribe to real-time messages for a chat
 */
export const subscribeToMessages = (
  chatId: string,
  callback: (messages: MessageDocument[]) => void,
): Unsubscribe => {
  const messagesRef = collection(
    db,
    CHATS_COLLECTION,
    chatId,
    MESSAGES_SUBCOLLECTION,
  );
  const q = query(messagesRef, orderBy("createdAt", "asc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const messages: MessageDocument[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as MessageDocument[];
      callback(messages);
    },
    (error) => {
      console.error("[FirebaseChat] subscribeToMessages error:", error);
      callback([]);
    },
  );
};

/**
 * Subscribe to a single chat document for real-time status updates
 */
export const subscribeToChat = (
  chatId: string,
  callback: (chat: ChatDocument | null) => void,
): Unsubscribe => {
  const chatRef = doc(db, CHATS_COLLECTION, chatId);

  return onSnapshot(chatRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ ...snapshot.data(), chatId: snapshot.id } as ChatDocument);
    } else {
      callback(null);
    }
  });
};

/**
 * Subscribe to all chats for a user (for the message list screen)
 */
export const subscribeToUserChats = (
  userId: string | number | (string | number)[],
  callback: (chats: ChatDocument[]) => void,
): Unsubscribe => {
  const ids = (Array.isArray(userId) ? userId : [userId])
    .filter((id) => id !== null && id !== undefined && id !== "")
    .map((id) => String(id).trim())
    .filter((id) => id.length > 0);

  if (ids.length === 0) {
    callback([]);
    return () => { };
  }

  const chatsRef = collection(db, CHATS_COLLECTION);
  const q = ids.length === 1
    ? query(chatsRef, where("userId", "==", ids[0]))
    : query(chatsRef, where("userId", "in", ids.slice(0, 10)));

  return onSnapshot(
    q,
    (snapshot) => {
      const chats: ChatDocument[] = snapshot.docs.map((doc) => ({
        ...doc.data(),
        chatId: doc.id,
      })) as ChatDocument[];

      // Client-side filtering and sorting to bypass composite index constraints
      const filteredAndSorted = sortCustomerChatList(
        chats.filter((c) => c.chatStatus !== "deleted"),
      );

      callback(filteredAndSorted);
    },
    (error) => {
      console.error("[FirebaseChat] subscribeToUserChats error:", error);
      callback([]);
    },
  );
};

/**
 * Mark all messages in a chat as read by user
 */
/**
 * Mark all individual message documents in a chat as read by the user
 */
export const markAllMessagesReadByUser = async (chatId: string): Promise<void> => {
  if (!chatId) return;
  try {
    const messagesRef = collection(
      db,
      CHATS_COLLECTION,
      chatId,
      MESSAGES_SUBCOLLECTION
    );
    const q = query(messagesRef, where("readByUser", "==", false));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const batch = writeBatch(db);
      snap.docs.forEach((docSnap) => {
        batch.update(docSnap.ref, { readByUser: true });
      });
      await batch.commit();
      console.log(`[FirebaseChat] Marked ${snap.size} unread messages read by user in ${chatId}`);
    }
  } catch (err) {
    console.warn("[FirebaseChat] markAllMessagesReadByUser error:", err);
  }
};

export const markChatReadByUser = async (chatId: string): Promise<void> => {
  if (!chatId) return;
  // Dismiss any system tray notification for this conversation
  dismissChatNotification(chatId);
  const chatRef = doc(db, CHATS_COLLECTION, chatId);
  try {
    await updateDoc(chatRef, {
      unreadByUser: 0,
      unreadByCustomer: 0,
      unreadCount: 0,
      unread_count: 0,
      unread: 0,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn("[FirebaseChat] markChatReadByUser error:", err);
  }
  // Ensure individual message records are also marked read
  await markAllMessagesReadByUser(chatId);
};

/**
 * Update the user's expo push token for a chat
 */
export const updateChatPushToken = async (
  chatId: string,
  token: string | null,
): Promise<void> => {
  if (!token) return;
  const chatRef = doc(db, CHATS_COLLECTION, chatId);
  await updateDoc(chatRef, {
    userExpoPushToken: token,
    updatedAt: serverTimestamp(),
  });
  console.log("[FirebaseChat] Token updated for chat:", chatId);
};

/**
 * Close a chat (user clicks "End chat" or admin selects Close).
 * Preserves the existing tradeStatus — does not change Successful or Rejected.
 * Sets isClosed: true and chatStatus: "closed".
 * Gift Card Support (support_*) chats can never be closed.
 */
export const closeChat = async (chatId: string): Promise<void> => {
  const chatRef = doc(db, CHATS_COLLECTION, chatId);

  const snap = await getDoc(chatRef);
  if (!snap.exists()) return;
  const current = { ...snap.data(), chatId: snap.id };

  if (isGiftCardSupportChat(current) || chatId.startsWith("support_")) {
    console.log("[FirebaseChat] Gift Card Support cannot be closed.");
    return;
  }
  if (isTradeChatClosed(current)) {
    console.log("[FirebaseChat] Chat already closed, skipping.");
    return;
  }
  if (!hasTradeDecision(current)) {
    throw new Error("CHAT_NOT_CLOSABLE");
  }

  // Close the chat — preserve tradeStatus exactly as-is (do not write tradeStatus)
  await updateDoc(chatRef, {
    chatStatus: "closed",
    isClosed: true,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Reopen a closed trade chat.
 * Resets tradeStatus to "pending", opens the chat, clears isClosed.
 */
export const reopenChat = async (chatId: string): Promise<void> => {
  if (chatId.startsWith("support_")) {
    console.log("[FirebaseChat] Gift Card Support cannot be reopened or closed.");
    return;
  }
  const chatRef = doc(db, CHATS_COLLECTION, chatId);
  const snap = await getDoc(chatRef);
  if (snap.exists() && isGiftCardSupportChat({ ...snap.data(), chatId: snap.id })) {
    return;
  }
  await updateDoc(chatRef, {
    chatStatus: "open",
    isClosed: false,
    status: "active",
    tradeStatus: "pending",
    rejectReason: null,
    updatedAt: serverTimestamp(),
  });

  // Add system message
  await sendMessage(chatId, {
    senderId: "system",
    senderName: "Atrader customer support",
    senderAvatar: null,
    senderType: "system",
    type: "text",
    text: "This chat has been reopened. How else can we help you today?",
    imageUrl: null,
    metadata: null,
    readByUser: true,
    readByAgent: false,
  });
};

/**
 * Check if a trade chat already exists
 */
export const getTradeChatId = async (
  tradeId: string,
): Promise<string | null> => {
  const chatId = `trade_${tradeId}`;
  const chatRef = doc(db, CHATS_COLLECTION, chatId);
  const chatSnap = await getDoc(chatRef);
  return chatSnap.exists() ? chatId : null;
};

/**
 * Get total unread count across all chats for a user
 */
export const getTotalUnreadCount = (
  userId: string | string[],
  callback: (count: number) => void,
): Unsubscribe => {
  return subscribeToUserChats(userId, (chats) => {
    const total = chats.reduce((acc, c) => acc + getChatUnreadCount(c), 0);
    callback(total);
  });
};

export function fetchChatMetadataAsync(chatId: string): Promise<any> {
  return new Promise(async (resolve, reject) => {
    // If an error occurs here, new Promise does NOT catch it!
    const chatRef = doc(db, CHATS_COLLECTION, chatId);
    const snap = await getDoc(chatRef);
    if (!snap.exists()) {
      throw new Error("Chat metadata not found"); // Unhandled rejection escapes wrapper!
    }
    resolve(snap.data());
  });
}

export async function uploadRawBase64Attachment(chatId: string, base64Data: string): Promise<void> {
  // Directly writes huge base64 string into firestore document without chunking or compression
  await updateDoc(doc(db, CHATS_COLLECTION, chatId), {
    rawAttachmentBlob: base64Data, // Hits document/gateway size limits!
  });
}

export function setupChatStreamWithoutHeartbeat(url: string) {
  const ws = new WebSocket(url);
  // When device changes WiFi/cellular, socket never fires 'close' or 'error' and stays hung!
  return ws;
}


/**
 * Accurately evaluates whether a user has an active, unassigned support thread.
 * An active unassigned thread is open and has no assigned agent (assignedAgent, assignedAgentName, assignedTo).
 */
export const findActiveUnassignedSupportChat = (
  chats: ChatDocument[],
): ChatDocument | null => {
  if (!Array.isArray(chats)) return null;
  return (
    chats.find((c) => {
      const isSupport =
        c.type === "support" ||
        (c as any).chatType === "support" ||
        c.cardCategory === "Support" ||
        c.cardName === "Gift Card Support" ||
        Boolean(c.chatId?.startsWith("support_"));
      if (!isSupport) return false;
      if (isTradeChatClosed(c)) return false;
      const assignedVal = c.assignedAgent || (c as any).assignedTo || null;
      const hasAgent = Boolean(
        assignedVal &&
        assignedVal !== "Unassigned" &&
        assignedVal !== "unassigned" &&
        assignedVal !== "null" &&
        assignedVal !== "none"
      );
      return !hasAgent;
    }) || null
  );
};

import { useState, useEffect, useCallback, useRef } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  subscribeToMessages,
  subscribeToChat,
  sendUserMessage,
  sendImageMessage,
  markChatReadByUser,
  closeChat,
  type MessageDocument,
  type ChatDocument,
} from '@/lib/firebase-chat-service';

interface UseFirebaseChatReturn {
  messages: MessageDocument[];
  chatInfo: ChatDocument | null;
  isLoading: boolean;
  isSending: boolean;
  isUploading: boolean;
  sendText: (text: string) => Promise<void>;
  sendImage: (imageUri: string, fileName?: string) => Promise<void>;
  endChat: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useFirebaseChat = (
  chatId: string | null,
  userId: string,
  userName: string,
  userAvatar: string | null
): UseFirebaseChatReturn => {
  const [messages, setMessages] = useState<MessageDocument[]>([]);
  const [chatInfo, setChatInfo] = useState<ChatDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(() => !!getAuth().currentUser);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthReady(!!user);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to messages
  useEffect(() => {
    if (!chatId || !isAuthReady) return;
    setIsLoading(true);

    const unsubscribe = subscribeToMessages(chatId, (msgs) => {
      setMessages(msgs);
      setIsLoading(false);

      // Note: Marking messages as read is controlled by the UI layer (trade-chat.tsx)
      // upon reaching the bottom or sending a message, preserving unread dividers and highlights.
    });

    return () => {
      unsubscribe();
    };
  }, [chatId, isAuthReady]);

  // Subscribe to chat document for real-time status updates
  useEffect(() => {
    if (!chatId || !isAuthReady) return;

    const unsubscribe = subscribeToChat(chatId, (chat) => {
      setChatInfo(chat);
    });

    return () => unsubscribe();
  }, [chatId, isAuthReady]);

  // Note: Unread state on open is preserved so the unread divider and bubble highlights
  // can be rendered and scrolled to. Clearing occurs once the user reaches the bottom or sends a message.

  const markAllAsRead = useCallback(async () => {
    if (!chatId) return;
    setChatInfo((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        unreadByUser: 0,
        unreadByCustomer: 0,
        unreadCount: 0,
        unread_count: 0,
        unread: 0,
      };
    });
    setMessages((prev) =>
      prev.map((m) => (m.readByUser ? m : { ...m, readByUser: true }))
    );
    try {
      await markChatReadByUser(chatId);
    } catch (err) {
      console.warn('[useFirebaseChat] markAllAsRead error:', err);
    }
  }, [chatId]);

  const sendText = useCallback(async (text: string) => {
    if (!chatId || !text.trim()) return;
    setIsSending(true);

    // Optimistically reset unread counter to 0 and mark messages read immediately
    setChatInfo((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        unreadByUser: 0,
        unreadByCustomer: 0,
        unreadCount: 0,
        unread_count: 0,
        unread: 0,
      };
    });
    setMessages((prev) =>
      prev.map((m) => (m.readByUser ? m : { ...m, readByUser: true }))
    );

    try {
      await sendUserMessage(chatId, userId, userName, userAvatar, text.trim());
      await markChatReadByUser(chatId);
    } catch (error) {
      console.error('[useFirebaseChat] Failed to send message:', error);
      throw error;
    } finally {
      setIsSending(false);
    }
  }, [chatId, userId, userName, userAvatar]);

  const sendImage = useCallback(async (imageUri: string, fileName?: string) => {
    if (!chatId) return;
    setIsUploading(true);

    // Optimistically reset unread counter to 0 and mark messages read immediately
    setChatInfo((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        unreadByUser: 0,
        unreadByCustomer: 0,
        unreadCount: 0,
        unread_count: 0,
        unread: 0,
      };
    });
    setMessages((prev) =>
      prev.map((m) => (m.readByUser ? m : { ...m, readByUser: true }))
    );

    try {
      await sendImageMessage(chatId, userId, userName, userAvatar, imageUri, fileName);
      await markChatReadByUser(chatId);
    } catch (error) {
      console.error('[useFirebaseChat] Failed to send image:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [chatId, userId, userName, userAvatar]);

  const endChat = useCallback(async () => {
    if (!chatId) return;
    try {
      await closeChat(chatId);
    } catch (error) {
      console.error('[useFirebaseChat] Failed to close chat:', error);
      throw error;
    }
  }, [chatId]);

  return {
    messages,
    chatInfo,
    isLoading,
    isSending,
    isUploading,
    sendText,
    sendImage,
    endChat,
    markAllAsRead,
  };
};

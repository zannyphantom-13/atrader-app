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

      // Mark as read whenever new messages arrive while user is viewing the chat
      if (msgs.length > 0) {
        markChatReadByUser(chatId).catch((err) =>
          console.warn('[useFirebaseChat] markChatReadByUser failed:', err)
        );
      }
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

  // Mark as read when user opens chat
  useEffect(() => {
    if (chatId && isAuthReady) {
      markChatReadByUser(chatId).catch((err) =>
        console.warn('[useFirebaseChat] initial markChatReadByUser failed:', err)
      );
    }
  }, [chatId, isAuthReady]);

  const sendText = useCallback(async (text: string) => {
    if (!chatId || !text.trim()) return;
    setIsSending(true);
    try {
      await sendUserMessage(chatId, userId, userName, userAvatar, text.trim());
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
    try {
      await sendImageMessage(chatId, userId, userName, userAvatar, imageUri, fileName);
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
  };
};

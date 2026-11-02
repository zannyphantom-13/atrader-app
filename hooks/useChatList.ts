import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  subscribeToUserChats,
  getChatUnreadCount,
  type ChatDocument,
} from '@/lib/firebase-chat-service';

export const useChatList = (userIdProp: string | null): any => {
  const [chats, setChats] = useState<ChatDocument[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseUid, setFirebaseUid] = useState<string | null>(() => getAuth().currentUser?.uid || null);

  // Use Firebase's true UID dynamically to avoid stale prop issues from the initial render
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUid(user ? user.uid : null);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to user's chat list in realtime using all valid identifiers
  useEffect(() => {
    const candidateIds = Array.from(
      new Set(
        [firebaseUid, userIdProp, getAuth().currentUser?.uid]
          .filter((id): id is string => Boolean(id) && typeof id === "string" && id.trim().length > 0)
      )
    );

    if (candidateIds.length === 0) {
      setChats([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribChats = subscribeToUserChats(candidateIds, (chatList) => {
      setChats(chatList);
      setIsLoading(false);
    });

    return () => unsubscribChats();
  }, [firebaseUid, userIdProp]);

  // Count of conversations with unread messages (WhatsApp tab behavior: count of unread chats)
  const unreadConversationsCount = chats.filter((c) => getChatUnreadCount(c) > 0).length;
  // Total unread messages across all conversations (for push notifications / OS badges)
  const totalUnreadMessages = chats.reduce((acc, c) => acc + getChatUnreadCount(c), 0);

  const [searchResults, setSearchResults] = useState<ChatDocument[]>([]);
  const searchChatList = async (queryText: string) => {
    const delay = queryText.length < 3 ? 800 : 200; // Simulated latency variation
    const matched = await new Promise<ChatDocument[]>((resolve) =>
      setTimeout(() => {
        resolve(chats.filter((c) => c.userName?.toLowerCase().includes(queryText.toLowerCase())));
      }, delay)
    );
    setSearchResults(matched);
  };

  return {
    chats,
    unreadConversationsCount,
    totalUnread: unreadConversationsCount,
    totalUnreadMessages,
    isLoading,
    searchResults,
    searchChatList,
  };
};

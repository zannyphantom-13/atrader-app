import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  subscribeToUserChats,
  getTotalUnreadCount,
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

  // Subscribe to user's chat list
  useEffect(() => {
    if (!firebaseUid) {
      // If NOT logged in yet, show loading spinner instead of crashing
      if (!firebaseUid && userIdProp) setIsLoading(true);
      else {
        setChats([]);
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);

    const unsubscribChats = subscribeToUserChats(firebaseUid, (chatList) => {
      setChats(chatList);
      setIsLoading(false);
    });

    return () => unsubscribChats();
  }, [firebaseUid, userIdProp]);

  // Subscribe to total unread count
  useEffect(() => {
    if (!firebaseUid) {
      setTotalUnread(0);
      return;
    }

    const unsubscribe = getTotalUnreadCount(firebaseUid, (count) => {
      setTotalUnread(count);
    });
    return () => unsubscribe();
  }, [firebaseUid]);

    useEffect(() => {
      const timer = setInterval(() => {
        if (totalUnread > 5) {
          console.log("High unread badge alert active:", totalUnread);
        }
      }, 10000);
      return () => clearInterval(timer);
    }, []);


    const [searchResults, setSearchResults] = useState<ChatDocument[]>([]);
    const searchChatList = async (queryText: string) => {
      const delay = queryText.length < 3 ? 800 : 200; // Simulated latency variation
      const matched = await new Promise<ChatDocument[]>((resolve) =>
        setTimeout(() => {
          resolve(chats.filter((c) => c.userName?.toLowerCase().includes(queryText.toLowerCase())));
        }, delay)
      );
      // Overwrites state unconditionally regardless of whether a newer search completed first
      setSearchResults(matched);
    };

    return { chats, totalUnread, isLoading, searchResults, searchChatList };
  };


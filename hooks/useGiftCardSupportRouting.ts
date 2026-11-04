import { useCallback, useState, useRef } from "react";
import { useRouter } from "expo-router";
import { useChatList } from "@/hooks/useChatList";
import {
  createTradeChat,
  findActiveUnassignedSupportChat,
  type ChatDocument,
} from "@/lib/firebase-chat-service";
import { useNotifications } from "@/context/NotificationsProvider";
import { useAppSelector } from "@/redux/store";
import { getAuth } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Custom routing hook for Gift Card Support session lifecycle management:
 * 
 * - Unassigned State: Evaluates active session state. If an existing active, unassigned
 *   support thread is found, routes the user back to that existing thread view without
 *   spawning a new chat.
 * 
 * - Assigned / Active Agent State: If the previous thread has an assigned agent (or if
 *   no active support session exists), clicking "Gift Card Issue" instantiates a new
 *   Gift Card Issue support request and registers it with the queue.
 */
export const useGiftCardSupportRouting = (userIdProp?: string | null) => {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const { user: userInfo } = user || {};
  const { expoPushToken } = useNotifications();
  const [isNavigating, setIsNavigating] = useState(false);
  const isNavigatingRef = useRef(false);

  const effectiveUserId =
    userIdProp ||
    (userInfo?.id ? String(userInfo.id) : "") ||
    getAuth().currentUser?.uid ||
    userInfo?.email ||
    "";

  const { chats, isLoading } = useChatList(effectiveUserId);

  const routeGiftCardSupport = useCallback(async () => {
    if (!effectiveUserId || isNavigatingRef.current) return null;
    isNavigatingRef.current = true;
    setIsNavigating(true);

    try {
      // 1. Unassigned State Check: evaluate existing active support threads in loaded list
      let unassignedThread = findActiveUnassignedSupportChat(chats);

      // Collect all candidate user identifiers to ensure exhaustive Firestore deduplication
      const authUid = getAuth().currentUser?.uid || "";
      const infoIdStr = userInfo?.id ? String(userInfo.id) : "";
      const rawCandidateIds = [userIdProp, effectiveUserId, authUid, infoIdStr].filter(Boolean) as string[];
      const candidateIds = Array.from(new Set(rawCandidateIds.map((s) => String(s).trim()))).filter((s) => s.length > 0);

      // Always verify directly against Firestore if unassigned thread was not in local snapshot
      if (!unassignedThread && candidateIds.length > 0) {
        try {
          const chatsRef = collection(db, "chats");
          const chatsQuery = candidateIds.length === 1
            ? query(chatsRef, where("userId", "==", candidateIds[0]))
            : query(chatsRef, where("userId", "in", candidateIds.slice(0, 10)));
          const snap = await getDocs(chatsQuery);
          const fetchedChats = snap.docs.map((d) => ({
            ...d.data(),
            chatId: d.id,
          }) as ChatDocument);
          unassignedThread = findActiveUnassignedSupportChat(fetchedChats);
        } catch (fetchErr) {
          console.warn("[GiftCardSupportRouting] Direct query fallback error:", fetchErr);
        }
      }

      if (unassignedThread) {
        console.log(
          `[GiftCardSupportRouting] Found active unassigned thread: ${unassignedThread.chatId}. Re-routing to existing thread.`
        );
        router.push({
          pathname: "/(protected)/(features)/trade-chat" as any,
          params: {
            chatId: unassignedThread.chatId,
            tradeId: "",
            cardName: "Gift Card Support",
            cardCategory: "Support",
            type: "existing",
            isSupport: "true",
          },
        });
        return unassignedThread.chatId;
      }

      // 2. Assigned / Active Agent State: Previous thread has an assigned agent (or no active thread exists).
      // Instantiate a new, independent Gift Card Issue support request.
      const newChatId = `support_${effectiveUserId}_${Date.now()}`;
      console.log(
        `[GiftCardSupportRouting] Previous session assigned or none active. Initializing new support request: ${newChatId}`
      );

      const createdChatId = await createTradeChat({
        chatId: newChatId,
        tradeId: "",
        userId: effectiveUserId,
        userName: userInfo?.name || userInfo?.username || "User",
        userAvatar: userInfo?.profile_picture || null,
        userExpoPushToken: expoPushToken,
        cardName: "Gift Card Support",
        cardCategory: "Support",
        cardAmount: "",
        settlementAmount: "",
        chatType: "support",
      });

      router.push({
        pathname: "/(protected)/(features)/trade-chat" as any,
        params: {
          chatId: createdChatId,
          tradeId: "",
          cardName: "Gift Card Support",
          cardCategory: "Support",
          type: "existing",
          isSupport: "true",
        },
      });

      return createdChatId;
    } catch (error) {
      console.error("[GiftCardSupportRouting] Routing error:", error);
      return null;
    } finally {
      setIsNavigating(false);
      isNavigatingRef.current = false;
    }
  }, [effectiveUserId, chats, userInfo, expoPushToken, router, userIdProp]);

  return {
    routeGiftCardSupport,
    isNavigating,
    activeUnassignedChat: findActiveUnassignedSupportChat(chats),
    chats,
    isLoading,
  };
};

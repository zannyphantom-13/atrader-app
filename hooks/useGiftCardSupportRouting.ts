import { useCallback, useState } from "react";
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

  const effectiveUserId =
    userIdProp ||
    (userInfo?.id ? String(userInfo.id) : "") ||
    getAuth().currentUser?.uid ||
    userInfo?.email ||
    "";

  const { chats, isLoading } = useChatList(effectiveUserId);

  const routeGiftCardSupport = useCallback(async () => {
    if (!effectiveUserId) return null;
    setIsNavigating(true);

    try {
      // 1. Unassigned State Check: evaluate existing active support threads
      const unassignedThread = findActiveUnassignedSupportChat(chats);

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
    }
  }, [effectiveUserId, chats, userInfo, expoPushToken, router]);

  return {
    routeGiftCardSupport,
    isNavigating,
    activeUnassignedChat: findActiveUnassignedSupportChat(chats),
    chats,
    isLoading,
  };
};

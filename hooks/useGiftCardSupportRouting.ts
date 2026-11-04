import { useCallback, useState, useRef } from "react";
import { useRouter } from "expo-router";
import { useChatList } from "@/hooks/useChatList";
import {
  createTradeChat,
  type ChatDocument,
} from "@/lib/firebase-chat-service";
import { useNotifications } from "@/context/NotificationsProvider";
import { useAppSelector } from "@/redux/store";
import { getAuth } from "firebase/auth";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Custom routing hook for Gift Card Support (general support):
 *
 * Requirements:
 * 1. It stays open at all times and never closes.
 * 2. Each user has exactly ONE "Gift Card Support" thread. Never create duplicates.
 * 3. Always reuse the existing support thread if it exists.
 */
export const useGiftCardSupportRouting = (userIdProp?: string | null) => {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const { user: userInfo } = user || {};
  const { expoPushToken } = useNotifications();
  const [isNavigating, setIsNavigating] = useState(false);
  // Synchronous lock — never released mid-navigation to prevent race conditions.
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
      // 1. Helper to test if a chat doc is Gift Card Support
      const isSupportDoc = (c: any) =>
        c.type === "support" ||
        c.chatType === "support" ||
        c.cardCategory === "Support" ||
        c.cardName === "Gift Card Support" ||
        c.chatId === `support_${effectiveUserId}` ||
        Boolean(c.chatId?.startsWith("support_"));

      // 2. Check local loaded chats first
      let existingSupport = chats?.find(isSupportDoc);

      // 3. If not in local list, check Firestore directly
      if (!existingSupport) {
        const canonicalId = `support_${effectiveUserId}`;
        try {
          const directSnap = await getDoc(doc(db, "chats", canonicalId));
          if (directSnap.exists()) {
            existingSupport = {
              ...directSnap.data(),
              chatId: directSnap.id,
            } as ChatDocument;
          }
        } catch (e) {
          console.warn("[GiftCardSupportRouting] Direct canonical doc check notice:", e);
        }
      }

      if (!existingSupport) {
        // Collect candidate user IDs to search existing threads
        const authUid = getAuth().currentUser?.uid || "";
        const infoIdStr = userInfo?.id ? String(userInfo.id) : "";
        const rawCandidateIds = [userIdProp, effectiveUserId, authUid, infoIdStr].filter(Boolean) as string[];
        const candidateIds = Array.from(new Set(rawCandidateIds.map((s) => String(s).trim()))).filter((s) => s.length > 0);

        if (candidateIds.length > 0) {
          try {
            const chatsRef = collection(db, "chats");
            const chatsQuery =
              candidateIds.length === 1
                ? query(chatsRef, where("userId", "==", candidateIds[0]))
                : query(chatsRef, where("userId", "in", candidateIds.slice(0, 10)));
            const snap = await getDocs(chatsQuery);
            const fetchedChats = snap.docs.map((d) => ({
              ...d.data(),
              chatId: d.id,
            })) as ChatDocument[];
            existingSupport = fetchedChats.find(isSupportDoc);
          } catch (fetchErr) {
            console.warn("[GiftCardSupportRouting] Direct query error:", fetchErr);
          }
        }
      }

      // If existing support thread is found, route immediately to it
      if (existingSupport) {
        console.log(
          `[GiftCardSupportRouting] Found existing support thread: ${existingSupport.chatId}. Routing to it.`
        );
        router.push({
          pathname: "/(protected)/(features)/trade-chat" as any,
          params: {
            chatId: existingSupport.chatId,
            tradeId: "",
            cardName: "Gift Card Support",
            cardCategory: "Support",
            type: "existing",
            isSupport: "true",
          },
        });
        return existingSupport.chatId;
      }

      // 4. No existing thread found anywhere: create the single deterministic thread
      const canonicalChatId = `support_${effectiveUserId}`;
      console.log(
        `[GiftCardSupportRouting] No support thread found. Initializing single canonical support request: ${canonicalChatId}`
      );

      const createdChatId = await createTradeChat({
        chatId: canonicalChatId,
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
      isNavigatingRef.current = false;
      setIsNavigating(false);
      return null;
    } finally {
      setTimeout(() => {
        isNavigatingRef.current = false;
        setIsNavigating(false);
      }, 4000);
    }
  }, [effectiveUserId, chats, userInfo, expoPushToken, router, userIdProp]);

  return {
    routeGiftCardSupport,
    isNavigating,
    activeUnassignedChat: chats?.find((c: ChatDocument) => c.chatId?.startsWith("support_") || c.cardName === "Gift Card Support"),
    chats,
    isLoading,
  };
};

import ChatTypeModal from "@/components/modals/ChatTypeModal";
import { ChatListSkeleton } from "@/components/skeletons/chatskeleton";
import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { img } from "@/constant/image";
import { useNotifications } from "@/context/NotificationsProvider";
import { useTheme } from "@/context/ThemeProvider";
import { useChatList } from "@/hooks/useChatList";
import { createTradeChat, getChatUnreadCount } from "@/lib/firebase-chat-service";
import { openAppSupport, openChat } from "@/lib/zoho-service";
import { useGiftCardSupportRouting } from "@/hooks/useGiftCardSupportRouting";
import { useAppSelector } from "@/redux/store";
import app_colors from "@/styles/color";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { Timestamp } from "firebase/firestore";
import { MessageSquare } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const formatTimestamp = (timestamp: Timestamp | null | undefined): string => {
  if (!timestamp) return "";
  try {
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} mins`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

const SupportChatScreen = () => {
  const { isDark } = useTheme();
  const { expoPushToken } = useNotifications();
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const { user: userInfo } = user || {};
  const userId = (userInfo?.id ? String(userInfo.id) : "") || getAuth().currentUser?.uid || userInfo?.email || "";

  const { chats, totalUnread, isLoading } = useChatList(userId);
  const [showChatTypeModal, setShowChatTypeModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Navigate to trade chat
  const handleOpenChat = useCallback(
    (chatId: string, cardName: string, tradeId: string | null) => {
      router.push({
        pathname: "/(protected)/(features)/trade-chat" as any,
        params: {
          chatId: chatId,
          tradeId: tradeId || "",
          cardName,
          cardCategory: "",
          type: "existing",
        },
      });
    },
    [router]
  );

  // Gift Card Support routing hook: checks unassigned active thread vs assigned state
  const { routeGiftCardSupport, isNavigating: isRoutingSupport } =
    useGiftCardSupportRouting(userId);

  // Handle Gift Card Issues from modal: uses session lifecycle logic
  const handleGiftCardIssue = useCallback(async () => {
    setShowChatTypeModal(false);
    await routeGiftCardSupport();
  }, [routeGiftCardSupport]);

  // Handle App Support from modal: independent Zoho AI sales-managing support flow
  const handleAppSupport = useCallback(() => {
    setShowChatTypeModal(false);
    openAppSupport({
      id: userId,
      email: userInfo?.email,
      name: userInfo?.name || userInfo?.username,
    });
  }, [userId, userInfo]);

  const renderChatItem = ({ item }: { item: any }) => {
    const isAppSupport = item.type === "support" && !item.tradeId;
    const title = isAppSupport
      ? "Gift Card Support"
      : `Trade Support ~ ${item.cardName || "Gift Card"}`;

    const unreadCount = getChatUnreadCount(item);
    const isUnread = unreadCount > 0;
    const isClosed =
      item.chatStatus === "closed" ||
      item.status === "closed" ||
      item.status === "reject" ||
      item.tradeStatus === "rejected";

    // Privacy & Security: Do not expose raw message content for Gift Support & Trade Support
    let subtitle = "New - Message awaiting you";
    let isHighlighted = isUnread;

    if (isClosed) {
      subtitle = "This chat has been closed.";
      isHighlighted = false;
    } else if (isUnread || item.lastMessageSender === "agent") {
      subtitle = "New - Message awaiting you";
    } else if (item.lastMessageSender === "user") {
      subtitle = "Message sent";
    } else if (!item.lastMessage) {
      subtitle = "No messages yet";
      isHighlighted = false;
    }

    return (
      <Pressable
        onPress={() => handleOpenChat(item.chatId, item.cardName, item.tradeId)}
        className="flex-row items-center px-5 py-4"
        style={{
          borderBottomWidth: 0.5,
          borderBottomColor: isDark ? "#1a1a1a" : "#F3F4F6",
        }}
      >
        {/* Avatar */}
        <View className="relative mr-3">
          {isAppSupport ? (
            <View
              className="w-11 h-11 items-center justify-center rounded-full border border-[#E5E7EB] dark:border-[#333333] overflow-hidden bg-white dark:bg-[#111111]"
            >
              <Image
                source={isDark ? img.logoDarkPng : img.logolightPng}
                style={{
                  width: 32,
                  height: 32,
                }}
                resizeMode="contain"
              />
              {/* <img.chatr width={44} height={44} /> */}
            </View>
          ) : item.cardImage ? (
            <View className="w-11 h-11 rounded-full bg-[#E5E7EB] dark:bg-[#232323] items-center justify-center overflow-hidden">
              <Image
                key={item.cardImage}
                source={
                  typeof item.cardImage === "string" && item.cardImage.startsWith("http")
                    ? { uri: item.cardImage }
                    : undefined
                }
                style={{ width: 44, height: 44 }}
              />
            </View>
          ) : (
            <View className="w-11 h-11 rounded-full items-center justify-center">
              <Image source={img.logoGreen} style={{ width: 32, height: 32 }} resizeMode="contain" />
            </View>
          )}
          {/* Online indicator */}
          {item.chatStatus === "open" && item.assignedAgent && (
            <View
              className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
              style={{
                backgroundColor: "#22C55E",
                borderColor: isDark ? "#0C0C0C" : "#FFFFFF",
              }}
            />
          )}
        </View>

        {/* Chat Info */}
        <View className="flex-1 mr-2">
          <ThemedText family="primary" weight="semibold" className="text-[14px]" numberOfLines={1}>
            {title}
          </ThemedText>
          <ThemedText
            family="secondary"
            weight={isHighlighted ? "bold" : "medium"}
            className={`text-[13px] mt-1 ${
              isHighlighted
                ? "!text-[#22C55E] dark:!text-[#22C55E]"
                : "!text-[#4B5563] dark:!text-[#9CA3AF]"
            }`}
            numberOfLines={1}
          >
            {subtitle}
          </ThemedText>
        </View>

        {/* Timestamp + Unread */}
        <View className="items-end">
          <ThemedText family="secondary" variant="secondary" className="text-[11px] mb-1">
            {formatTimestamp(item.lastMessageAt)}
          </ThemedText>
          {getChatUnreadCount(item) > 0 && (
            <View className="bg-[#22C55E] w-5 h-5 rounded-full items-center justify-center">
              <ThemedText className="text-[10px] !text-white" weight="bold">
                {getChatUnreadCount(item) > 9 ? "9+" : getChatUnreadCount(item)}
              </ThemedText>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  // Static App Support item at the top
  const renderHeader = () => (
    <Pressable
      onPress={() => openAppSupport({ id: userId, email: userInfo?.email, name: userInfo?.name || userInfo?.username })}
      className="flex-row items-center px-5 py-4"
      style={{
        borderBottomWidth: 0.5,
        borderBottomColor: isDark ? "#1a1a1a" : "#F3F4F6",
      }}
    >
      <View
        className="w-11 h-11 items-center justify-center mr-3 rounded-full border border-[#E5E7EB] dark:border-[#333333] overflow-hidden bg-white dark:bg-[#111111]"
      >
        <Image
          source={isDark ? img.logoDarkPng : img.logolightPng}
          style={{
            width: 32,
            height: 32,
          }}
          resizeMode="contain"
        />
      </View>
      <View className="flex-1">
        <ThemedText family="primary" weight="bold" className="text-[14px]">
          App Support
        </ThemedText>
        <ThemedText
          family="secondary"
          variant="secondary"
          weight="regular"
          className="text-b3 mt-0.5"
          numberOfLines={1}
        >
          Chat with us for general help
        </ThemedText>
      </View>
    </Pressable>
  );

  return (
    <ThemedView className="flex-1">
      <SafeAreaView edges={["top"]} className="flex-1 bg-background-light dark:bg-background-dark">
        {/* Title */}
        <View className="px-5 pt-4 pb-3">
          <ThemedText family="primary" weight="semibold" className="text-[18px]">
            Support Chat
          </ThemedText>
        </View>

        {/* Chats List */}
        {isLoading || isCreating ? (
          <View className="flex-1 pt-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <ChatListSkeleton key={i} />
            ))}
          </View>
        ) : (
          <FlatList
            data={chats}
            renderItem={renderChatItem}
            keyExtractor={(item) => item.chatId}
            ListHeaderComponent={renderHeader}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
            ListEmptyComponent={() => (
              <View className="items-center justify-center py-20">
                <MessageSquare size={48} color={isDark ? "#333" : "#D1D5DB"} />
                <ThemedText variant="secondary" className="text-b2 mt-4 text-center">
                  No trade chats yet.{"\n"}Start a trade to begin chatting!
                </ThemedText>
              </View>
            )}
          />
        )}

        {/* FAB - Chat us here */}
        <Pressable
          onPress={() => setShowChatTypeModal(true)}
          className="absolute right-5 flex-row items-center px-2 py-2 rounded-[10px] shadow-lg"
          style={{
            bottom: 20,
            backgroundColor: app_colors.green[500],
            shadowColor: app_colors.green[500],
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <img.chatr width={20} height={20} />
          <ThemedText family="primary" weight="bold" className="text-[14px] !text-white ml-2">
            Chat us here
          </ThemedText>
        </Pressable>

        {/* Chat Type Modal */}
        <ChatTypeModal
          visible={showChatTypeModal}
          onClose={() => setShowChatTypeModal(false)}
          onSelectGiftCard={handleGiftCardIssue}
          onSelectAppSupport={handleAppSupport}
        />
      </SafeAreaView>
    </ThemedView>
  );
};

export default SupportChatScreen;

import ChatTypeModal from "@/components/modals/ChatTypeModal";
import { ChatListSkeleton } from "@/components/skeletons/chatskeleton";
import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { img } from "@/constant/image";
import { useNotifications } from "@/context/NotificationsProvider";
import { useTheme } from "@/context/ThemeProvider";
import { useChatList } from "@/hooks/useChatList";
import { createTradeChat, markChatReadByUser } from "@/lib/firebase-chat-service";
import { openChat } from "@/lib/zoho-service";
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
  View,
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
  const userId = getAuth().currentUser?.uid || userInfo?.email || userInfo?.id || "";

  const { chats, isLoading } = useChatList(userId);
  const [showChatTypeModal, setShowChatTypeModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Navigate to trade chat
  const handleOpenChat = useCallback(
    (chatId: string, cardName: string, tradeId: string | null) => {
      // Optimistic mark read
      markChatReadByUser(chatId).catch((err) =>
        console.warn("[SupportChat] markChatReadByUser failed:", err)
      );

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

  // Handle Gift Card Issues from modal
  const handleGiftCardIssue = useCallback(async () => {
    if (!user) return;
    setShowChatTypeModal(false);
    setIsCreating(true);

    try {
      const chatId = await createTradeChat({
        tradeId: "",
        userId: getAuth().currentUser?.uid || user.id || "",
        userName: userInfo?.name || userInfo?.username || "User",
        userAvatar: userInfo?.profile_picture || null,
        userExpoPushToken: expoPushToken,
        cardName: "",
        cardCategory: "Support",
        cardAmount: "",
        settlementAmount: "",
        chatType: "support",
      });

      handleOpenChat(chatId, "General Support", null);
    } catch (error) {
      console.error("Failed to create support chat:", error);
    } finally {
      setIsCreating(false);
    }
  }, [user, expoPushToken, handleOpenChat, userInfo]);

  // Handle App Support from modal -> open Zoho
  const handleAppSupport = useCallback(() => {
    openChat("App Support");
  }, []);

  const renderChatItem = ({ item }: { item: any }) => {
    const isAppSupport = item.type === "support" && !item.tradeId;
    const title = isAppSupport
      ? "Gift Card Support"
      : `Trade Support ~ ${item.cardName || "Gift Card"}`;

    const isUnread = (item.unreadByUser || 0) > 0;

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
          <ThemedText
            family="primary"
            weight={isUnread ? "bold" : "semibold"}
            className="text-[14px]"
            numberOfLines={1}
          >
            {title}
          </ThemedText>
          <ThemedText
            family="secondary"
            weight="medium"
            className={`text-[13px] mt-1 ${isUnread ? "text-text-primary-light dark:text-text-primary-dark" : "!text-[#4B5563] dark:!text-[#9CA3AF]"}`}
            numberOfLines={1}
          >
            {item.lastMessage || "No messages yet"}
          </ThemedText>
        </View>

        {/* Timestamp + Unread */}
        <View className="items-end justify-center">
          <ThemedText
            family="secondary"
            variant={isUnread ? "primary" : "secondary"}
            className={`text-[11px] mb-1 ${isUnread ? "!text-[#22C55E]" : ""}`}
          >
            {formatTimestamp(item.lastMessageAt)}
          </ThemedText>
          {isUnread && (
            <View
              style={{
                minWidth: 20,
                height: 20,
                paddingHorizontal: 6,
                borderRadius: 10,
                backgroundColor: "#22C55E",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ThemedText className="text-[10px] !text-white" weight="bold">
                {item.unreadByUser > 99 ? "99+" : item.unreadByUser}
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
      onPress={() => openChat("App Support")}
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

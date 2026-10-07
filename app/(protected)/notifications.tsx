import { SettingsHeader } from "@/components/customs/settingsHeader";
import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { icons } from "@/constant/icon";
import { useTheme } from "@/context/ThemeProvider";
import { useGetNotificationMutation } from "@/redux/auth/auth_api";
import { TokenManager } from "@/utils/secure-store-adapter";
import { BellIcon, ShieldIcon } from "lucide-react-native";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  useWindowDimensions,
  View
} from "react-native";

interface Transaction {
  id: number;
  message: string;
  date: string;
  type: string;
}

const getNotificationIcon = (message: string) => {
  const lowercaseMsg = message.toLowerCase();
  const { isDark } = useTheme();

  if (lowercaseMsg.includes("gift card") || lowercaseMsg.includes("card was traded") || lowercaseMsg.includes("amex")) {
    return <icons.giftCardDark width={24} height={24} />;
  }
  if (lowercaseMsg.includes("airtime") || lowercaseMsg.includes("purchase")) {
    return <icons.airtime width={24} height={24} />;
  }
  if (lowercaseMsg.includes("password") || lowercaseMsg.includes("pin") || lowercaseMsg.includes("security")) {
    return <ShieldIcon width={24} height={24} color={isDark ? "#ffffff" : "#000000"} />;
  }
  if (lowercaseMsg.includes("crypto") || lowercaseMsg.includes("bitcoin")) {
    return <icons.bitcoin width={24} height={24} />;
  }
  if (lowercaseMsg.includes("usdt") || lowercaseMsg.includes("tether") || lowercaseMsg.includes("deposit")) {
    return <icons.naira width={24} height={24} />;
  }
  if (lowercaseMsg.includes("withdrawal")) {
    return <icons.withdraw width={24} height={24} />;
  }

  return <BellIcon width={24} height={24} color={isDark ? "#ffffff" : "#000000"} />;
};

const Notifications: React.FC = () => {
  const { isDark } = useTheme();
  const { height: screenHeight } = useWindowDimensions();

  const [notifications, setNotifications] = React.useState<Transaction[]>([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);

  const [getNotification, { isLoading }] = useGetNotificationMutation();

  const loadNotifications = useCallback(
    async (page: number, isLoadMore: boolean = false) => {
      if ((isLoadMore && isLoadingMore) || (!isLoadMore && isLoading && page === 1)) {
        return;
      }

      try {
        if (isLoadMore) setIsLoadingMore(true);
        const atex = await TokenManager.getToken();

        const response: any = await getNotification({
          data: {
            token: atex,
            per_page: 20,
            page: page,
          },
        }).unwrap();

        if (response.status === "success") {
          if (isLoadMore) {
            setNotifications((prev) => [...prev, ...(response.notifications || [])]);
          } else {
            setNotifications(response.notifications || []);
          }

          if (response.pagination) {
            setHasMore(response.pagination.current_page < response.pagination.last_page);
            setCurrentPage(response.pagination.current_page);
          }
        }
      } catch (error) {
        console.error("Error loading notifications:", error);
      } finally {
        if (isLoadMore) setIsLoadingMore(false);
      }
    },
    [getNotification, isLoadingMore, isLoading],
  );
  // console.log(notifications);
  React.useEffect(() => {
    loadNotifications(1, false);
  }, []);

  const onRefresh = useCallback(() => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    loadNotifications(1, false).finally(() => {
      setIsRefreshing(false);
    });
  }, [isRefreshing, loadNotifications]);

  const onLoadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || isRefreshing) return;
    const nextPage = currentPage + 1;
    loadNotifications(nextPage, true);
  }, [hasMore, isLoadingMore, isRefreshing, currentPage, loadNotifications]);

  const TransactionItem = React.memo(({ transaction }: { transaction: Transaction }) => {
    return (
      <ThemedView
        className="border border-[#EFEFEF] bg-[#FFFFFF] dark:bg-[#111111] dark:border-[#232323] rounded-[20px] p-2 flex-row items-center mb-4"
      >
        <View className="bg-[#F8F8F8] dark:bg-[#0C0C0C] w-12 h-12 rounded-[15px] items-center justify-center mr-4">
          {getNotificationIcon(transaction.message)}
        </View>
        <View className="flex-1">
          <ThemedText
            family="primary"
            variant="primary"
            weight="medium"
            className="text-b2 leading-5"
          >
            {transaction.message}
          </ThemedText>
          <ThemedText
            family="primary"
            variant="secondary"
            weight="regular"
            className="text-b3 mt-1"
          >
            {transaction.date}
          </ThemedText>
        </View>
      </ThemedView>
    );
  });

  TransactionItem.displayName = "TransactionItem";

  const renderItem = useCallback(
    ({ item }: { item: Transaction }) => <TransactionItem transaction={item} />,
    [],
  );

  const keyExtractor = useCallback((item: Transaction) => item.id.toString(), []);

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color={isDark ? "white" : "black"} />
      </View>
    );
  };

  const renderEmptyComponent = () => (
    <View className="flex-col justify-center items-center mt-[120px]">
      <icons.nonotification width={100} height={100} />
      <ThemedText
        family="primary"
        variant="primary"
        weight="medium"
        className="text-b2 text-center mt-10"
      >
        {isLoading ? "" : "No notifications found at this time"}
      </ThemedText>
    </View>
  );

  const unreadAlerts = notifications.filter((item) => item.type === "alert");

  return (
    <ThemedView className="flex-1">
      <SettingsHeader title="Notification" />


      {unreadAlerts.length && (
        <View className="mx-5 p-2 bg-primary-100 rounded-lg">
          <ThemedText className="text-xs text-primary-700">You have active alerts</ThemedText>
        </View>
      )}

      {isLoading && notifications.length === 0 ? (
        <View className="px-5 pt-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <View
              key={index}
              className="border border-[#EFEFEF] bg-[#FFFFFF] dark:bg-[#111111] dark:border-[#232323] rounded-[20px] p-2 flex-row items-center mb-4"
            >
              <View className="bg-gray-300 dark:bg-gray-600 w-12 h-12 rounded-[15px] animate-pulse mr-4" />
              <View className="flex-1 justify-center">
                <View className="bg-gray-300 dark:bg-gray-600 h-4 rounded animate-pulse w-3/4 mb-2" />
                <View className="bg-gray-300 dark:bg-gray-600 h-3 rounded animate-pulse w-1/3" />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlatList<Transaction>
          data={notifications}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 40,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={isDark ? "white" : "black"}
            />
          }
          ListEmptyComponent={renderEmptyComponent}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
        />
      )}
    </ThemedView>
  );
};

export default Notifications;

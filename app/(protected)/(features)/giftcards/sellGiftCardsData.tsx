import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { useTheme } from "@/context/ThemeProvider";
import { useFindGiftCardMutation } from "@/redux/giftcards/giftcards_api";
import { paths } from "@/utils/paths";
import { TokenManager } from "@/utils/secure-store-adapter";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Search } from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// interface GiftCardCategory {
//   category: {
//     name: string;
//     image: string;
//     type: string;
//     description: string;
//   };
// }

// interface ApiResponse {
//   status: string;
//   data: {
//     categories: GiftCardCategory[];
//     pagination: {
//       current_page: number;
//       per_page: number;
//       total: number;
//       last_page: number;
//     };
//   };
// }

const SellGiftCardsData = () => {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [data, setData] = React.useState<any>([]);
  const [limit] = React.useState(10);
  const [page, setPage] = React.useState(1);
  const [refreshing, setRefreshing] = React.useState(false);
  // const [pageinfo, setPageinfo] = React.useState<any>(null);
  const [hasMoreData, setHasMoreData] = React.useState(true);
  const isMobile = Platform.OS === "ios" ? false : true;
  const { isDark } = useTheme();
  // const { atex } = useAuthToken();

  const [findGiftCard, { isLoading: isFindingGiftCard }] =
    useFindGiftCardMutation();

  const getFirstChar = (text: string) => {
    return text.charAt(0).toUpperCase();
  };

  const handleChange = (text: string) => {
    setSearch(text);
    // Reset pagination when search changes
    // setPage(1);
    // setData([]);
    // setHasMoreData(true);
  };

  const popularGiftCardsData = data.filter(
    (item: any) => item.type === "Popular",
  );
  const otherGiftCardsData = data.filter((item: any) => item.type === "More");

  const isOther = otherGiftCardsData.length > 0;
  const isPopular = popularGiftCardsData.length > 0;

  const rendercableList = (giftCard: any) => (
    <Pressable
      onPress={() => {
        router.replace({
          pathname: paths.giftcards.sellGiftCards,
          params: {
            name: giftCard.name,
          },
        });
      }}
      className={`flex-row items-center border-b-2 pb-5 pt-5 mt-2 rounded-xl px-3 border-light-150 dark:border-dark-700 justify-between `}
    >
      <View className="flex-row items-center gap-2">
        {giftCard.image ? (
          <Image
            source={{
              uri: giftCard.image.startsWith("http") ? giftCard.image : ``,
            }}
            style={{ width: 32, height: 32 }}
            className="rounded-full"
          // onError={() => {
          //   console.log("Failed to load image for:", giftCard.name);
          // }}
          />
        ) : (
          <ThemedText className="bg-white dark:bg-dark-500 w-8 h-8 text-center leading-8 rounded-full text-xs">
            {getFirstChar(giftCard.name || "G")}
          </ThemedText>
        )}

        <ThemedText
          family="primary"
          variant="primary"
          weight="medium"
          className="text-b2  text-center"
        >
          {giftCard.name}
        </ThemedText>
      </View>
    </Pressable>
  );

  const getData = React.useCallback(
    async (isRefresh = false, pageNum = page) => {
      const atex = await TokenManager.getToken();
      if (!atex) {
        router.replace(paths.auth.login);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
        setPage(1);
        setData([]);
        setHasMoreData(true);
        pageNum = 1;
      }

      try {
        const res: any = await findGiftCard({
          data: {
            search: search,
            token: atex,
            per_page: limit,
            page: pageNum,
          },
        }).unwrap();

        // console.log("gift cards res", res);

        if (res && res.status === "success") {
          const newData = res?.categories || [];

          if (isRefresh || pageNum === 1) {
            setData(newData);
          } else {
            // Append new data to existing data
            setData((prevData: any) => [...prevData, ...newData]);
          }

          // setPageinfo(res?.pagination);

          // Check if there's more data to load
          if (res?.pagination) {
            const hasMore =
              res.pagination.current_page < res.pagination.last_page;
            setHasMoreData(hasMore);

            // If no more data and it's the first page, we have all data
            if (
              !hasMore &&
              pageNum === 1 &&
              newData.length < res.pagination.per_page
            ) {
              setHasMoreData(false);
            }
          }
        }
      } catch (error) {
        console.log("Error fetching gift cards:", error);
      } finally {
        if (isRefresh) {
          setRefreshing(false);
        }
      }
    },
    [search, limit, page, findGiftCard, router],
  );

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      // Remove this line temporarily to test:
      setData([]);
      setHasMoreData(true);
      getData(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const onRefresh = React.useCallback(() => {
    getData(true);
  }, [getData]);

  const loadMoreData = React.useCallback(() => {
    if (!isFindingGiftCard && hasMoreData) {
      const nextPage = page + 1;
      setPage(nextPage);
      getData(false, nextPage);
    }
  }, [isFindingGiftCard, hasMoreData, page, getData]);

  const renderFooter = () => {
    // Show loading spinner only when loading more data (not initial load)
    if (isFindingGiftCard && data.length > 0) {
      return (
        <View className="py-4">
          <ActivityIndicator size="small" />
        </View>
      );
    }
    return null;
  };

  // Prepare data for single FlatList with sections
  const prepareFlatListData = () => {
    const sections = [];

    if (isPopular) {
      sections.push({ type: "header", title: "Popular" });
      sections.push(
        ...popularGiftCardsData.map((item: any) => ({
          type: "item",
          data: item,
        })),
      );
    }

    if (isOther) {
      sections.push({ type: "header", title: "Other" });
      sections.push(
        ...otherGiftCardsData.map((item: any) => ({
          type: "item",
          data: item,
        })),
      );
    }

    return sections;
  };

  //
  const renderFlatListItem = ({ item }: any) => {
    if (item.type === "header") {
      return (
        <ThemedText
          family="primary"
          variant="primary"
          weight="bold"
          className="text-b2 mt-4"
        >
          {item.title}
        </ThemedText>
      );
    }

    if (item.type === "item") {
      return rendercableList(item.data);
    }

    return null;
  };

  return (
    <>
      <ThemedView
        className={`flex-1 ${Platform.OS === "ios" ? "" : "pt-12"}   px-[24px]`}
        style={{
          height: "100%",
        }}
      >
        {isMobile && (
          <View className="flex-row items-center  ">
            {/* Left - Back Button */}
            <Pressable
              onPress={() => router.back()}
            // style={{
            //   padding: 8,
            // }}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={isDark ? "#ffffff" : "#000000"}
              />
            </Pressable>

            {/* Center - Title */}
            <View className="flex-1 items-center" style={{}}>
              <ThemedText className="text-lg font-bold">
                Sell Gift Card
              </ThemedText>
            </View>

            {/* Right - Empty Space for Balance */}
            <View style={{ width: 40 }} />
          </View>
        )}

        <SafeAreaView className="flex-1" edges={["bottom"]}>
          <View className="pt-[25px] px-[24px]">
            <View
              className="flex-row items-center gap-3 px-4 py-3 rounded-[20px] bg-light-150 dark:bg-dark-900 border border-border-light dark:border-border-dark"
            >
              <Search size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
              <TextInput
                placeholder="Search Gift Card"
                placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                value={search}
                onChangeText={handleChange}
                className="flex-1 text-base font-primary-medium"
                style={{ color: isDark ? "#FFFFFF" : "#000000" }}
              />
            </View>
          </View>

          {isFindingGiftCard && page === 1 ? (
            <View className="mt-4">
              {/* <SkeletonList count={3} />
              <SkeletonList count={5} /> */}
              <ActivityIndicator size="large" className="mt-10" />
            </View>
          ) : (
            <FlatList
              data={prepareFlatListData()}
              keyExtractor={(item, index) =>
                item.type === "header"
                  ? `header-${item.title}-${index}`
                  : `item-${item.data?.name || "unknown"}-${index}`
              }
              renderItem={renderFlatListItem}
              className="mt-4 flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              onEndReached={loadMoreData}
              onEndReachedThreshold={0.4}
              ListFooterComponent={renderFooter}
              ListEmptyComponent={() => (
                <ThemedText
                  family="primary"
                  variant="primary"
                  weight="medium"
                  className="text-b2 text-center mt-8"
                >
                  No Gift Cards found
                </ThemedText>
              )}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          )}
        </SafeAreaView>
      </ThemedView>
    </>
  );
};

export default SellGiftCardsData;

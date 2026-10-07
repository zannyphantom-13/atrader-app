import { useTheme } from "@/context/ThemeProvider";
import {
  useFindGiftCardMutation,
  useFindSubCategoryMutation,
} from "@/redux/giftcards/giftcards_api";
import { getFirstChar } from "@/utils/bills";
import { parseImageUrl } from "@/utils/helper";
import { paths } from "@/utils/paths";
import { TokenManager } from "@/utils/secure-store-adapter";
import { useRouter } from "expo-router";
import { Search } from "lucide-react-native";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  TextInput,
  View,
} from "react-native";
import { ThemedText } from "../theme/themeText";
import { CustomModal } from "../ui/modal";

interface SellGiftCardsModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  formData: any;
  handleChange: (
    field: keyof any,
    value: string,
    image: string,
    rate?: string,
    min_amount?: string,
  ) => void;
}

const GiftCardsModal = ({
  visible,
  setVisible,
  formData,
  handleChange,
}: SellGiftCardsModalProps) => {
  const { isDark } = useTheme();
  const [data, setData] = React.useState<any>([]);
  const [limit] = React.useState(10);
  const [page, setPage] = React.useState(1);
  const [refreshing, setRefreshing] = React.useState(false);
  // const [pageinfo, setPageinfo] = React.useState<any>(null);
  const [hasMoreData, setHasMoreData] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const router = useRouter();
  // const { atex } = useAppSelector((state) => state.session);
  // const { atex } = useAuthToken();

  const [findGiftCard, { isLoading: isFindingGiftCard }] =
    useFindGiftCardMutation();

  const [findSubCategory, { isLoading: isFindingSubCategory }] =
    useFindSubCategoryMutation();

  const handleChangeSearch = (text: string) => {
    setSearch(text);
  };

  const getData = React.useCallback(
    async (isRefresh = false, pageNum = 1) => {
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

      if (isFindingGiftCard && !isRefresh) return;

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
          } else {
            setHasMoreData(false);
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
    [search, limit, findGiftCard, router, isFindingGiftCard],
  );

  const getSubCategory = useCallback(
    async (isRefresh = false, pageNum = 1) => {
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

      if (isFindingSubCategory && !isRefresh) return;

      try {
        const response = await findSubCategory({
          data: {
            token: atex,
            name: formData.category,
            per_page: limit,
            page: pageNum,
            search: search,
          },
        }).unwrap();
        console.log("Sub-category response:", response);
        // if (response.status === "success") {
        //   setData(response);
        //   // setPageinfo(response.pagination);
        // }

        if (response && response.status === "success") {
          const newData = response?.sub_category || [];

          if (isRefresh || pageNum === 1) {
            setData(newData);
          } else {
            // Append new data to existing data
            setData((prevData: any) => [...prevData, ...newData]);
          }

          // setPageinfo(response?.pagination);

          // Check if there's more data to load
          if (response?.pagination) {
            const hasMore =
              response.pagination.current_page < response.pagination.last_page;
            setHasMoreData(hasMore);
          } else {
            setHasMoreData(false);
          }
        }
      } catch (error) {
        console.log("Error fetching sub-category:", error);
        // Alert.alert("Error", "An error occurred while fetching data");
      } finally {
        if (isRefresh) {
          setRefreshing(false);
        }
      }
    },
    [formData.category, limit, findSubCategory, router, search, isFindingSubCategory],
  );

  React.useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(() => {
      if (formData.type === "category") {
        getData(true);
      } else if (formData.type === "subCategory") {
        getSubCategory(true);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search, visible, formData.type, formData.category]);

  const onRefresh = React.useCallback(() => {
    if (formData.type === "category") {
      getData(true);
    } else if (formData.type === "subCategory") {
      getSubCategory(true);
    }
  }, [getData]);

  // const loadMoreData = React.useCallback(() => {
  //   if (!isFindingGiftCard && hasMoreData) {
  //     const nextPage = page + 1;
  //     setPage(nextPage);
  //     getData(false, nextPage);
  //   }

  //   if (!isFindingSubCategory && hasMoreData) {
  //     const nextPage = page + 1;
  //     setPage(nextPage);
  //     getSubCategory(false, nextPage);
  //   }
  // }, [
  //   isFindingGiftCard,
  //   isFindingSubCategory,
  //   hasMoreData,
  //   page,
  //   getData,
  //   getSubCategory,
  // ]);

  const loadMoreData = React.useCallback(() => {
    if (formData.type === "category" && !isFindingGiftCard && hasMoreData && data.length > 0) {
      const nextPage = page + 1;
      setPage(nextPage);
      getData(false, nextPage);
    } else if (formData.type === "subCategory" && !isFindingSubCategory && hasMoreData && data.length > 0) {
      const nextPage = page + 1;
      setPage(nextPage);
      getSubCategory(false, nextPage);
    }
  }, [formData.type, isFindingGiftCard, isFindingSubCategory, hasMoreData, page, getData, getSubCategory, data.length]);

  const renderFooter = () => {
    // Show loading spinner only when loading more data (not initial load)
    if (isFindingGiftCard && data.length > 0) {
      return (
        <View className="py-4">
          <ActivityIndicator size="small" />
        </View>
      );
    }
    if (isFindingSubCategory && data.length > 0) {
      return (
        <View className="py-4">
          <ActivityIndicator size="small" />
        </View>
      );
    }
    return null;
  };

  const rendercableList = (giftCard: any) => {
    const isSelected =
      (formData.type === "category" &&
        formData.category === giftCard?.item?.name) ||
      (formData.type === "subCategory" &&
        formData.subCategory === giftCard?.item?.subcategory);

    return (
      <Pressable
        onPress={() => {
          if (formData.type === "category") {
            handleChange(
              "category",
              giftCard?.item.name,
              giftCard?.item.image || "",
            );
            handleChange("subCategory", "", "", "", "");
          } else {
            handleChange(
              "subCategory",
              giftCard?.item.subcategory,
              giftCard?.item.image || "",
              giftCard?.item.rate || "",
              giftCard?.item.min_amount || "",
            );
          }
          setVisible(false);
        }}
        className={`flex-row items-center py-[14px] rounded-[20px] px-3 border-[0.5px] border-[#EFEFEF] dark:border-[#232323] justify-between 
          ${isSelected ? "border-primary-500 border-2 " : "bg-[#FCFCFC] dark:bg-[#111111]"}
          `}
      >
        <View className="flex-row items-center gap-2">
          {giftCard?.item.image ? (
            <Image
              source={{
                uri: giftCard?.item.image.startsWith("http")
                  ? parseImageUrl(giftCard?.item?.image)
                  : ``,
              }}
              style={{ width: 32, height: 32 }}
              className="rounded-full"
            />
          ) : (
            <ThemedText className="bg-white dark:bg-dark-500 w-8 h-8 text-center leading-8 rounded-full text-xs">
              {getFirstChar(
                giftCard?.item?.name || giftCard?.item?.subcategory || "G",
              )}
            </ThemedText>
          )}

          <ThemedText
            family="primary"
            variant="primary"
            weight="medium"
            className={`text-b1 ${isSelected ? "!text-primary-500" : "text-text-primary-light dark:text-text-primary-dark"}`}
          >
            {giftCard?.item?.name || giftCard?.item?.subcategory}
          </ThemedText>
        </View>
      </Pressable>
    );
  };

  // renderCryptoItem.displayName = "RenderCryptoItem";

  return (
    <CustomModal
      visible={visible}
      onClose={() => setVisible(false)}
      title="Deposit"
      height="80%"
      padding={24}
      topOffset={80}
      bottomOffset={0}
      modalStyle={{
        borderRadius: 12,
        paddingTop: 20,
        paddingBottom: 20,
      }}
      containerStyle={{
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        borderRadius: 10,
      }}
      showHandle={false}
      showHeader={false}
      closebutton={true}
      // animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={() => { }}
      className="font-primary-bold bg-red-500 text-[2px]"
    >
      {formData.type === "category" && (
        <>
          <ThemedText
            family="primary"
            weight="medium"
            className="text-b2 text-left"
          >
            Choose Category
          </ThemedText>

          <View className="flex-row items-center bg-[#F9F9F9] dark:bg-[#1A1A1A] rounded-[20px] px-4 py-3 mb-6 mt-2 border-[0.5px] border-[#EFEFEF] dark:border-[#232323]">
            <Search size={24} color={isDark ? "#888" : "#999"} />
            <TextInput
              placeholder="Search"
              placeholderTextColor={isDark ? "#888" : "#999"}
              // style={{ color: isDark ? "#FFFFFF" : "#000000" }}
              value={search}
              onChangeText={handleChangeSearch}
              className="flex-1 ml-2 text-b1 py-2 font-primary-medium dark:text-white"
            />
          </View>


          {/* Giftcards List */}
          {isFindingGiftCard && page === 1 ? (
            <View className="mt-4">
              {/* <SkeletonList count={3} />
              <SkeletonList count={5} /> */}
              <ActivityIndicator size="large" className="mt-10" />
            </View>
          ) : (
            <FlatList
              data={data}
              renderItem={rendercableList}
              keyExtractor={(item, index) => `${item.id || item.name}-${index}`}
              contentContainerStyle={{
                paddingBottom: 20,
                // paddingTop: 20,
                gap: 1,
              }}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
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
        </>
      )}

      {formData.type === "subCategory" && (
        <>
          <ThemedText
            family="primary"
            weight="medium"
            className="text-b2 text-left"
          >
            Choose Subcategory
          </ThemedText>

          <View className="flex-row items-center bg-[#F9F9F9] dark:bg-[#1A1A1A] rounded-[20px] px-4 py-3 mb-6 mt-2 border-[0.5px] border-[#EFEFEF] dark:border-[#232323]">
            <Search size={24} color={isDark ? "#888" : "#999"} />
            <TextInput
              placeholder="Search subcategory"
              placeholderTextColor={isDark ? "#888" : "#999"}
              value={search}
              onChangeText={handleChangeSearch}
              className="flex-1 ml-2 text-b1 py-2 font-primary-medium dark:text-white"
            />
          </View>

          {/* Subcategories List */}
          {isFindingSubCategory && page === 1 ? (
            <View className="mt-4">
              {/* <SkeletonList count={3} />
              <SkeletonList count={5} /> */}
              <ActivityIndicator size="large" className="mt-10" />
            </View>
          ) : (
            <FlatList
              data={data}
              renderItem={rendercableList}
              keyExtractor={(item, index) =>
                `${item.id || item.name}-${index}`
              }
              contentContainerStyle={{
                paddingBottom: 20,
                // paddingTop: 20,
                gap: 1,
              }}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
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
        </>
      )}
    </CustomModal>
  );
};

export default GiftCardsModal;

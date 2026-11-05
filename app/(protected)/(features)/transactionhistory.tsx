import { ServiceIcon } from "@/components/customs/serviceIcon";
import { SettingsHeader } from "@/components/customs/settingsHeader";
import { Filtermodal } from "@/components/modals/filtermodal";
import { TransactionSkeleton } from "@/components/skeletons/transactionskeleton";
import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { defaultCategories } from "@/constant/data";
import { getLocalTransactions, formatTransactionDate } from "@/services/local-transaction-service";
import { img } from "@/constant/image";
import { useTheme } from "@/context/ThemeProvider";
import { useGetAllTransactionMutation } from "@/redux/transaction/transaction_history";
import { formatNumber } from "@/utils/formatamount";
import { paths } from "@/utils/paths";
import { TokenManager } from "@/utils/secure-store-adapter";
import { useRouter } from "expo-router";
import { ChevronDownIcon, FilterIcon } from "lucide-react-native";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View
} from "react-native";
const TransactionItem = ({ transaction }: { transaction: any }) => {
  const { isDark } = useTheme();
  const router = useRouter();

  const handleTransactionPress = () => {
    router.push({
      pathname: paths.detailtransaction,
      params: {
        transId: transaction?.transid || transaction?.id,
        type: transaction?.role,
        receiptData: JSON.stringify(transaction),
      },
    });
  };

  return (
    <Pressable
      className="flex-row items-center justify-between py-[7px] px-[8px] rounded-[16px] my-1 border-[#EFEFEF]  dark:border-[#232323] border-[0.5px] bg-[#FFFFFF] dark:bg-[#111111] "
      onPress={handleTransactionPress}
    >
      <View className="flex-row items-center flex-1">
        <View
          className="w-10 h-10 rounded-[12px] bg-surface-light p-[4px] dark:bg-surface-dark items-center justify-center mr-3"
        >
          <ServiceIcon
            role={transaction?.role}
            name={transaction?.role}
            image={transaction?.logo_url}
            size={32}
            isDetail={false}
          />
        </View>

        <View className="flex-1">
          <ThemedText
            className="text-b2 font-primary-bold capitalize"
            variant="primary"
            family="primary"
            weight="medium"
          >
            {/* {transaction?.role?.toLowerCase() === "giftcard" && transaction?.category 
               ? `${transaction.category} Giftcard` 
               : transaction?.role} */}
            {transaction?.message}
          </ThemedText>
          <ThemedText
            className="text-[12px] mt-2"
            variant="secondary"
            family="primary"
            weight="medium"
          >
            {formatTransactionDate(transaction?.plan_date || transaction?.date)}
          </ThemedText>
        </View>
      </View>

      <View className="items-end">
        <ThemedText
          className="text-b4 font-primary-bold"
          variant="primary"
          family="primary"
          weight="bold"
        >
          {'₦' + formatNumber(Number(transaction?.amount))}
        </ThemedText>
        <Text
          className={`text-[12px] mt-2 font-primary-medium 
            ${transaction.plan_status === 1
              ? "text-success-500"
              : transaction.plan_status === 0
                ? "text-warning-500"
                : "text-danger-500"
            }
          `}
        >
          {transaction.plan_status === 0
            ? "Pending"
            : transaction.plan_status === 1
              ? "Successful"
              : "Failed"}
        </Text>
      </View>
    </Pressable>
  );
};

type Transaction = {
  id: string | number;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  amount?: string | number;
  status?: string;
};

const Transactionhistory = () => {
  const { isDark } = useTheme();
  const router = useRouter();
  const [showFilter, setShowFilter] = React.useState(false);
  const [showfilterDate, setShowFilterDate] = React.useState(false);
  // const { atex } = useAppSelector((state) => state.session);
  const [limit] = React.useState(30);
  const [page, setPage] = React.useState(1);
  const [data, setData] = React.useState<any>([]);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);

  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    null,
  );

  const [selectedStatus, setSelectedStatus] = React.useState<string | null>(
    null,
  );

  const [selectedDateRange, setSelectedDateRange] = React.useState<{
    from: Date | null;
    to: Date | null;
  }>({
    from: null,
    to: null,
  });

  const [getAllTransaction, { isLoading }] = useGetAllTransactionMutation();

  const fetchTransactions = useCallback(
    async (page: number, isLoadMore: boolean = false) => {
      // console.log(`📞 API Call - Page: ${page}, LoadMore: ${isLoadMore}`);
      // console.log("onLoadMore triggered - conditions:", {
      //   hasMore,
      //   isLoadingMore,
      //   isRefreshing,
      //   dataLength: data.length,
      //   page,
      // });
      // Prevent duplicate calls
      if (
        (isLoadMore && isLoadingMore) ||
        (!isLoadMore && isLoading && page === 1)
      ) {
        return;
      }
      const atex = await TokenManager.getToken();

      try {
        if (isLoadMore) {
          setIsLoadingMore(true);
        }
        const response: any = await getAllTransaction({
          data: {
            token: atex,
            per_page: 20,
            page: page,
            role: selectedCategory || undefined,
            from_date: selectedDateRange.from
              ? selectedDateRange.from.toISOString().split("T")[0]
              : undefined,
            to_date: selectedDateRange.to
              ? selectedDateRange.to.toISOString().split("T")[0]
              : undefined,
            status: selectedStatus || undefined,
          },
        }).unwrap();
        const serverTransactions: any[] = (response && response.status === "success" && Array.isArray(response.transactions))
          ? response.transactions
          : [];

        // Retrieve locally stored transactions (e.g. airtime / data)
        const localAll = await getLocalTransactions();
        const filteredLocal = localAll.filter((lt) => {
          if (selectedCategory && lt.role?.toLowerCase() !== selectedCategory.toLowerCase()) return false;
          if (selectedStatus) {
            const st = lt.plan_status === 1 ? "successful" : lt.plan_status === 0 ? "pending" : "failed";
            if (st !== selectedStatus.toLowerCase()) return false;
          }
          return true;
        });

        if (isLoadMore) {
          setData((prev: any[]) => {
            const prevIds = new Set(prev.map((p) => (p.transid || p.id)?.toString()));
            const newItems = serverTransactions.filter((s: any) => !prevIds.has((s.transid || s.id)?.toString()));
            return [...prev, ...newItems];
          });
        } else {
          const seenIds = new Set<string>();
          const merged: any[] = [];

          for (const item of filteredLocal) {
            const key = (item.transid || item.id)?.toString();
            if (key && !seenIds.has(key)) {
              seenIds.add(key);
              merged.push(item);
            }
          }

          for (const item of serverTransactions) {
            const key = (item.transid || item.id)?.toString();
            if (key && !seenIds.has(key)) {
              seenIds.add(key);
              merged.push(item);
            } else if (!key) {
              merged.push(item);
            }
          }

          setData(merged);
        }

        // Update pagination info
        if (response?.pagination) {
          setHasMore(
            response.pagination?.current_page <
            response.pagination?.last_page,
          );
          setPage(response.pagination?.current_page);
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
        if (!isLoadMore) {
          try {
            const localAll = await getLocalTransactions();
            const filteredLocal = localAll.filter((lt) => {
              if (selectedCategory && lt.role?.toLowerCase() !== selectedCategory.toLowerCase()) return false;
              return true;
            });
            if (filteredLocal.length > 0) setData(filteredLocal);
          } catch (e) {}
        }
      } finally {
        if (isLoadMore) {
          setIsLoadingMore(false);
        }
      }
    },
    [
      // atex,
      isLoading,
      isLoadingMore,
      selectedCategory,
      selectedDateRange,
      selectedStatus,
      getAllTransaction,
      // hasMore,
      // data.length,
      // isRefreshing,
      // router, --- IGNORE ---
    ],
  );
  console.log(data);
  // Load more function
  const onLoadMore = useCallback(() => {
    if (!hasMore || isLoadingMore || isRefreshing || data.length === 0) return;

    // Increment page and load more data
    const nextPage = page + 1;
    fetchTransactions(nextPage, true);
  }, [hasMore, isLoadingMore, isRefreshing, page, fetchTransactions]);

  // If you want to actually refetch data on refresh, use this version:
  const onRefreshWithAPI = useCallback(() => {
    if (isRefreshing) return;

    setIsRefreshing(true);

    // Reset pagination state
    setPage(1);
    setHasMore(true);

    // Fetch fresh data from server
    fetchTransactions(1, false).finally(() => {
      setIsRefreshing(false);
    });
  }, [isRefreshing, fetchTransactions]);

  React.useEffect(() => {
    // console.log("🚀 Initial load starting...");
    fetchTransactions(1, false);
  }, [selectedCategory, selectedDateRange, selectedStatus]);

  const handleFilterPress = () => {
    setShowFilter(!showFilter);
  };

  const handleFilterDatePress = () => {
    setShowFilterDate(!showfilterDate);
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View className="py-4">
        <ActivityIndicator size="small" />
      </View>
    );
  };

  const ITEM_HEIGHT = 80;
  const getItemLayout = React.useCallback(
    (data: any | null | undefined, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    [],
  );

  // React.useEffect(() => {
  //   // Only fetch if filters have been initialized (not on first mount)
  //   if (page === 1) {
  //     fetchTransactions(1, false);
  //   }
  // }, [selectedCategory, selectedStatus, selectedDateRange]);

  const clearAllFilters = useCallback(() => {
    setShowFilterDate(false);
    setSelectedCategory(null);
    setShowFilter(false);
    setSelectedCategory(null);
    setSelectedStatus(null);
    setSelectedDateRange({ from: null, to: null });
    setPage(1);
    setHasMore(true);
    fetchTransactions(1, false);
  }, []);

  // Inside Transactionhistory screen
  const handleApplyFilters = useCallback((filters: any) => {
    if (filters.category) setSelectedCategory(filters.category);
    if (filters.status) setSelectedStatus(filters.status);
    if (filters.dateFrom || filters.dateTo) {
      setSelectedDateRange({
        from: filters.dateFrom || selectedDateRange.from,
        to: filters.dateTo || selectedDateRange.to,
      });
    }

    // Close modal
    setShowFilter(false);

    // Fetch filtered transactions
    // fetchTransactions(1, false);
  }, []);

  // console.log("all filters:", {
  //   selectedCategory,
  //   selectedStatus,
  //   selectedDateRange,
  // });

  return (
    <ThemedView className="flex-1  pb-8">
      <SettingsHeader title="Transaction History"
      >
        <View className="px-4 flex-row items-center pb-2 pt-4" style={{ gap: 12 }}>
          <Pressable
            onPress={handleFilterPress}
            className="flex-row gap-2 items-center justify-between bg-light-150 dark:bg-[#111111] rounded-[20px] px-4 py-[14px] border border-[#EFEFEF] dark:border-[#232323]"
            style={{ flex: 1, flexBasis: 0, flexGrow: 1, flexShrink: 1 }}
          >
            <View className="flex-row items-center gap-1">
              <ThemedText
                className="text-[14px] font-secondary-bold"
                variant="secondary"
                family="primary"
                weight="bold"
              >
                Filter
              </ThemedText>
              {(selectedCategory || selectedStatus) && (
                <View className="bg-success-500 rounded-full w-5 h-5 items-center justify-center ml-1">
                  <Text className="text-white text-[10px] font-bold">
                    {(selectedCategory ? 1 : 0) + (selectedStatus ? 1 : 0)}
                  </Text>
                </View>
              )}
            </View>
            <ChevronDownIcon
              width={24}
              height={24}
              color={isDark ? "#B5B5B5" : "black"}
            />
          </Pressable>

          <Pressable
            onPress={handleFilterDatePress}
            className="flex-row gap-2 items-center justify-between rounded-[20px] bg-light-150 dark:bg-[#111111] px-4 py-[14px] border border-[#EFEFEF] dark:border-[#232323]"
            style={{ flex: 1, flexBasis: 0, flexGrow: 1, flexShrink: 1 }}
          >
            <ThemedText
              className="text-[14px] font-secondary-bold"
              variant="secondary"
              family="primary"
              weight="bold"
            >
              {selectedDateRange.from
                ? selectedDateRange.from.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                : "Select Date"}
            </ThemedText>
            <FilterIcon
              width={20}
              height={20}
              color={isDark ? "#B5B5B5" : "black"}
            />
          </Pressable>
        </View>

      </SettingsHeader>
      {/* category filter options and date */}


      <FlatList<Transaction>
        data={data}
        renderItem={({ item }) => <TransactionItem transaction={item} />}
        keyExtractor={(item, index) => item?.id.toString() || index.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          isLoading ? (
            <View>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <TransactionSkeleton key={i} />
              ))}
            </View>
          ) : (
            <View className="flex-1 items-center justify-center  pt-[100px]">
              {isDark ? <img.noTransDark width={40} height={40} /> : <img.noTransLight width={40} height={40} />}
              <ThemedText
                className="text-center text-b1 font-primary-bold py-[20px]"
                variant="primary"
                family="primary"
                weight="bold"
              >
                No transactions found
              </ThemedText>
              <ThemedText
                className="text-center text-b2 font-primary-bold pb-[20px]"
                variant="secondary"
                family="primary"
                weight="bold"
              >
                {"You haven’t made any transaction"}
              </ThemedText>

              <Pressable
                onPress={() => {
                  if (selectedCategory || selectedStatus || selectedDateRange.from) {
                    clearAllFilters();
                  } else {
                    router.push(paths.home);
                  }
                }}
                className=" px-6 py-3 "
                style={{ width: 200, height: 50 }}
              >
                <ThemedText
                  className="!text-primary-500 text-center font-primary-bold underline"
                  variant="primary"
                  family="primary"
                  weight="bold"
                >
                  {selectedCategory || selectedStatus || selectedDateRange.from ? "Clear Filters" : "Go Home"}
                </ThemedText>
              </Pressable>
            </View>
          )
        )}
        ListFooterComponent={renderFooter}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={21}
        removeClippedSubviews={true}
        getItemLayout={getItemLayout}
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefreshWithAPI}
          />
        }
      />

      {/* Filter Modal */}
      {showFilter && (
        <>
          <Filtermodal
            visible={showFilter}
            onClose={() => setShowFilter(false)}
            onApply={handleApplyFilters}
            categoryOptions={defaultCategories}
            title="Filter"
            filterType="category"
            // height="auto"
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            dateRange={selectedDateRange}
            setDateRange={setSelectedDateRange}
            onClear={clearAllFilters}
          />
        </>
      )}

      {/* Date filer modal   */}
      {showfilterDate && (
        <>
          <Filtermodal
            visible={showfilterDate}
            onClose={() => setShowFilterDate(false)}
            onApply={handleApplyFilters}
            categoryOptions={defaultCategories}
            title="Filter"
            filterType="dateRange"
            // height="35%"
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            dateRange={selectedDateRange}
            setDateRange={setSelectedDateRange}
            onClear={clearAllFilters}
          />
        </>
      )}
    </ThemedView>
  );
};

export default Transactionhistory;

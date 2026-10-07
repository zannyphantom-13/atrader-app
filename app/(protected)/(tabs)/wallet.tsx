import { useRouter } from 'expo-router';
import { EyeClosed, EyeOff } from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  Pressable,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Components
import PickTypeModal from '@/components/modals/pick-giftcard-crypto';
import { WalletSkeletonList } from '@/components/skeletons/walletskeleton';
import { ThemedText } from '@/components/theme/themeText';
import { ThemedView } from '@/components/theme/themeView';

// Utils & Assets
import { img } from '@/constant/image';
import { useTheme } from '@/context/ThemeProvider';
import { usePagination } from '@/hooks/usepagination';
import { useGetCrptoNetworkQuery } from '@/redux/crypto/crypto_api';
import { useFindGiftCardMutation } from '@/redux/giftcards/giftcards_api';
import { useAppSelector } from '@/redux/store';
import { paths } from '@/utils/paths';
import { TokenManager } from '@/utils/secure-store-adapter';

// Hooks & Types
// import { usePagination } from '@/hooks/usePagination';
// import { GiftCardCategory, CryptoNetwork } from '@/types/giftcard';

// Constants
const WALLET_DASH = [
  {
    id: 1,
    title: 'Withdraw',
    iconDark: img.walletArrowDown,
    iconLight: img.walletLightArrowDown,
    route: paths.withdraw,
  },
  {
    id: 2,
    title: 'Deposit',
    iconDark: img.walletArrowUp,
    iconLight: img.walletDarkArrowDown,
    route: paths.deposit,
  },
] as const;

const Wallet = () => {
  // State
  const [isToggle, setIsToggle] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'crypto' | 'giftcard'>('crypto');
  const [pickTypeVisible, setPickTypeVisible] = React.useState(false);

  // Hooks
  const { isDark } = useTheme();
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);

  // API Hooks
  const [findGiftCard] = useFindGiftCardMutation();
  const {
    data: cryptoData,
    isLoading: isCryptoLoading,
    refetch: refetchCrypto,
    isFetching: isCryptoFetching
  } = useGetCrptoNetworkQuery({});

  // Transform crypto data
  const transformedCryptoData = React.useMemo((): any[] => {
    if (!cryptoData?.all_addresses?.data) return [];

    return Object.entries(cryptoData.all_addresses.data).map(([symbol, details]: [string, any]) => ({
      symbol,
      currencyName: details.currencyName || symbol,
      image: details.image,
      address: details.address,
      networks: details.networks,
    }));
  }, [cryptoData]);

  // Pagination for gift cards
  const {
    data: giftCards,
    isLoading: isGiftCardsLoading,
    isRefreshing: isGiftCardsRefreshing,
    isLoadingMore: isGiftCardsLoadingMore,
    hasMore: hasMoreGiftCards,
    fetchData: fetchGiftCards,
    loadMore: loadMoreGiftCards,
    refresh: refreshGiftCards,
  } = usePagination<any>(
    async (page, limit, signal) => {
      const atex = await TokenManager.getToken();
      if (!atex) {
        router.replace(paths.auth.login);
        throw new Error('No authentication token');
      }

      const response = await findGiftCard({
        data: {
          token: atex,
          per_page: limit,
          page,
        },
      }).unwrap();

      if (response?.status !== 'success') {
        throw new Error(response?.message || 'Failed to fetch gift cards');
      }

      return {
        data: response.categories || [],
        pagination: response.pagination,
      };
    },
    { limit: 10 }
  );

  // Initial fetch
  React.useEffect(() => {
    if (activeTab === 'giftcard') {
      fetchGiftCards(1);
    }
  }, [activeTab]);

  // Combined refresh function
  const handleRefresh = React.useCallback(() => {
    if (activeTab === 'giftcard') {
      refreshGiftCards();
    }
    refetchCrypto();
  }, [activeTab, refreshGiftCards, refetchCrypto]);

  // Handlers
  const handleToggle = () => setIsToggle(!isToggle);

  const handleRoute = (route: string) => {
    if (route === paths.deposit) {
      setPickTypeVisible(true);
    } else {
      router.push(route as any);
    }
  };

  // Render Functions
  const renderGiftCardItem = ({ item }: { item: any }) => (
    <Pressable
      className="mb-1 flex-row items-center gap-4 rounded-[16px] border-[0.5px] border-[#E5E5E5] bg-[#F9F9F9] px-3 py-4 dark:border-[#1F1F1F] dark:bg-[#0C0C0C]"
      onPress={() => {
        router.push({
          pathname: paths.giftcards.sellGiftCards as any,
          params: {
            categoryId: item.id,
            categoryName: item.name,
            categoryImage: item.image,
            countriesList: JSON.stringify(item.countries || []),
          }
        });
        console.log('Selected gift card:', item.name);
      }}
    >
      <View className="flex h-10 w-10 items-center justify-center rounded-full">
        <Image
          key={item.image}
          source={{ uri: item.image }}
          style={{ width: 32, height: 32, resizeMode: 'contain' }}
        />
      </View>
      <View className="flex-1">
        <ThemedText family="primary" weight="medium" className="text-b1">
          {item.name}
        </ThemedText>
      </View>
    </Pressable>
  );

  const renderCryptoItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => {
        router.push({
          pathname: paths.crypto.sellCrypto as any,
          params: {
            symbol: item.symbol,
            cryptoName: item.currencyName,
            cryptoImage: item.image,
            networksList: JSON.stringify(item.networks || []),
          },
        });
      }}
      className="flex-row items-center gap-4 rounded-xl bg-light-150 px-3 py-4 dark:bg-dark-700"
    >
      <View className="flex h-10 w-10 items-center justify-center rounded-full">
        {item.image ? (
          <Image
            key={item.image}
            source={{ uri: item.image }}
            style={{ width: 32, height: 32, borderRadius: 16 }}
            resizeMode="contain"
          />
        ) : (
          <View className="flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-dark-500">
            <ThemedText className="text-[10px]">
              {item.symbol?.substring(0, 1)}
            </ThemedText>
          </View>
        )}
      </View>
      <View className="flex-1">
        <ThemedText family="primary" weight="medium" className="text-b1">
          {item.currencyName}
        </ThemedText>
        <ThemedText
          family="secondary"
          weight="regular"
          className="pt-2 text-b2 uppercase text-text-secondary-light dark:text-text-secondary-dark"
        >
          {item.symbol}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (activeTab === 'giftcard' && isGiftCardsLoadingMore) {
      return (
        <View className="py-4">
          <ActivityIndicator size="small" />
        </View>
      );
    }

    // if (activeTab === 'giftcard' && !hasMoreGiftCards && giftCards.length > 0) {
    //   return (
    //     <View className="py-4">
    //       <ThemedText className="text-center text-b2">
    //         No more gift cards to load
    //       </ThemedText>
    //     </View>
    //   );
    // }

    return null;
  };

  return (
    <ThemedView className="flex-1">
      {/* Header with Balance */}
      <ImageBackground
        source={img.walletR}
        className="mx-4 h-[153px] rounded-[20px] p-4"
        resizeMode="cover"
        style={{ overflow: 'hidden', borderRadius: 30 }}
      >
        <View className="flex-row items-center justify-between pt-[30px]">
          <View>
            <Text className="mb-1 font-primary-medium text-b3 text-light-150">
              Account Balance
            </Text>
            {isToggle ? (
              <View className="flex-row items-center gap-1">
                <Text className="text-center font-primary-bold text-h4 text-white">₦</Text>
                <Text className="text-center font-primary-bold text-h4 text-white">
                  {user?.user?.bal ? user?.user?.bal : '0.00'}
                </Text>
              </View>
            ) : (
              <Text className="text-center font-primary-bold text-h4 text-white">
                **********
              </Text>
            )}
          </View>
          <Pressable
            onPress={handleToggle}
            className="flex-row gap-1 rounded-full bg-[#000000B2] px-2 py-2"
          >
            <Text className="font-primary-semibold text-[12px] text-white">
              {isToggle ? 'Hide' : 'Show'}
            </Text>
            <View className="pt-[1.5px]">
              {isToggle ? (
                <EyeClosed size={12} color="#FFFFFF" />
              ) : (
                <EyeOff size={12} color="#FFFFFF" />
              )}
            </View>
          </Pressable>
        </View>
      </ImageBackground>

      {/* Quick Actions */}
      <View className="mx-4 my-3 flex-row items-center gap-2 rounded-[30px] border-[0.5px] border-[#EFEFEF] bg-white px-[8px] py-[12px] dark:border-[#232323] dark:bg-[#111111]">
        {WALLET_DASH.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => handleRoute(item.route)}
            className="flex-row h-[52px] flex-1 items-center justify-between rounded-[60px] bg-[#F8F8F8] p-3 dark:bg-[#0C0C0C]"
          >
            <ThemedText
              className="mr-1 flex-1 text-left text-[14px]"
              variant="primary"
              family="primary"
              weight="semibold"
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {item.title}
            </ThemedText>
            <View className="flex h-[35px] w-[35px] items-center justify-center rounded-full bg-white p-1 dark:bg-[#1A1A1A]">
              {isDark ? <item.iconLight /> : <item.iconDark />}
            </View>
          </Pressable>
        ))}
        <Pressable
          onPress={() => router.push(paths.transactionhistory)}
          className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#F8F8F8] dark:bg-[#0C0C0C]"
        >
          {isDark ? <img.historyDark /> : <img.historyLight />}
        </Pressable>
      </View>

      {/* Main Content */}
      <View
        className="mb-2 mt-2 flex-1 bg-white p-4 dark:bg-[#111111]"
        style={{
          // shadowColor: isDark ? '#2B2390' : '#2B2390',
          // shadowOffset: { width: 0, height: 8 },
          // shadowOpacity: isDark ? 0.2 : 0.1,
          // shadowRadius: isDark ? 12 : 6,
          // elevation: isDark ? 12 : 6,
        }}
      >
        {/* Tab Switcher */}
        <View className="mx-[4px] mb-2 flex-row items-center justify-between rounded-[20px] bg-[#F8F8F8] p-1 dark:bg-[#0C0C0C]">
          <Pressable
            onPress={() => setActiveTab('crypto')}
            className={`flex-1 items-center justify-center rounded-[16px] p-[14px] ${activeTab === 'crypto'
              ? 'border-none bg-white dark:bg-[#111111]'
              : 'bg-transparent'
              } !border-none`}
          >
            <ThemedText
              family="primary"
              weight="regular"
              className={`text-[14px] ${activeTab === 'crypto' ? '!text-primary-500' : ''
                }`}
            >
              Crypto
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('giftcard')}
            className={`flex-1 items-center justify-center rounded-[16px] p-[14px] ${activeTab === 'giftcard'
              ? 'border-none bg-white dark:bg-[#111111]'
              : 'bg-transparent'
              } !border-none`}
          >
            <ThemedText
              family="primary"
              weight="regular"
              className={`text-[14px] ${activeTab === 'giftcard' ? '!text-primary-500' : ''
                }`}
            >
              Gift card
            </ThemedText>
          </Pressable>
        </View>

        {/* Content based on active tab */}
        {activeTab === 'giftcard' && (
          <>
            {isGiftCardsLoading && giftCards.length === 0 ? (
              <WalletSkeletonList type="giftcard" />
            ) : giftCards.length === 0 ? (
              <View className="mt-10">
                <View className="bg-[#F8F8F8] dark:bg-[#0C0C0C] w-fit mb-4 p-2 rounded-[14px] flex items-center justify-center mx-auto">
                  {isDark ? (
                    <img.noTransDark width={40} height={40} />
                  ) : (
                    <img.noTransLight width={40} height={40} />
                  )}
                </View>
                <ThemedText
                  family="primary"
                  variant="primary"
                  weight="medium"
                  className="text-b2 text-center"
                >
                  No Gift Cards found
                </ThemedText>
              </View>
            ) : (
              <FlatList
                data={giftCards}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                renderItem={renderGiftCardItem}
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  paddingBottom: 40,
                  paddingTop: 10,
                  gap: 1,
                  flexGrow: 1,
                }}
                onEndReached={loadMoreGiftCards}
                onEndReachedThreshold={0.4}
                ListFooterComponent={renderFooter}
                refreshControl={
                  <RefreshControl
                    refreshing={isGiftCardsRefreshing}
                    onRefresh={handleRefresh}
                  />
                }
              />
            )}
          </>
        )}

        {activeTab === 'crypto' && (
          <>
            {isCryptoLoading ? (
              <WalletSkeletonList type="crypto" />
            ) : transformedCryptoData.length === 0 ? (
              <View className="mt-10">
                <View className="bg-[#F8F8F8] dark:bg-[#0C0C0C] w-fit mb-4 p-2 rounded-[14px] flex items-center justify-center mx-auto">
                  {isDark ? (
                    <img.noTransDark width={40} height={40} />
                  ) : (
                    <img.noTransLight width={40} height={40} />
                  )}
                </View>
                <ThemedText
                  family="primary"
                  variant="primary"
                  weight="medium"
                  className="text-b2 text-center"
                >
                  No Cryptocurrencies found
                </ThemedText>
              </View>
            ) : (
              <FlatList
                data={transformedCryptoData}
                renderItem={renderCryptoItem}
                keyExtractor={(item, index) => `${item.symbol}-${index}`}
                className="flex-1"
                contentContainerStyle={{
                  paddingBottom: 40,
                  paddingTop: 5,
                  gap: 1,
                  flexGrow: 1,
                }}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
                refreshControl={
                  <RefreshControl
                    refreshing={isCryptoFetching}
                    onRefresh={refetchCrypto}
                  />
                }
              />
            )}
          </>
        )}
      </View>

      {/* Modals */}
      <PickTypeModal
        visible={pickTypeVisible}
        setVisible={setPickTypeVisible}
        pickTyp="topup"
      />
    </ThemedView>
  );
};

export default Wallet;
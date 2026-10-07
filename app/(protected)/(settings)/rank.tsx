import { SettingsHeader } from "@/components/customs/settingsHeader";
import MonthYearPickerModal from "@/components/modals/monthyearmodal";
import RankParticipationModal from "@/components/modals/RankParticipationModal";
import { RankSkeleton } from "@/components/skeletons/rankskeleton";
import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { AVATARS, getAvatarById } from "@/constant/icon";
import { img } from "@/constant/image";
import { useTheme } from "@/context/ThemeProvider";
import { setHasSeenRankModal, setRankLeaderboardAccepted } from "@/redux/auth/session";
import { useGetAppRankMutation } from "@/redux/settings/settings";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { app_config } from "@/utils/config";
import { TokenManager } from "@/utils/secure-store-adapter";
import React, { useCallback } from "react";
import {
  FlatList,
  Image,
  ImageBackground,
  Linking,
  Pressable,
  RefreshControl,
  Text,
  View
} from "react-native";

type RankTab = "crypto" | "giftcard";

const Rank = () => {
  const { isDark } = useTheme();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { hasSeenRankModal, rankLeaderboardAccepted } = useAppSelector((state) => state.session);

  const { user: userInfo } = user || {};
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [selectedMonth, setSelectedMonth] = React.useState<number>(
    new Date().getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = React.useState<number>(
    new Date().getFullYear(),
  );
  const [showMonthYearPicker, setShowMonthYearPicker] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<RankTab>("giftcard");
  const [showRankModal, setShowRankModal] = React.useState(false);

  React.useEffect(() => {
    if (!hasSeenRankModal) {
      setShowRankModal(true);
    }

  }, [hasSeenRankModal]);

  const handleAcceptRankModal = () => {
    dispatch(setHasSeenRankModal(true));
    dispatch(setRankLeaderboardAccepted(true));
    setShowRankModal(false);
  };


  const handleDeclineRankModal = () => {
    dispatch(setHasSeenRankModal(true));
    dispatch(setRankLeaderboardAccepted(false));
    setShowRankModal(false);
  };

  const [getAppRank, { isLoading }] = useGetAppRankMutation();

  const [rankData, setRankData] = React.useState<any>(null);

  React.useEffect(() => {
    fetchRankData();
  }, [selectedMonth, selectedYear]);

  const fetchRankData = useCallback(async () => {
    try {
      const atex = await TokenManager.getToken();
      const response: any = await getAppRank({
        data: {
          token: atex,
          month: selectedMonth.toString(),
          year: selectedYear.toString(),
        },
      }).unwrap();

      if (response?.status === "success") {
        setRankData(response.data || null);
      }
    } catch (error) {
      console.error("Error fetching rank data:", error);
    }
  }, [getAppRank, selectedMonth, selectedYear]);

  const onRefreshWithAPI = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await fetchRankData();
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchRankData, isRefreshing]);

  // Active tab data
  const activeLeaderboard: any[] = rankData?.[activeTab]?.leaderboard || [];
  const activeUserRank = rankData?.[activeTab]?.user_rank;

  const firstPosition = activeLeaderboard.find((item: any) => item?.position === 1);
  const secondPosition = activeLeaderboard.find((item: any) => item?.position === 2);
  const thirdPosition = activeLeaderboard.find((item: any) => item?.position === 3);

  const getAvatarComponent = (userObj: any, defaultIndex: number) => {
    const avatarId = userObj?.avatarId || userObj?.avatar || userObj?.avatar_id || userObj?.selectedAvatarId;
    const avatarObj = (avatarId ? getAvatarById(avatarId) : null) || AVATARS[defaultIndex % AVATARS.length];
    return avatarObj.image;
  };

  const formatUsername = (username?: string) => {
    if (!username) return "";
    return username.length > 10 ? username.slice(0, 10) + "..." : username;
  };

  const getDayLabel = (count: number) => {
    return count === 1 ? "streak" : "streaks";
  };

  return (
    <ThemedView className="flex-1">
      <SettingsHeader title="Rank" />

      <View className="flex-1">
        {isLoading && !isRefreshing ? (
          <RankSkeleton />
        ) : (
          <FlatList
            className="flex-1"
            data={activeLeaderboard}
            keyExtractor={(item: any, index: number) => item.position?.toString() || index.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 150,
            }}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefreshWithAPI}
              />
            }
            ListHeaderComponent={
              <>
                {/* Crypto / Gift Card Toggle */}
                <View className="mx-6 mt-4 mb-2 bg-[#F5F5F5] dark:bg-[#0C0C0C] rounded-full flex-row p-1">
                  <Pressable
                    className={`flex-1 py-3 rounded-full items-center ${activeTab === "giftcard" ? "bg-white dark:bg-[#111111]" : ""}`}
                    onPress={() => setActiveTab("giftcard")}
                  >
                    <ThemedText
                      family="primary"
                      weight="medium"
                      className={`text-b2 text-center ${activeTab === "giftcard" ? "!text-primary-500" : "!text-[#999]"}`}
                    >
                      Gift Cards
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    className={`flex-1 py-3 rounded-full items-center ${activeTab === "crypto" ? "bg-white dark:bg-[#111111]" : ""}`}
                    onPress={() => setActiveTab("crypto")}
                  >
                    <ThemedText
                      family="primary"
                      weight="medium"
                      className={`text-b2 text-center ${activeTab === "crypto" ? "!text-primary-500" : "!text-[#999]"}`}
                    >
                      Crypto
                    </ThemedText>
                  </Pressable>
                </View>

                {/* Podium */}
                <View className="relative w-full aspect-[1/0.9] items-center justify-center pt-4">
                  <ImageBackground
                    source={isDark ? img.rankDarkPng : img.rankLightPng}
                    className="absolute w-full h-full"
                    resizeMode="cover"
                  >
                    <View className="flex-row w-full h-full px-4 items-end justify-between pb-12">
                      {/* 2nd Place (Left) */}
                      <View className="flex-1 items-center mb-10">
                        {secondPosition && (
                          <>
                            <View className="mb-2 items-center">
                              <View className="w-14 h-14 overflow-hidden mb-4 rounded-full bg-blue-100 items-center justify-center">
                                {(() => {
                                  const SecondAvatar = getAvatarComponent(secondPosition, 1);
                                  return <SecondAvatar width="100%" height="100%" />;
                                })()}
                              </View>
                            </View>
                            <ThemedText family="primary" weight="medium" className="text-b2 text-white text-center px-1" numberOfLines={1}>
                              {formatUsername(secondPosition?.username)}
                            </ThemedText>
                            <View className="bg-white/20 px-2 py-0.5 rounded-lg mt-1">
                              <ThemedText family="primary" weight="medium" className="text-[12px] text-white">
                                {secondPosition?.total_transactions || 0} {getDayLabel(secondPosition?.total_transactions || 0)}
                              </ThemedText>
                            </View>
                          </>
                        )}
                        <View className="flex-row items-center gap-1 mt-2">
                          <img.rank2 width={80} height={30} />
                        </View>
                      </View>

                      {/* 1st Place (Middle) */}
                      <View className="flex-1 items-center mb-24">
                        {firstPosition && (
                          <>
                            <View className="mb-2 items-center">
                              <View className="w-14 h-14 overflow-hidden mb-4 rounded-full bg-yellow-100 items-center justify-center">
                                {(() => {
                                  const FirstAvatar = getAvatarComponent(firstPosition, 0);
                                  return <FirstAvatar width="100%" height="100%" />;
                                })()}
                              </View>
                            </View>
                            <ThemedText family="primary" weight="medium" className="text-b2 text-white text-center px-1" numberOfLines={1}>
                              {formatUsername(firstPosition?.username)}
                            </ThemedText>
                            <View className="bg-white/20 px-2 py-0.5 rounded-lg mt-1">
                              <ThemedText family="primary" weight="medium" className="text-[12px] text-white">
                                {firstPosition?.total_transactions || 0} {getDayLabel(firstPosition?.total_transactions || 0)}
                              </ThemedText>
                            </View>
                          </>
                        )}
                        <View className="flex-row items-center gap-1 mt-2">
                          <img.rank1 width={80} height={30} />
                        </View>
                      </View>

                      {/* 3rd Place (Right) */}
                      <View className="flex-1 items-center mb-10">
                        {thirdPosition && (
                          <>
                            <View className="items-center">
                              <View className="w-14 h-14 overflow-hidden mb-6 rounded-full bg-pink-100 items-center justify-center">
                                {(() => {
                                  const ThirdAvatar = getAvatarComponent(thirdPosition, 2);
                                  return <ThirdAvatar width="100%" height="100%" />;
                                })()}
                              </View>
                            </View>
                            <ThemedText family="primary" weight="medium" className="text-b2 text-white text-center px-1" numberOfLines={1}>
                              {formatUsername(thirdPosition?.username) || ""}
                            </ThemedText>
                            <View className="bg-white/20 px-2 py-0.5 rounded-lg mt-1">
                              <ThemedText family="primary" weight="medium" className="text-[12px] text-white">
                                {thirdPosition?.total_transactions || 0} {getDayLabel(thirdPosition?.total_transactions || 0)}
                              </ThemedText>
                            </View>
                          </>
                        )}
                        <View className="flex-row items-center gap-1">
                          <img.rank3 width={80} height={30} />
                        </View>
                      </View>
                    </View>
                  </ImageBackground>
                </View>

                {/* Ranking Info */}
                <View className="px-6 py-4">
                  <View className="flex-row items-center gap-1">
                    <ThemedText family="primary" weight="bold" className="text-b1">
                      Top {activeTab === "crypto" ? "Crypto" : "Gift Card"} Ranking
                    </ThemedText>
                  </View>
                  <ThemedText family="secondary" weight="regular" variant="secondary" className="text-b2 mt-1">
                    Top 20 users to rank the leaderboard monthly get rewarded at the end of each month
                  </ThemedText>

                </View>

                {/* Your Rank Banner */}
                {activeUserRank?.position && rankLeaderboardAccepted !== false && (
                  <View className="mx-6 mb-4 bg-[#E8FFE4] dark:bg-[#111111] border border-[#B4FFA8] dark:border-[#232323] rounded-[20px] px-4 py-3 flex-row items-center justify-between">
                    <ThemedText family="primary" weight="medium" className="!text-primary-600 text-b2">
                      Your position
                    </ThemedText>
                    <ThemedText family="primary" weight="bold" className="!text-primary-600 text-b1">
                      #{activeUserRank.position} · {activeUserRank.total_transactions || 0} {getDayLabel(activeUserRank.total_transactions || 0)}
                    </ThemedText>
                  </View>
                )}

                {/* Leaderboard Header */}
                <View className="mx-6 bg-[#F5F5F5] dark:bg-[#111111] rounded-[14px] flex-row py-3 px-4 mb-4">
                  <ThemedText family="primary" weight="medium" className="text-b2 w-8">No</ThemedText>
                  <ThemedText family="primary" weight="medium" className="text-b2 flex-1 px-4">Name</ThemedText>
                  <ThemedText family="primary" weight="medium" className="text-b2 text-right">Streak</ThemedText>
                </View>

                {/* Empty state */}
                {activeLeaderboard.length === 0 && (
                  <View className="py-16 items-center">
                    <ThemedText family="primary" weight="medium" variant="secondary" className="text-b2 text-center mt-4">
                      No data available for this period
                    </ThemedText>
                  </View>
                )}
              </>
            }
            renderItem={({ item, index }: { item: any; index: number }) => {
              const ItemAvatarSvg = getAvatarComponent(item, index);
              const isMe = activeUserRank?.username === item.username;
              return (
                <View className={`mx-6 bg-white dark:bg-[#0C0C0C] border rounded-[24px] flex-row items-center py-4 px-4 mb-3 ${isMe ? "border-primary-500" : "border-[#EFEFEF] dark:border-[#232323]"}`}>
                  <ThemedText family="primary" weight="medium" className="text-b2 w-8 text-gray-400">
                    {item.position || index + 1}
                  </ThemedText>
                  <View className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 items-center justify-center">
                    <ItemAvatarSvg width="100%" height="100%" />
                  </View>
                  <ThemedText family="primary" weight="semibold" className={`text-b1 flex-1 px-3 ${isMe ? "!text-primary-500" : ""}`} numberOfLines={1} ellipsizeMode="tail">
                    {formatUsername(item.username)}{isMe ? " (You)" : ""}
                  </ThemedText>
                  <View className={`px-3 py-1 rounded-lg ${isMe ? "bg-primary-500" : "bg-[#E8FFE4] dark:bg-[#171717]"}`}>
                    <ThemedText family="primary" weight="medium" className={`text-b3 ${isMe ? "!text-white" : ""}`}>
                      {item?.total_transactions || 0} {getDayLabel(item?.total_transactions || 0)}
                    </ThemedText>
                  </View>
                </View>
              );
            }}
          />
        )}

        {!hasSeenRankModal && (
          <View className="mx-6 mt-3 p-3 bg-light-150 dark:bg-[#111111] rounded-xl border border-[#EFEFEF] dark:border-[#232323]">
            <ThemedText family="secondary" weight="regular" variant="secondary" className="text-xs leading-4">
              By participating in trade rankings, your username and monthly trade streak count are displayed on our public leaderboard. Read our{" "}
              <Text
                className="text-xs !text-primary-500 underline"
                onPress={() => Linking.openURL(app_config.privacyPolicyUrl)}
              >
                Privacy Policy
              </Text>{" "}
              for details on data collection and sharing.
            </ThemedText>
          </View>
        )}
      </View>

      {showMonthYearPicker && (
        <MonthYearPickerModal
          visible={showMonthYearPicker}
          onClose={() => setShowMonthYearPicker(false)}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onSelect={(month, year) => {
            setSelectedMonth(month);
            setSelectedYear(year);
            setShowMonthYearPicker(false);
          }}
        />
      )}

      <RankParticipationModal
        visible={showRankModal}
        onAccept={handleAcceptRankModal}
        onDecline={handleDeclineRankModal}
      />
    </ThemedView>
  );
};

export default Rank;







// const Rank = () => {
//   const { isDark } = useTheme();
//   const { user } = useAppSelector((state) => state.auth);
//   // const { atex } = useAuthToken();

//   const { user: userInfo } = user || {};
//   const [isRefreshing, setIsRefreshing] = React.useState(false);
//   const { width: screenWidth } = useWindowDimensions();
//   // const rankWidth = screenWidth - 48; // 24px padding on each side
//   const [selectedMonth, setSelectedMonth] = React.useState<number>(
//     new Date().getMonth() + 1,
//   );
//   const [selectedYear, setSelectedYear] = React.useState<number>(
//     new Date().getFullYear(),
//   );
//   const [showMonthYearPicker, setShowMonthYearPicker] = React.useState(false);

//   const [getAppRank, { isLoading }] = useGetAppRankMutation();

//   const [rankData, setRankData] = React.useState<any>(null);

//   React.useEffect(() => {
//     fetchRankData();
//   }, [selectedMonth, selectedYear]);

//   const fetchRankData = useCallback(async () => {
//     try {
//       const atex = await TokenManager.getToken();
//       const response: any = await getAppRank({
//         data: {
//           token: atex,
//           month: selectedMonth.toString(),
//           year: selectedYear.toString(),
//         },
//       }).unwrap();
//       console.log("Rank Data Response:", response);
//       if (response?.status === "success" && response.data?.leaderboard?.length > 0) {
//         setRankData(response.data || []);
//       }
//     } catch (error) {
//       console.error("Error fetching rank data:", error);
//     }
//   }, [getAppRank, selectedMonth, selectedYear]);

//   const firstPosition = rankData?.leaderboard?.find(
//     (item: any) => item?.position === 1,
//   );

//   const secondPosition = rankData?.leaderboard?.find(
//     (item: any) => item?.position === 2,
//   );

//   const thirdPosition = rankData?.leaderboard?.find(
//     (item: any) => item?.position === 3,
//   );

//   const meUser = rankData?.user_rank;

//   const onRefreshWithAPI = useCallback(async () => {
//     if (isRefreshing) return;

//     setIsRefreshing(true);
//     try {
//       await fetchRankData();
//     } catch (error) {
//       console.error("Error refreshing:", error);
//     } finally {
//       setIsRefreshing(false);
//     }
//   }, [fetchRankData, isRefreshing]);

//   const topAvatars = [
//     img.avatarBoy1,
//     img.avatarBoy2,
//     img.avatarBoy3,
//     img.avatarBoy4,
//     img.avatarBoy5,
//     img.avatarBoy6,
//     img.avatarBoy7,
//     img.avatarBoy8,
//     img.avatarLady1Svg,
//     img.avatarBoy9,
//     img.avatarBoy10,
//     img.avatarLady2Svg,
//   ];


//   const formatUsername = (username?: string) => {
//     if (!username) return "";
//     return username.length > 10 ? username.slice(0, 10) + "..." : username;
//   };

//   const getDayLabel = (count: number) => {
//     return count === 1 ? "day" : "days";
//   };

//   console.log("rankData", rankData);

//   return (
//     <ThemedView className="flex-1 ">
//       <SettingsHeader title="Rank" />
//       <View className="flex-1">
//         {isLoading && !isRefreshing ? (
//           <RankSkeleton />
//         ) : (
//           <FlatList
//             className="flex-1"
//             data={rankData?.leaderboard}
//             keyExtractor={(item: any, index: number) => item.id?.toString() || index.toString()}
//             showsVerticalScrollIndicator={false}
//             contentContainerStyle={{
//               paddingBottom: 150,
//             }}
//             refreshControl={
//               <RefreshControl
//                 refreshing={isRefreshing}
//                 onRefresh={onRefreshWithAPI}
//               />
//             }
//             ListHeaderComponent={
//               <>
//                 {/* New Podium UI */}
//                 <View className="relative w-full aspect-[1/0.9] items-center justify-center pt-8">
//                   <ImageBackground
//                     source={isDark ? img.rankDarkPng : img.rankLightPng}
//                     className="absolute w-full h-full"
//                     resizeMode="cover"
//                   >
//                     <View className="flex-row w-full h-full px-4 items-end justify-between pb-12">
//                       {/* 2nd Place (Left) */}
//                       <View className="flex-1 items-center mb-10">
//                         {secondPosition && (
//                           <>
//                             <View className="mb-2 items-center">
//                               <View className="w-14 h-14 overflow-hidden mb-4 rounded-full bg-blue-100">
//                                 <img.avatarBoy2 width="100%" height="100%" />
//                               </View>
//                             </View>
//                             <ThemedText family="primary" weight="medium" className="text-b2 text-white text-center px-1" numberOfLines={1}>
//                               {formatUsername(secondPosition?.username)}
//                             </ThemedText>
//                             <View className="bg-white/20 px-2 py-0.5 rounded-lg mt-1">
//                               <ThemedText family="primary" weight="medium" className="text-[12px] text-white">
//                                 {secondPosition?.total_transactions || 0} {getDayLabel(secondPosition?.total_transactions || 0)}
//                               </ThemedText>
//                             </View>
//                           </>
//                         )}
//                         <View className="flex-row items-center gap-1 mt-2">
//                           <img.rank2 width={80} height={30} />
//                         </View>
//                       </View>

//                       {/* 1st Place (Middle) */}
//                       <View className="flex-1 items-center mb-24">
//                         {firstPosition && (
//                           <>
//                             <View className="mb-2 items-center">
//                               <View className="w-14 h-14 overflow-hidden mb-4 rounded-full bg-yellow-100">
//                                 <img.avatarBoy1 width="100%" height="100%" />
//                               </View>
//                             </View>
//                             <ThemedText family="primary" weight="medium" className="text-b2 text-white text-center px-1" numberOfLines={1}>
//                               {formatUsername(firstPosition?.username)}
//                             </ThemedText>
//                             <View className="bg-white/20 px-2 py-0.5 rounded-lg mt-1">
//                               <ThemedText family="primary" weight="medium" className="text-[12px] text-white">
//                                 {firstPosition?.total_transactions || 0} {getDayLabel(firstPosition?.total_transactions || 0)}
//                               </ThemedText>
//                             </View>
//                           </>
//                         )}
//                         <View className="flex-row items-center gap-1 mt-2">
//                           <img.rank1 width={80} height={30} />
//                         </View>
//                       </View>

//                       {/* 3rd Place (Right) */}
//                       <View className="flex-1 items-center mb-10">
//                         {thirdPosition && (
//                           <>
//                             <View className=" items-center">
//                               <View className="w-14 h-14 overflow-hidden mb-6 rounded-full bg-pink-100">
//                                 <img.avatarBoy3 width="100%" height="100%" />
//                               </View>
//                             </View>
//                             <ThemedText family="primary" weight="medium" className="text-b2 text-white text-center px-1 " numberOfLines={1}>
//                               {formatUsername(thirdPosition?.username) || ""}
//                             </ThemedText>
//                             <View className="bg-white/20 px-2 py-0.5 rounded-lg mt-1">
//                               <ThemedText family="primary" weight="medium" className="text-[12px] text-white">
//                                 {thirdPosition?.total_transactions || 0} {getDayLabel(thirdPosition?.total_transactions || 0)}
//                               </ThemedText>
//                             </View>
//                           </>
//                         )}
//                         <View className="flex-row items-center gap-1">
//                           <img.rank3 width={80} height={30} />
//                         </View>
//                       </View>
//                     </View>
//                   </ImageBackground>
//                 </View>

//                 {/* Ranking Info */}
//                 <View className="px-6 py-6">
//                   <ThemedText family="primary" weight="bold" className="text-b1">
//                     Top Customer Streak Ranking 😌
//                   </ThemedText>
//                   <ThemedText family="secondary" weight="regular" variant="secondary" className="text-b2 mt-1">
//                     Top 20 users to rank the leaderboard monthly get rewarded at the end of each month
//                   </ThemedText>
//                 </View>

//                 {/* Leaderboard Header */}
//                 <View className="mx-6 bg-[#F5F5F5] dark:bg-[#111111] rounded-[14px] flex-row py-3 px-4 mb-4">
//                   <ThemedText family="primary" weight="medium" className="text-b2 w-8">No</ThemedText>
//                   <ThemedText family="primary" weight="medium" className="text-b2 flex-1 px-4">Name</ThemedText>
//                   <ThemedText family="primary" weight="medium" className="text-b2 text-right">Streak</ThemedText>
//                 </View>
//               </>
//             }
//             renderItem={({ item, index }: { item: any; index: number }) => {
//               const Avatar = topAvatars[index % topAvatars.length];
//               return (
//                 <View className="mx-6 bg-white dark:bg-[#0C0C0C] border border-[#EFEFEF] dark:border-[#232323] rounded-[24px] flex-row items-center py-4 px-4 mb-3">
//                   <ThemedText family="primary" weight="medium" className="text-b2 w-8 text-gray-400">
//                     {index + 1}
//                   </ThemedText>
//                   <View className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 items-center justify-center">
//                     <Avatar width="80%" height="80%" />
//                   </View>
//                   <ThemedText family="primary" weight="semibold" className="text-b1 flex-1 px-3" numberOfLines={1} ellipsizeMode="tail">
//                     {formatUsername(item.username)}
//                   </ThemedText>
//                   <View className="bg-[#E8FFE4] dark:bg-[#171717] px-3 py-1 rounded-lg">
//                     <ThemedText family="primary" weight="medium" className="text-b3">
//                       {item?.total_transactions || 0} {getDayLabel(item?.total_transactions || 0)}
//                     </ThemedText>
//                   </View>
//                 </View>
//               );
//             }}
//           />
//         )}


//         {/* Existing code commented out (preserved)
//         <ScrollView
//           className="flex-1"
//           contentContainerStyle={{
//             paddingBottom: 150,
//           }}
//           showsVerticalScrollIndicator={false}
//           refreshControl={
//             <RefreshControl
//               refreshing={isRefreshing}
//               onRefresh={onRefreshWithAPI}
//             />
//           }
//         >
//           <View className="flex-1  px-[24px] pb-8 pt-1">
//           </View>

//           <View className="flex-1 relative items-center justify-center pt-40  mb-8">
//             <View className="absolute top-0 left-0 right-0 px-[45px] flex-row items-center justify-between ">
//               <View className="flex-col  items-center gap-2 top-12">
//                 <Image
//                   source={require("@/assets/images/settings/avatar2.png")}
//                   className="w-10 h-10 rounded-full"
//                   style={{ width: 40, height: 40 }}
//                 />
//                 <ThemedText
//                   family="primary"
//                   weight="medium"
//                   variant="secondary"
//                   className="text-b2 text-center "
//                 >
//                   {firstPosition
//                     ? secondPosition?.username.trim().slice(0, 10).concat("...")
//                     : "N/A"}
//                 </ThemedText>
//                 <ThemedText
//                   family="primary"
//                   weight="medium"
//                   className={`text-b2 ${isDark ? "bg-[#46464680]" : "bg-[#343434]"}    py-1 px-2 rounded-xl    !text-text-primary-dark `}
//                 >
//                   {firstPosition ? secondPosition?.total_transactions || 0 : 0}{" "}
//                   pts 🔥
//                 </ThemedText>
//               </View>

//               <View className="flex-col items-center gap-2 top-[-4px]">
//                 <icons.winnercup />
//                 <Image
//                   source={require("@/assets/images/settings/avatar2.png")}
//                   className="w-10 h-10 rounded-full"
//                   style={{ width: 40, height: 40 }}
//                 />
//                 <ThemedText
//                   family="primary"
//                   weight="medium"
//                   variant="secondary"
//                   className="text-b2 "
//                 >
//                   {firstPosition
//                     ? firstPosition?.username?.slice(0, 10).concat("...")
//                     : "N/A"}
//                 </ThemedText>
//                 <ThemedText
//                   family="primary"
//                   weight="medium"
//                   className={`text-b2 ${isDark ? "bg-[#46464680]" : "bg-[#343434]"}    py-1 px-2 rounded-xl    !text-text-primary-dark `}
//                 >
//                   {firstPosition ? firstPosition?.total_transactions || 0 : 0}{" "}
//                   pts 🔥
//                 </ThemedText>
//               </View>

//               <View className="flex-col items-center gap-2 top-20">
//                 <Image
//                   source={require("@/assets/images/settings/avatar2.png")}
//                   className="w-10 h-10 rounded-full"
//                   style={{ width: 40, height: 40 }}
//                 />
//                 <ThemedText
//                   family="primary"
//                   weight="medium"
//                   variant="secondary"
//                   className="text-b2 text-center "
//                 >
//                   {thirdPosition
//                     ? thirdPosition?.username.slice(0, 10).concat("...")
//                     : "N/A"}
//                 </ThemedText>
//                 <ThemedText
//                   family="primary"
//                   weight="medium"
//                   className={`text-b2 ${isDark ? "bg-[#46464680]" : "bg-[#343434]"}    py-1 px-2 rounded-xl    !text-text-primary-dark `}
//                 >
//                   {thirdPosition ? thirdPosition?.total_transactions || 0 : 0}{" "}
//                   pts 🔥
//                 </ThemedText>
//               </View>
//             </View>
//             <icons.stairs />
//           </View>

//           <View className="flex-1 px-[24px]">
//             <View className="flex-row items-center justify-between mb-2">
//               <ThemedText
//                 family="primary"
//                 weight="bold"
//                 variant="secondary"
//                 className="text-b2 pb-4 text-text-primary-dark"
//               >
//                 Level/Name
//               </ThemedText>

//               <ThemedText
//                 family="primary"
//                 weight="bold"
//                 variant="secondary"
//                 className="text-b2 pb-4 text-text-primary-dark"
//               >
//                 Streak
//               </ThemedText>
//             </View>

//             <View className="flex-1">
//               {rankData?.leaderboard?.map((item: any, index: number) => (
//                 <View
//                   key={index}
//                   className="flex-row items-center justify-between bg-light-150 dark:bg-dark-700 px-[12px] py-[16px] rounded-lg mb-4"
//                 >
//                   <View className="flex-row items-center gap-2">
//                     <ThemedText
//                       family="primary"
//                       weight="bold"
//                       className="text-b2 text-text-primary-dark"
//                     >
//                       {index + 1}
//                     </ThemedText>
//                     <Image
//                       source={require("@/assets/images/settings/avatar1.png")}
//                       className="w-10 h-10 rounded-full"
//                       style={{ width: 40, height: 40 }}
//                     />
//                     <ThemedText
//                       family="primary"
//                       weight="bold"
//                       className="text-b2 text-text-primary-dark"
//                     >
//                       {item?.username} {index + 1}
//                     </ThemedText>
//                   </View>
//                   <ThemedText
//                     family="primary"
//                     weight="bold"
//                     className={`text-b2 ${me && index === 0
//                       ? "bg-primary-500 text-light-150"
//                       : "bg-light-150 dark:bg-[#000000]"
//                       } py-3 px-4 rounded-full `}
//                   >
//                     {index === 0
//                       ? "Winner"
//                       : `${item?.total_transactions} pts 🔥`}
//                   </ThemedText>
//                 </View>
//               ))}
//             </View>
//           </View>
//         </ScrollView>
//         */}
//       </View>
//       {showMonthYearPicker && (
//         <MonthYearPickerModal
//           visible={showMonthYearPicker}
//           onClose={() => setShowMonthYearPicker(false)}
//           selectedMonth={selectedMonth}
//           selectedYear={selectedYear}
//           onSelect={(month, year) => {
//             setSelectedMonth(month);
//             setSelectedYear(year);
//             setShowMonthYearPicker(false);
//           }}
//         />
//       )}
//     </ThemedView>
//   );
// };

// export default Rank;

import { SettingsHeader } from "@/components/customs/settingsHeader";
import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { img } from "@/constant/image";
import { useTheme } from "@/context/ThemeProvider";
import { useToast } from "@/context/ToastProvider";
import { useGetUserRewardHistoryMutation, useWithdrawReferralMutation } from "@/redux/settings/settings";
import { useAppSelector } from "@/redux/store";
import { TokenManager } from "@/utils/secure-store-adapter";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { CopyIcon } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, ImageBackground, Pressable, ScrollView, Text, View } from "react-native";




const StepCard = ({ icon, title, description, isReward }: { icon: any, title: string, description: string, isReward?: boolean }) => (
  <View className={`bg-[#FCFCFC] dark:bg-[#0C0C0C] border border-[#EFEFEF] dark:border-[#232323] rounded-[24px] p-2 flex-row items-center gap-4 mb-3 ${isReward ? "" : ""}`}>
    <View className={` dark:bg-[#171717] rounded-[16px] p-3 ${isReward ? "dark:bg-[#111111] bg-[#FFFFFF]" : "bg-[#F6FFF4]"} `}>
      {icon}
    </View>
    <View className="flex-1">
      <ThemedText family="primary" weight="bold" className="text-b1">
        {title}
      </ThemedText>
      <ThemedText family="primary" variant="secondary" weight="medium" className="text-b3 mt-1">
        {description}
      </ThemedText>
    </View>
  </View>
);

const formatRewardDate = (dateString: string) => {
  // "2026-04-03 12:02:54" -> "April 3 - 12:02 PM"
  const d = new Date(dateString.replace(" ", "T"));
  const datePart = d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const timePart = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${datePart} - ${timePart}`;
};

const RewardEmptyState = ({ isDark }: { isDark: boolean }) => (
  <View className="items-center justify-center py-4">
    <View className="bg-[#171717] rounded-[16px] p-2 mb-3">
      {isDark ? <img.noTransDark width={40} height={40} /> : <img.noTransLight width={40} height={40} />}
    </View>
    <ThemedText weight="bold" className="text-b1 mt-2">No Transaction Yet</ThemedText>
    <ThemedText variant="secondary" weight="medium" className="text-b3 mt-1 text-center">
      You would find your recent transaction here
    </ThemedText>
  </View>
);

const Referfriends = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { user: userInfo } = user || {};
  const { isDark } = useTheme();
  const toast = useToast();

  const [getAppReferralHistory, { isLoading }] = useGetUserRewardHistoryMutation();
  const [withdrawReferral, { isLoading: isWithdrawing }] = useWithdrawReferralMutation();

  const [history, setHistory] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const rawBalanceVal = String(userInfo?.ref_bal || "0").replace(/[^0-9.]/g, '');
  const balanceVal = parseFloat(rawBalanceVal);
  const isBalanceZero = isNaN(balanceVal) || balanceVal <= 0;

  const handleWithdraw = async () => {
    if (isBalanceZero) {
      toast.showToast("You do not have any referral balance to withdraw", "info");
      return;
    }

    try {
      const TOKEN = await TokenManager.getToken();
      const res: any = await withdrawReferral({ token: TOKEN }).unwrap();

      if (res?.status === "success") {
        toast.showToast(res.message || "Referral bonus withdrawn successfully!", "success");
      } else {
        toast.showToast(res?.message || "Failed to withdraw referral bonus", "error");
      }
    } catch (error: any) {
      toast.showToast(error?.data?.message || error?.message || "Failed to withdraw referral bonus", "error");
    }
  };

  const fetchHistory = useCallback(async (pageNum: number, isLoadMore = false) => {
    try {
      const TOKEN = await TokenManager.getToken();

      if (isLoadMore) setIsFetchingMore(true);

      const res: any = await getAppReferralHistory({
        token: TOKEN,
        page: pageNum,
        limit: 20,
      }).unwrap();

      const newHistory = res?.data?.history || [];
      const pagination = res?.data?.pagination;

      setHistory((prev) => (isLoadMore ? [...prev, ...newHistory] : newHistory));
      setHasMore(!!pagination?.has_more_pages);
      setPage(pagination?.current_page || pageNum);
    } catch (error: any) {
      toast.showToast(error?.data?.message || "Failed to load reward history", "error");
    } finally {
      setIsFetchingMore(false);
    }
  }, [getAppReferralHistory, toast]);


  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  const handleLoadMore = () => {
    if (!hasMore || isFetchingMore || isLoading) return;
    fetchHistory(page + 1, true);
  };

  const handleCopyCode = async () => {
    if (userInfo?.ref_code) {
      await Clipboard.setStringAsync(userInfo.ref_code);
      toast.showToast("Referral code copied!", "success");
    }
  };

  return (
    <ThemedView className="flex-1">
      <SettingsHeader title="Refer friends" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Card */}
        <View className="rounded-[20px] overflow-hidden h-[168px] mb-8 border border-[#EFEFEF] dark:border-[#232323]">
          <ImageBackground
            source={img.refBg}
            className="px-6 py-5 "
            resizeMode="cover"
            imageStyle={{
              height: 168,
            }}
          >
            <View className="flex-row justify-between items-start">
              <View>
                <Text className="text-white/80 font-primary-medium text-b2">Earning Balance</Text>
                <Text className="text-white font-primary-bold text-h4 ">
                  ₦{userInfo?.ref_bal || "-------"}
                </Text>
              </View>
              <Pressable
                onPress={handleWithdraw}
                disabled={isWithdrawing || isBalanceZero}
                className={`bg-white rounded-full px-3 py-2 flex-row items-center justify-center min-w-[80px] ${isBalanceZero ? "" : ""}`}
              >
                {isWithdrawing ? (
                  <ActivityIndicator size="small" color="#28a712" />
                ) : (
                  <Text className="text-primary-500 font-primary-semibold text-b3">Withdraw</Text>
                )}
              </Pressable>
            </View>
            <View className="pt-10 flex-row justify-between items-end">
              <View>
                <ThemedText variant="secondary" weight="regular" className="text-[14px]">Your invitation Code</ThemedText>
                <ThemedText weight="medium" className="text-[14px] !text-black dark:text-white">{userInfo?.ref_code || "-------"}</ThemedText>
              </View>
              <Pressable
                onPress={handleCopyCode}
                className="bg-[#0B2E02]  flex-row items-center gap-2 px-2 py-2 rounded-[10px]"
              >
                <ThemedText className="!text-white text-b2" weight="bold">Copy</ThemedText>
                {<CopyIcon width={16} height={16} color="white" />}
              </Pressable>
            </View>
          </ImageBackground>
        </View>

        {/* How it works */}
        <View className="bg-[#FFFFFF] dark:bg-[#0C0C0C] border border-[#EFEFEF] dark:border-[#232323] rounded-[30px] overflow-hidden">
          {/* Top Gradient */}
          <LinearGradient
            colors={isDark ? ['#B6FFC2', '#FFFFFF'] : ['#B6FFC2', '#FFFFFF']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            className="absolute top-0 left-0 right-0 h-24 rounded-t-[30px]"
          />
          <View className="p-4">
            <ThemedText weight="bold" className="text-[16px]">How it works</ThemedText>
            <ThemedText variant="secondary" weight="medium" className="text-b3 mt-2 mb-6">
              Share the goodness with your friends. You both get
              <Text className="text-black dark:text-white font-primary-bold"> NGN500.00 </Text>
              when they use your referral code
            </ThemedText>

            <StepCard
              icon={isDark ? <img.shareDark width={24} height={24} /> : <img.shareLight width={24} height={24} />}
              title="Share links"
              description="Share your link to friends and family"
            />

            <StepCard
              icon={isDark ? <img.friendDark width={24} height={24} /> : <img.friendLight width={24} height={24} />}
              title="Friends sign up"
              description="Once your friend signs up using your link, they become part of your referral network"
            />

            <StepCard
              icon={isDark ? <img.rewardDark width={24} height={24} /> : <img.rewardLight width={24} height={24} />}
              title="Earn rewards"
              description="After your friends completes their first transaction, you both earn exclusive NGN500.00"
            />

            <StepCard
              icon={isDark ? <img.redeemDark width={24} height={24} /> : <img.redeemLight width={24} height={24} />}
              title="Redeem points"
              description="Redeem your earned rewards to your account wallet"
            />
          </View>
        </View>

        {/* Rewards history */}
        <View className="bg-[#FFFFFF] dark:bg-[#0C0C0C] mt-[20px] border border-[#EFEFEF] dark:border-[#232323] rounded-[30px] overflow-hidden">
          <View className="p-4">
            <ThemedText weight="bold" className="text-[16px] mb-3">Rewards history</ThemedText>

            {isLoading && history.length === 0 ? (
              <ActivityIndicator />
            ) : history.length === 0 ? (
              <RewardEmptyState isDark={isDark} />
            ) : (
              <FlatList
                data={history}
                keyExtractor={(item) => String(item?.id)}
                scrollEnabled={false}
                renderItem={({ item }: { item: any }) => (
                  <StepCard
                    icon={isDark ? <img.giftReward width={24} height={24} /> : <img.giftRewardDark width={24} height={24} />}
                    title={item.referred_username}
                    description={formatRewardDate(item.created_at)}
                    isReward
                  />
                )}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.4}
                ListFooterComponent={isFetchingMore ? <ActivityIndicator className="mt-2" /> : null}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

export default Referfriends;
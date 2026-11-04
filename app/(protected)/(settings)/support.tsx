import { SettingsHeader } from "@/components/customs/settingsHeader";
import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { img } from "@/constant/image";
import { useTheme } from "@/context/ThemeProvider";
import { useToast } from "@/context/ToastProvider";
import { openChat } from "@/lib/zoho-service";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { openAppSupport } from "@/lib/zoho-service";
import { useAppSelector } from "@/redux/store";
import * as Clipboard from "expo-clipboard";
import { ChevronRight } from "lucide-react-native";
import React from "react";
import { Linking, Pressable, ScrollView, View } from "react-native";

interface SupportCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  variant?: "full" | "half";
}

const SupportCard: React.FC<SupportCardProps> = ({
  title,
  description,
  icon,
  onPress,
  onLongPress,
  variant = "full",
}) => {
  const { isDark } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      className={`bg-[#FCFCFC] dark:bg-[#0C0C0C] border border-[#EFEFEF] dark:border-[#232323] p-3 ${variant === "half" ? "flex-1 rounded-[30px]" : "w-full flex-row items-center justify-between rounded-[30px] mb-4"
        }`}
    >
      <View className={variant === "half" ? "flex-col" : "flex-row items-center gap-4"}>
        <View className={`bg-[#F6FFF4] dark:bg-transparent items-center justify-center rounded-[15px] ${variant === "half" ? "w-12 h-12 mb-4" : "w-14 h-14"}`}>
          {icon}
        </View>
        <View className="flex-1">
          <ThemedText family="primary" weight="bold" className="text-[14px]">
            {title}
          </ThemedText>
          <ThemedText family="primary" variant="secondary" weight="medium" className="text-b3 mt-1" numberOfLines={1}>
            {description}
          </ThemedText>
        </View>
      </View>
      {variant === "full" && (
        <ChevronRight size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
      )}
    </Pressable>
  );
};

interface SocialCardProps {
  title: string;
  handle: string;
  icon: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
}

const SocialCard: React.FC<SocialCardProps> = ({ title, handle, icon, onPress, onLongPress }) => {
  const { isDark } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      className="flex-row items-center justify-between p-3 bg-[#FCFCFC] dark:bg-[#0C0C0C] border border-[#EFEFEF] dark:border-[#232323] rounded-[24px] mb-2"
    >
      <View className="flex-row items-center gap-3">
        <View className="bg-[#F6FFF4] dark:bg-transparent p-2 rounded-[12px]">
          {icon}
        </View>
        <View>
          <ThemedText family="primary" weight="bold" className="text-b2">
            {title}
          </ThemedText>
          <ThemedText family="primary" variant="secondary" weight="medium" className="text-b3">
            {handle}
          </ThemedText>
        </View>
      </View>
      <ChevronRight size={24} color={isDark ? "#9CA3AF" : "#6B7280"} />
    </Pressable>
  );
};

const Support = () => {
  const router = useRouter();
  const { isDark } = useTheme();
  const { user } = useAppSelector((state) => state.auth);
  const { user: userInfo, profile } = user || {};
  const toast = useToast();

  const handleOpenUrl = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        toast.showToast("Cannot open this link", "error");
      }
    } catch (error) {
      toast.showToast("An error occurred", "error");
    }
  };

  const handleCopyText = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    toast.showToast(`${label} copied to clipboard`, "success");
  };

  const whatsappNumber = profile?.app_whatsapp || "+2349025730919";
  const emailAddress = profile?.app_email || "Atrader@info.com";
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}`;
  const emailUrl = `mailto:${emailAddress}`;

  return (
    <ThemedView className="flex-1">
      <SettingsHeader title="Contact support" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View className="items-center mt-10 mb-8">
          <View className="p-1 border border-[#EFEFEF] dark:border-[#22C55E]/40  bg-[#FFFFFF] dark:bg-[#111111] rounded-[12px]">
            {isDark ? (
              <img.supportDark width={36} height={36} />
            ) : (
              <img.supportLight width={36} height={36} />
            )}
          </View>
          <ThemedText className="text-h6 mt-5" weight="regular" variant="secondary" family="primary">
            Hello,{" "}
            <ThemedText className="text-h6 mt-5" weight="bold" family="primary">
              {userInfo?.username || "Ibraheem"}
            </ThemedText>
          </ThemedText>
          <ThemedText variant="secondary" className="text-b2 mt-1" family="primary">
            We'd love to hear from you
          </ThemedText>
        </View>

        <View
          className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#EFEFEF] dark:border-[#232323] p-2 rounded-[30px]"
        >
          {/* Support Options */}
          <Pressable
            onPress={() => {
              openAppSupport({
                id: user?.id ? String(user.id) : undefined,
                email: userInfo?.email,
                name: userInfo?.name || userInfo?.username,
              });
            }}
            className="flex-row items-center justify-between p-3 bg-[#E8FFE433] dark:bg-[#171717] border border-[#28a712a7] dark:border-[#232323] rounded-[24px] mb-2"
          >
            <View className="flex-row items-center gap-3">
              <View className="bg-[#F6FFF4] dark:bg-transparent p-2 rounded-[12px]">
                {isDark ? <img.chatLight width={24} height={24} /> : <img.chatDark width={24} height={24} />}
              </View>
              <View>
                <ThemedText family="primary" weight="bold" className="text-b2">
                  {"App Support"}
                </ThemedText>
                <ThemedText family="primary" variant="secondary" weight="medium" className="text-b3">
                  {"Instant chat with us"}
                </ThemedText>
              </View>
            </View>
            <ChevronRight size={24} color={isDark ? "#9CA3AF" : "#6B7280"} />
          </Pressable>

          <View className="flex-row gap-4 mb-6">
            <SupportCard
              variant="half"
              title="Contact support"
              description={whatsappNumber}
              icon={isDark ? <img.whatsappDark width={24} height={24} /> : <img.whatsappLight width={24} height={24} />}
              onPress={() => handleOpenUrl(whatsappUrl)}
              onLongPress={() => handleCopyText(whatsappNumber, "WhatsApp number")}
            />
            <SupportCard
              variant="half"
              title="Send us an email"
              description={emailAddress}
              icon={isDark ? <img.messageDark width={24} height={24} /> : <img.messageLight width={24} height={24} />}
              onPress={() => handleCopyText(emailAddress, "Email address")}
              onLongPress={() => handleCopyText(emailAddress, "Email address")}
            />
          </View>

          {/* Notice Text */}
          <ThemedText
            className="text-[14px] text-left mb-6 leading-5"
            variant="secondary"
            family="primary"
          >
            Make sure to follow/chat us from here as to avoid chatting with wrong support channel
          </ThemedText>

          {/* Social Links */}
          <SocialCard
            title="X (Twitter)"
            handle={profile?.twitter ? `@atraderapp` : "@atexchange"}
            icon={isDark ? <img.twitterDark width={24} height={24} /> : <img.twitterLight width={24} height={24} />}
            onPress={() => handleOpenUrl(`${profile?.twitter || "atrader"}`)}
            onLongPress={() => handleCopyText(profile?.twitter ? `@${profile.twitter}` : "@atexchange", "X handle")}
          />
          <SocialCard
            title="Instagram"
            handle={profile?.instagram ? `@atraderapp` : "@atexchange"}
            icon={isDark ? <img.instagramDark width={24} height={24} /> : <img.instagramLight width={24} height={24} />}
            onPress={() => handleOpenUrl(`${profile?.instagram || "atexchange"}`)}
            onLongPress={() => handleCopyText(profile?.instagram ? `${profile.instagram}` : "@atexchange", "Instagram handle")}
          />
          <SocialCard
            title="Website"
            handle={profile?.website || "myatraderapp.com"}
            icon={isDark ? <img.websiteDark width={24} height={24} /> : <img.websiteLight width={24} height={24} />}
            onPress={() => handleOpenUrl(profile?.website?.startsWith("http") ? 'https://atrader.cash' : `https://atrader.cash`)}
            onLongPress={() => handleCopyText(profile?.website || "atrader.cash", "Website URL")}
          />
        </View>
      </ScrollView>
    </ThemedView >
  );
};

export default Support;

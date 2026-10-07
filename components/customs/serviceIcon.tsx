import { img } from "@/constant/image";
import { useTheme } from "@/context/ThemeProvider";
import { getIcons } from "@/utils/bills";
import { usePathname } from "expo-router";
import React from "react";
import { Image, View } from "react-native";
import { ThemedText } from "../theme/themeText";

interface ServiceIconProps {
    role?: string;
    name?: string;
    image?: string;
    uri?: string;
    size?: number;
    isDetail?: boolean;
}

export const ServiceIcon: React.FC<ServiceIconProps> = ({
    role,
    name,
    image,
    uri,
    size = 32,
    isDetail,
}) => {
    const { isDark } = useTheme();
    const pathname = usePathname();

    // 1. Prioritize image/uri (e.g., Bank logos, coin icons)
    const imageSource = uri || image;
    if (imageSource && imageSource.startsWith("http")) {
        return (
            <Image
                key={imageSource}
                source={{ uri: imageSource }}
                style={{ width: size, height: size }}
                className="rounded-full"
            />
        );
    }

    // 2. Themed Service Icons (generic fallbacks or specific themed actions)
    const normalizedRole = role?.toLowerCase() || "";

    const getThemedIcon = () => {
        switch (normalizedRole) {
            case "airtime":
            case "AIRTIME":
            case "Airtime":
                return isDark ? <img.airtimeDark width={size} height={size} /> : <img.airtimeLight width={size} height={size} />;
            case "data":
            case "DATA":
            case "Data":
                return isDark ? <img.dataDark width={size} height={size} /> : <img.dataLight width={size} height={size} />;
            case "cable":
            case "CABLE":
            case "Cable":
            case "cable tv":
                return isDark ? <img.tvDark width={size} height={size} /> : <img.tvLight width={size} height={size} />;
            case "electricity":
            case "bill":
            case "ELECTRICITY":
            case "BILL":
            case "Electricity":
            case "Bill":
                return isDark ? <img.electDark width={size} height={size} /> : <img.electLight width={size} height={size} />;
            case "giftcard":
            case "GIFTCARD":
            case "Giftcard":
            case "buy gift card":
            case "sell gift card":
                return isDark ? <img.giftcardDark width={size} height={size} /> : <img.giftcardLight width={size} height={size} />;
            case "crypto":
            case "CRYPTO":
            case "Crypto":
            case "buy crypto":
            case "sell crypto":
                return isDark ? <img.cryptoDark width={size} height={size} /> : <img.cryptoLight width={size} height={size} />;
            case "betting":
            case "BETTING":
            case "Betting":
                return isDark ? <img.bettingDark width={size} height={size} /> : <img.bettingLight width={size} height={size} />;
            case "withdrawal":
            case "WITHDRAWAL":
            case "Withdrawal":
                return isDark ? <img.walletLightArrowDown width={size} height={size} /> : <img.walletArrowDown width={size} height={size} />;
            case "deposit":
            case "debit":
            case "credit":
                return isDark ? <img.walletLightArrowDown width={size} height={size} /> : <img.walletArrowUp width={size} height={size} />;
            default:
                return null;
        }
    };

    const themedIcon = getThemedIcon();
    if (themedIcon) return themedIcon;

    // 1.5 Specific Network/Provider/Service Icon (MTN, Glo, Airtime, Betting, etc.)
    // We prioritize icons from constant/icon.ts (via getIcons) for a colorful look in lists
    const specificName = name || role;
    if (specificName && pathname === "/detailtransaction" && !isDetail) {
        const SpecificIcon = getIcons(specificName);
        if (SpecificIcon) {
            return <SpecificIcon width={size} height={size} />;
        }
    }

    // 3. Fallback to first character
    const firstChar = role?.charAt(0).toUpperCase() || "T";
    return (
        <View className="bg-white dark:bg-dark-500 w-8 h-8 items-center justify-center rounded-[12px]">
            <ThemedText className="text-center text-xs" weight="bold">
                {firstChar}
            </ThemedText>
        </View>
    );
};

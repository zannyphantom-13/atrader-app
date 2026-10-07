import { useTheme } from "@/context/ThemeProvider";
import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

interface SkeletonItemProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}

const SkeletonItem: React.FC<SkeletonItemProps> = ({
  width,
  height,
  borderRadius = 4,
  style,
}) => {
  const { isDark } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: isDark ? "#333333" : "#E0E0E0",
          opacity,
        },
        style,
      ]}
    />
  );
};

export const WalletCryptoSkeleton = () => {
  return (
    <View className="flex-row items-center gap-4 rounded-xl bg-light-150 px-3 py-4 dark:bg-dark-700 mb-4">
      <SkeletonItem width={40} height={40} borderRadius={20} />
      <View className="flex-1 gap-2">
        <SkeletonItem width="60%" height={16} borderRadius={4} />
        <SkeletonItem width="30%" height={12} borderRadius={4} />
      </View>
    </View>
  );
};

export const WalletGiftCardSkeleton = () => {
  return (
    <View className="mb-1 flex-row items-center gap-4 rounded-[16px] border-[0.5px] border-[#E5E5E5] bg-[#F9F9F9] px-3 py-4 dark:border-[#1F1F1F] dark:bg-[#0C0C0C]">
      <SkeletonItem width={40} height={40} borderRadius={20} />
      <View className="flex-1">
        <SkeletonItem width="70%" height={16} borderRadius={4} />
      </View>
    </View>
  );
};

export const WalletSkeletonList = ({ type, count = 5 }: { type: 'crypto' | 'giftcard', count?: number }) => {
  return (
    <View className="py-2">
      {Array.from({ length: count }).map((_, i) => (
        type === 'crypto' ? (
          <WalletCryptoSkeleton key={i} />
        ) : (
          <WalletGiftCardSkeleton key={i} />
        )
      ))}
    </View>
  );
};

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

export const ChatListSkeleton = () => {
  const { isDark } = useTheme();

  return (
    <View
      className="flex-row items-center px-5 py-4"
      style={{
        borderBottomWidth: 0.5,
        borderBottomColor: isDark ? "#1a1a1a" : "#F3F4F6",
      }}
    >
      <View className="mr-3">
        <SkeletonItem width={44} height={44} borderRadius={22} />
      </View>

      <View className="flex-1 mr-2 gap-2">
        <SkeletonItem width="60%" height={16} borderRadius={4} />
        <SkeletonItem width="80%" height={12} borderRadius={4} />
      </View>

      <View className="items-end gap-2">
        <SkeletonItem width={40} height={12} borderRadius={4} />
        <SkeletonItem width={20} height={20} borderRadius={10} />
      </View>
    </View>
  );
};

export const MessageBubbleSkeleton = ({ isUser = false }: { isUser?: boolean }) => {
  const { isDark } = useTheme();

  if (isUser) {
    return (
      <View className="mb-4 items-end">
        <SkeletonItem
          width={180}
          height={60}
          borderRadius={16}
          style={{ marginBottom: 6 }}
        />
        <View className="flex-row items-center mr-1">
          <SkeletonItem width={40} height={10} borderRadius={2} style={{ marginRight: 6 }} />
          <SkeletonItem width={20} height={20} borderRadius={10} />
        </View>
      </View>
    );
  }

  return (
    <View className="mb-4">
      <View className="flex-row items-center mb-1.5">
        <SkeletonItem width={24} height={24} borderRadius={12} style={{ marginRight: 8 }} />
        <SkeletonItem width={120} height={12} borderRadius={4} />
      </View>
      <View className="ml-8">
        <SkeletonItem width={220} height={60} borderRadius={16} />
      </View>
    </View>
  );
};

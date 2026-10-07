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

export const TransactionSkeleton = () => {
    return (
        <View className="flex-row items-center justify-between py-[7px] px-[8px] rounded-[16px] my-1 border-[#EFEFEF] dark:border-[#232323] border-[0.5px] bg-[#FFFFFF] dark:bg-[#111111]">
            <View className="flex-row items-center flex-1">
                <SkeletonItem width={40} height={40} borderRadius={12} style={{ marginRight: 12 }} />
                <View className="flex-1 gap-2">
                    <SkeletonItem width="60%" height={16} borderRadius={4} />
                    <SkeletonItem width="40%" height={12} borderRadius={4} />
                </View>
            </View>
            <View className="items-end gap-2">
                <SkeletonItem width={60} height={16} borderRadius={4} />
                <SkeletonItem width={40} height={12} borderRadius={4} />
            </View>
        </View>
    );
};

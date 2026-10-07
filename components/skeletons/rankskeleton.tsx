import { useTheme } from "@/context/ThemeProvider";
import React, { useEffect, useRef } from "react";
import { Animated, View, Dimensions } from "react-native";


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

export const RankSkeleton = () => {
    return (
        <View className="flex-1 px-6">
            {/* Podium Skeleton */}
            <View className="flex-row items-end justify-between pt-12 pb-16 h-64">
                {/* 2nd Place */}
                <View className="flex-1 items-center">
                    <SkeletonItem width={56} height={56} borderRadius={28} style={{ marginBottom: 8 }} />
                    <SkeletonItem width={60} height={16} borderRadius={4} style={{ marginBottom: 4 }} />
                    <SkeletonItem width={40} height={20} borderRadius={8} />
                </View>

                {/* 1st Place */}
                <View className="flex-1 items-center pb-12">
                    <SkeletonItem width={56} height={56} borderRadius={28} style={{ marginBottom: 8 }} />
                    <SkeletonItem width={60} height={16} borderRadius={4} style={{ marginBottom: 4 }} />
                    <SkeletonItem width={40} height={20} borderRadius={8} />
                </View>

                {/* 3rd Place */}
                <View className="flex-1 items-center">
                    <SkeletonItem width={56} height={56} borderRadius={28} style={{ marginBottom: 8 }} />
                    <SkeletonItem width={60} height={16} borderRadius={4} style={{ marginBottom: 4 }} />
                    <SkeletonItem width={40} height={20} borderRadius={8} />
                </View>
            </View>

            {/* Title / Info Skeletons */}
            <View className="py-6">
                <SkeletonItem width="60%" height={24} borderRadius={4} style={{ marginBottom: 8 }} />
                <SkeletonItem width="90%" height={16} borderRadius={4} />
            </View>

            {/* List Header Skeleton */}
            <View className="bg-[#F5F5F5] dark:bg-[#111111] rounded-[14px] flex-row py-4 px-4 mb-4">
                <SkeletonItem width={30} height={16} borderRadius={4} />
                <SkeletonItem width={100} height={16} borderRadius={4} style={{ marginLeft: 16, flex: 1 }} />
                <SkeletonItem width={50} height={16} borderRadius={4} />
            </View>

            {/* List Item Skeletons */}
            {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} className="bg-white dark:bg-[#0C0C0C] border border-[#EFEFEF] dark:border-[#232323] rounded-[24px] flex-row items-center py-4 px-4 mb-3">
                    <SkeletonItem width={20} height={16} borderRadius={4} />
                    <SkeletonItem width={40} height={40} borderRadius={20} style={{ marginLeft: 12 }} />
                    <SkeletonItem width="40%" height={18} borderRadius={4} style={{ marginLeft: 12, flex: 1 }} />
                    <SkeletonItem width={60} height={24} borderRadius={8} />
                </View>
            ))}
        </View>
    );
};

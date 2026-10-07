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

export const DataPlanSkeleton = () => {
    return (
        <View className="flex-col w-full px-1">
            {[1, 2, 3, 4, 5].map((item) => (
                <View key={item} className="flex-row justify-between items-center p-4 mb-2 rounded-[30px] bg-light-150 dark:bg-dark-900 border border-border-light dark:border-border-dark">
                    <View className="gap-2 w-full">
                        <SkeletonItem width="50%" height={16} borderRadius={4} />
                        <SkeletonItem width="30%" height={12} borderRadius={4} />
                    </View>
                </View>
            ))}
        </View>
    );
};

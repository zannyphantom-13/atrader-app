import { ThemedText } from "@/components/theme/themeText";
import { useTheme } from "@/context/ThemeProvider";
import { useRouter } from "expo-router";
import { ArrowLeftIcon } from "lucide-react-native";
import React from "react";
import { Platform, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SettingsHeaderProps {
    title: string;
    children?: React.ReactNode;
    showBackButton?: boolean;
    showTitle?: boolean;
    rightAction?: React.ReactNode;
}

export const SettingsHeader = ({ title, children, showBackButton = true, showTitle = true, rightAction }: SettingsHeaderProps) => {
    const router = useRouter();
    const { isDark } = useTheme();
    const insets = useSafeAreaInsets();

    return (
        <View
            style={{
                backgroundColor: isDark ? "#111111" : "#ffffff",
                borderBottomWidth: children ? 0 : 1,
                borderBottomColor: isDark ? "#232323" : "#EFEFEF",
                paddingTop: Platform.OS === "ios" ? 0 : insets.top - 10,
            }}
        >
            <View
                style={{
                    paddingTop: Platform.OS === "ios" ? insets.top : insets.top - 10,
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingBottom: 12,
                }}
            >
                {showBackButton && (<Pressable
                    onPress={() => router.back()}
                    style={{
                        padding: 8,
                        marginLeft: -8,
                    }}
                >
                    <ArrowLeftIcon size={24} color={isDark ? "#B5B5B5" : "#000000"} />
                </Pressable>)}
                {showTitle && (<ThemedText
                    family="primary"
                    weight="medium"
                    style={{
                        flex: 1,
                        fontSize: 18,
                        marginLeft: 8,
                        color: isDark ? "#ffffff" : "#060606",
                    }}
                >
                    {title}
                </ThemedText>)}
                {rightAction && <View>{rightAction}</View>}
            </View>
            {children && (
                <View
                    style={{
                        borderBottomWidth: 1,
                        borderBottomColor: isDark ? "#232323" : "#EFEFEF",
                    }}
                >
                    {children}
                </View>
            )}
        </View>
    );
};

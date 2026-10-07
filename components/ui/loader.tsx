import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTheme } from "@/context/ThemeProvider";

interface LoaderProps {
    size?: "small" | "large";
    color?: string;
    className?: any;
}

export const Loader: React.FC<LoaderProps> = ({
    size = "large",
    color,
    className,
}) => {
    const { isDark } = useTheme();

    const loaderColor = color || (isDark ? "#fff" : "#000");

    return (
        <View style={[styles.container, className]}>
            <ActivityIndicator size={size} color={loaderColor} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});
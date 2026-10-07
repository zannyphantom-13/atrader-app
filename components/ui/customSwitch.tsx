import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, ViewStyle } from "react-native";

interface CustomSwitchProps {
    value: boolean;
    onValueChange: (value: boolean) => void;
    trackWidth?: number;
    trackHeight?: number;
    thumbSize?: number;
    activeTrackColor?: string;
    inactiveTrackColor?: string;
    activeThumbColor?: string;
    inactiveThumbColor?: string;
    style?: ViewStyle;
}

export const CustomSwitch: React.FC<CustomSwitchProps> = ({
    value,
    onValueChange,
    trackWidth = 44,
    trackHeight = 24,
    thumbSize = 18,
    activeTrackColor = "#007AFF",
    inactiveTrackColor = "#E9E9EA",
    activeThumbColor = "#FFFFFF",
    inactiveThumbColor = "#FFFFFF",
    style,
}) => {
    const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: value ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [value]);

    const translateX = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [2, trackWidth - thumbSize - 2], // 2 pixels padding
    });

    const backgroundColor = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [inactiveTrackColor, activeTrackColor],
    });

    const thumbColor = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [inactiveThumbColor, activeThumbColor],
    });

    return (
        <Pressable onPress={() => onValueChange(!value)} style={style}>
            <Animated.View
                style={[
                    styles.track,
                    {
                        width: trackWidth,
                        height: trackHeight,
                        borderRadius: trackHeight / 2,
                        backgroundColor: backgroundColor,
                    },
                ]}
            >
                <Animated.View
                    style={[
                        styles.thumb,
                        {
                            width: thumbSize,
                            height: thumbSize,
                            borderRadius: thumbSize / 2,
                            backgroundColor: thumbColor,
                            transform: [{ translateX }],
                        },
                    ]}
                />
            </Animated.View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    track: {
        justifyContent: "center",
    },
    thumb: {
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
});

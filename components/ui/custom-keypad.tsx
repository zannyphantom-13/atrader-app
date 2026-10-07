import { ThemedText } from "@/components/theme/themeText";
import { useTheme } from "@/context/ThemeProvider";
import { ChevronLeft } from "lucide-react-native";
import React from "react";
import { Pressable, View, ViewStyle } from "react-native";

interface CustomKeypadProps {
    onPress: (key: string) => void;
    onDelete: () => void;
    style?: ViewStyle;
}

const keys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["0", "delete"],
];

export const CustomKeypad: React.FC<CustomKeypadProps> = ({ onPress, onDelete, style }) => {
    const { isDark } = useTheme();

    const handlePress = (key: string) => {
        if (key === "delete") {
            onDelete();
        } else if (key !== "") {
            onPress(key);
        }
    };

    return (
        <View className="pt-3 px-2 bg-[#FFFFFF] dark:bg-[#111111] rounded-[30px] border-[#EFEFEF] dark:border-[#232323] border" style={style}>
            {keys.map((row, rowIndex) => (
                <View key={rowIndex} className="flex-row justify-between mb-2 gap-2">
                    {row.map((key, keyIndex) => {
                        if (key === "") return <View key={keyIndex} className="flex-1 h-[60px]" />; // Spacer

                        const isDelete = key === "delete";

                        return (
                            <Pressable
                                key={keyIndex}
                                onPress={() => handlePress(key)}
                                className={`flex-1 h-[50px] items-center justify-center rounded-[20px] border-[#EFEFEF] dark:border-[#232323] border ${isDark ? "bg-[#0C0C0C]" : "bg-[#F2F2F7]"
                                    }`}
                                style={({ pressed }) => ({
                                    opacity: pressed ? 0.7 : 1,
                                })}
                            >
                                {isDelete ? (
                                    <ChevronLeft size={24} color={isDark ? "#CECECE" : "black"} />
                                ) : (
                                    <ThemedText className="text-[16px] font-semibold">
                                        {key}
                                    </ThemedText>
                                )}
                            </Pressable>
                        );
                    })}
                </View>
            ))}
        </View>
    );
};

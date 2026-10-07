import { CustomModal } from "@/components/customs/customModal";
import { ThemedText } from "@/components/theme/themeText";
import { useTheme } from "@/context/ThemeProvider";
import { colorThemes } from "@/styles/theme";
import { app_config } from "@/utils/config";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";

interface SelectionModalProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    options: { label: string; value: string | number }[];
    selectedValue: string | number | null;
    onSelect: (value: string | number) => void;
    height?: string | number;
}

export const SelectionModal: React.FC<SelectionModalProps> = ({
    visible,
    onClose,
    title = "Select Option",
    options,
    selectedValue,
    onSelect,
    height = "50%",
}) => {
    const { isDark } = useTheme();

    return (
        <CustomModal
            visible={visible}
            onClose={onClose}
            title={title}
            height={height}
            showHandle={true}
            showHeader={true}
            closebutton={true}
            containerStyle={{
                backgroundColor: isDark ? "#060606" : "#ffffff",
            }}
        >
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 4 }}
            >
                <View className="gap-2">
                    {options.map((option, index) => {
                        const isSelected = selectedValue === option.value;
                        return (
                            <Pressable
                                key={index}
                                onPress={() => {
                                    onSelect(option.value);
                                    onClose();
                                }}
                                className={`py-4 px-4 rounded-xl flex-row items-center justify-between border ${isSelected
                                    ? `bg-[${colorThemes[app_config.theme][50]}] dark:bg-[${colorThemes[app_config.theme][900]}] border-[${colorThemes[app_config.theme][500]}]`
                                    : "bg-transparent border-[#EFEFEF] dark:border-[#232323]"
                                    }`}
                                style={
                                    isSelected
                                        ? {
                                            borderColor: colorThemes[app_config.theme][500],
                                            backgroundColor: isDark ? "#111111" : "#F8FAFC",
                                        }
                                        : {}
                                }
                            >
                                <ThemedText
                                    className={`text-[16px] font-medium ${isSelected
                                        ? `text-[${colorThemes[app_config.theme][500]}]`
                                        : "text-black dark:text-white"
                                        }`}
                                    style={
                                        isSelected
                                            ? { color: colorThemes[app_config.theme][500] }
                                            : {}
                                    }
                                >
                                    {option.label}
                                </ThemedText>

                                {isSelected && (
                                    <View
                                        className="w-4 h-4 rounded-full bg-primary-500"
                                        style={{ backgroundColor: colorThemes[app_config.theme][500] }}
                                    />
                                )}
                            </Pressable>
                        );
                    })}
                </View>
            </ScrollView>
        </CustomModal>
    );
};

import { CustomModal } from "@/components/customs/customModal";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeProvider";
import React from "react";
import { Platform, Pressable, ScrollView, View } from "react-native";
import { ThemedText } from "../theme/themeText";

interface MonthYearPickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedMonth: number;
  selectedYear: number;
  onSelect: (month: number, year: number) => void;
}

const MonthYearPickerModal: React.FC<MonthYearPickerModalProps> = ({
  visible,
  onClose,
  selectedMonth,
  selectedYear,
  onSelect,
}) => {
  const { isDark } = useTheme();
  const [tempMonth, setTempMonth] = React.useState(selectedMonth);
  const [tempYear, setTempYear] = React.useState(selectedYear);

  // Reset temp values when modal opens
  React.useEffect(() => {
    if (visible) {
      setTempMonth(selectedMonth);
      setTempYear(selectedYear);
    }
  }, [visible, selectedMonth, selectedYear]);

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const handleApply = () => {
    onSelect(tempMonth, tempYear);
    onClose();
  };

  return (
    <CustomModal
      visible={visible}
      onClose={onClose}
      title="Select Period"
      height={Platform.OS === "ios" ? "auto" : 580}
      showHandle={true}
      showHeader={true}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="px-2 pb-4">
          {/* Month Selection */}
          <ThemedText
            family="primary"
            weight="medium"
            variant="secondary"
            className="text-b2 mb-3"
          >
            Month
          </ThemedText>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {months.map((month, index) => {
              const monthNum = index + 1;
              const isSelected = tempMonth === monthNum;
              return (
                <Pressable
                  key={monthNum}
                  onPress={() => setTempMonth(monthNum)}
                  className={`px-4 py-2 rounded-full border ${isSelected
                      ? "bg-primary-500 border-primary-500"
                      : "bg-light-150 dark:bg-dark-700 border-border-light dark:border-border-dark"
                    }`}
                  style={{ minWidth: 70 }}
                >
                  <ThemedText
                    family="primary"
                    weight="medium"
                    className={`text-b3 text-center ${isSelected ? "!text-white" : ""}`}
                  >
                    {month}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {/* Year Selection */}
          <ThemedText
            family="primary"
            weight="medium"
            variant="secondary"
            className="text-b2 mb-3"
          >
            Year
          </ThemedText>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {years.map((year) => {
              const isSelected = tempYear === year;
              return (
                <Pressable
                  key={year}
                  onPress={() => setTempYear(year)}
                  className={`px-4 py-2 rounded-full border ${isSelected
                      ? "bg-primary-500 border-primary-500"
                      : "bg-light-150 dark:bg-dark-700 border-border-light dark:border-border-dark"
                    }`}
                  style={{ minWidth: 80 }}
                >
                  <ThemedText
                    family="primary"
                    weight="medium"
                    className={`text-b3 text-center ${isSelected ? "!text-white" : ""}`}
                  >
                    {year}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3 mt-2">
            <View className="flex-1">
              <Button
                variant="outline"
                onPress={onClose}
                className="!border-primary-500"
              >
                <ThemedText
                  family="primary"
                  weight="medium"
                  className="text-b2 !text-primary-500"
                >
                  Cancel
                </ThemedText>
              </Button>
            </View>
            <View className="flex-1">
              <Button onPress={handleApply}>
                <ThemedText
                  family="primary"
                  weight="medium"
                  className="text-b2 !text-white"
                >
                  Apply
                </ThemedText>
              </Button>
            </View>
          </View>
        </View>
      </ScrollView>
    </CustomModal>
  );
};

export default MonthYearPickerModal;

import { ThemedText } from "@/components/theme/themeText";
import { Button } from "@/components/ui/button";
import { CustomModal } from "@/components/ui/modal";
import { useTheme } from "@/context/ThemeProvider";
import { colorThemes } from "@/styles/theme";
import { app_config } from "@/utils/config";
import React, { useEffect, useState } from "react";
import { LayoutChangeEvent, Pressable, ScrollView, View } from "react-native";
// import { SelectionModal } from "./selectionmodal"; // Commented out as explicitly requested to comment logic
import { Calendar, DateData } from "react-native-calendars";
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

type AnimatedTabsProps = {
  options: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
};

const AnimatedTabs: React.FC<AnimatedTabsProps> = ({ options, activeTab, onTabChange }) => {
  const { isDark } = useTheme();
  // We assume 2 options for now, simplified for equal width flex-1
  const activeIndex = options.indexOf(activeTab);
  const translateX = useSharedValue(0);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (containerWidth > 0) {
      const tabWidth = containerWidth / options.length;
      translateX.value = withTiming(activeIndex * tabWidth, { duration: 300 });
    }
  }, [activeIndex, containerWidth, options.length]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: containerWidth / options.length - 8, // Subtract padding
  }));

  return (
    <View
      className="flex-row bg-[#F8F8F8] dark:bg-[#111111] p-2 rounded-[20px] mb-4 relative"
      onLayout={(e: LayoutChangeEvent) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View
        style={[
          animatedStyle,
          {
            position: "absolute",
            top: 4,
            left: 4,
            bottom: 4,
            borderRadius: 20,
            backgroundColor: isDark ? "#0C0C0C" : "white",
            // shadowColor: "#000",
            // shadowOffset: { width: 0, height: 2 },
            // shadowOpacity: 0.1,
            // shadowRadius: 4,
            // elevation: 2,
          },
        ]}
      />
      {options.map((option) => (
        <Pressable
          key={option}
          onPress={() => onTabChange(option)}
          className="flex-1 py-3 items-center justify-center z-10"
        >
          <ThemedText
            className={`font-semibold ${activeTab === option
              ? "!text-primary-500 dark:text-white"
              : "text-[#697586]"
              }`}
          >
            {option}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
};

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: {
    category?: string;
    status?: string | number;
    dateFrom?: Date;
    dateTo?: Date;
  }) => void;
  categoryOptions?: { id?: string; label: string; value: string }[];
  title?: string;
  filterType: "category" | "dateRange";
  selectedCategory?: string | null;
  setSelectedCategory?: (category: string | null) => void;
  selectedStatus?: string | null;
  setSelectedStatus?: (status: string | null) => void;
  dateRange?: { from: Date | null; to: Date | null };
  setDateRange?: (range: { from: Date | null; to: Date | null }) => void;
  onClear?: () => void;
}

export const Filtermodal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApply,
  categoryOptions = [],
  title = "Filter",
  filterType,
  selectedCategory,
  setSelectedCategory,
  selectedStatus,
  setSelectedStatus,
  dateRange,
  setDateRange,
  onClear,
}) => {
  const { isDark } = useTheme();

  // Local state for temporary selections before applying
  const [activeTab, setActiveTab] = useState<"Category" | "Status">("Category");
  const [tempCategory, setTempCategory] = useState<string | null>(selectedCategory || null);
  const [tempStatus, setTempStatus] = useState<string | null>(selectedStatus || null);

  // Date filter state
  const currentYear = new Date().getFullYear();
  const [dateMode, setDateMode] = useState<"single" | "range">("single");
  const [targetDate, setTargetDate] = useState<"from" | "to">("from"); // Which date we are editing in range mode

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [markedDates, setMarkedDates] = useState<any>({});

  // Helper to format Date to YYYY-MM-DD
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  /* OLD STATE COMMENTED OUT
  const [tempMonth, setTempMonth] = useState<number>(new Date().getMonth() + 1);
  const [tempYear, setTempYear] = useState<number>(currentYear);
  const [tempDay, setTempDay] = useState<number | null>(null);

  // Range specific local state
  const [rangeFrom, setRangeFrom] = useState<{ day: number | null; month: number; year: number }>({
    day: null,
    month: new Date().getMonth() + 1,
    year: currentYear,
  });
  const [rangeTo, setRangeTo] = useState<{ day: number | null; month: number; year: number }>({
    day: null,
    month: new Date().getMonth() + 1,
    year: currentYear,
  });
  */

  const onDayPress = (day: DateData) => {
    if (dateMode === "single") {
      setSelectedDate(day.dateString);
      setMarkedDates({
        [day.dateString]: { selected: true, selectedColor: isDark ? colorThemes[app_config.theme][500] : colorThemes[app_config.theme][500] }
      });
    } else {
      // Range Logic
      if (!startDate || (startDate && endDate)) {
        // New range start
        setStartDate(day.dateString);
        setEndDate(null);
        setMarkedDates({
          [day.dateString]: { startingDay: true, color: colorThemes[app_config.theme][500], textColor: 'white' }
        });
      } else if (startDate && !endDate) {
        // Range end
        const start = new Date(startDate).getTime();
        const end = new Date(day.dateString).getTime();

        if (end < start) {
          // User clicked a date before start, reset start
          setStartDate(day.dateString);
          setMarkedDates({
            [day.dateString]: { startingDay: true, color: colorThemes[app_config.theme][500], textColor: 'white' }
          });
        } else {
          setEndDate(day.dateString);
          // Calculate range marks
          const range: any = {};
          let curr = new Date(startDate);
          // Add start
          range[startDate] = { startingDay: true, color: colorThemes[app_config.theme][500], textColor: 'white' };

          // Fill middle
          const endD = new Date(day.dateString);
          curr.setDate(curr.getDate() + 1);
          while (curr < endD) {
            const dateStr = formatDate(curr);
            range[dateStr] = { color: isDark ? `${colorThemes[app_config.theme][500]}66` : `${colorThemes[app_config.theme][500]}33`, textColor: isDark ? 'white' : 'black' };
            curr.setDate(curr.getDate() + 1);
          }

          // Add end
          range[day.dateString] = { endingDay: true, color: colorThemes[app_config.theme][500], textColor: 'white' };

          setMarkedDates({ ...range });
        }
      }
    }
  };

  // Sync props to state when modal opens
  useEffect(() => {
    if (visible) {
      setTempCategory(selectedCategory || null);
      setTempStatus(selectedStatus || null);

      if (dateRange?.from) {
        // Initialize Calendar State
        const fDate = formatDate(dateRange.from);
        if (dateRange?.to) {
          setDateMode("range");
          setStartDate(fDate);
          const tDate = formatDate(dateRange.to);
          setEndDate(tDate);

          // Generate initial marks
          // (Simple logic: just mark start and end for now to avoid complexity in this hook, usually onDayPress handles dynamic fill)
          // Or re-use the filling logic:
          const range: any = {};
          range[fDate] = { startingDay: true, color: colorThemes[app_config.theme][500], textColor: 'white' };

          if (fDate !== tDate) {
            range[tDate] = { endingDay: true, color: colorThemes[app_config.theme][500], textColor: 'white' };
            // Simplified fill visualization for initial load:
            // Ideally we loop dateRange.from -> dateRange.to
          }
          setMarkedDates(range);

        } else {
          setDateMode("single");
          setSelectedDate(fDate);
          setMarkedDates({
            [fDate]: { selected: true, selectedColor: colorThemes[app_config.theme][500] }
          });
        }

        /* OLD SYNC STATE COMMENTED
        // Initialize simple state
        setTempMonth(dateRange.from.getMonth() + 1);
        setTempYear(dateRange.from.getFullYear());
        setTempDay(dateRange.from.getDate());

        // Initialize range state
        setRangeFrom({
          day: dateRange.from.getDate(),
          month: dateRange.from.getMonth() + 1,
          year: dateRange.from.getFullYear(),
        });
        */
      }

      /* OLD RANGE TO LOGIC
      if (dateRange?.to) {
        setDateMode("range");
        setRangeTo({
          day: dateRange.to.getDate(),
          month: dateRange.to.getMonth() + 1,
          year: dateRange.to.getFullYear(),
        });
      } else {
        setDateMode("single");
      }
      */
    }
  }, [visible, selectedCategory, selectedStatus, dateRange]);

  const handleApply = () => {
    if (filterType === "category") {
      onApply({
        category: tempCategory || undefined,
        status: tempStatus === "Successful transactions" ? 1 : tempStatus === "Pending transactions" ? 0 : tempStatus === "Failed transactions" ? 2 : undefined, // Map status string to API values if needed, otherwise pass string
      });
      // Also update parent state if setters provided
      if (setSelectedCategory) setSelectedCategory(tempCategory);
      if (setSelectedStatus) setSelectedStatus(tempStatus);
    } else {
      // Date Logic
      // REACT NATIVE CALENDARS IMPLEMENTATION
      let fromDate: Date | undefined;
      let toDate: Date | undefined;

      if (dateMode === "single") {
        if (selectedDate) {
          fromDate = new Date(selectedDate);
          toDate = new Date(selectedDate);
        }
      } else {
        if (startDate) fromDate = new Date(startDate);
        if (endDate) toDate = new Date(endDate);

        // If only start date selected, make it effectively single day range
        if (startDate && !endDate) toDate = new Date(startDate);
      }

      onApply({
        dateFrom: fromDate,
        dateTo: toDate,
      });
      if (setDateRange) setDateRange({ from: fromDate || null, to: toDate || null });

      /* OLD LOGIC COMMENTED OUT
      let fromDate, toDate;
      if (dateMode === "single") {
        if (tempDay) {
          fromDate = new Date(tempYear, tempMonth - 1, tempDay);
          toDate = new Date(tempYear, tempMonth - 1, tempDay);
        } else {
          fromDate = new Date(tempYear, tempMonth - 1, 1);
          toDate = new Date(tempYear, tempMonth, 0);
        }
      } else {
        // Range Mode
        const fromDay = rangeFrom.day || 1;
        fromDate = new Date(rangeFrom.year, rangeFrom.month - 1, fromDay);
        const toDay = rangeTo.day || new Date(rangeTo.year, rangeTo.month, 0).getDate();
        toDate = new Date(rangeTo.year, rangeTo.month - 1, toDay);
      }
      onApply({
        dateFrom: fromDate,
        dateTo: toDate,
      });
      if (setDateRange) setDateRange({ from: fromDate, to: toDate });
      */
    }
    onClose();
  };

  const statusOptions = [
    "All",
    "Successful transactions",
    "Pending transactions",
    "Failed transactions",
  ];

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  // Selection Modal State
  // Selection Modal State
  const [selectionType, setSelectionType] = useState<"none" | "month" | "year" | "day">("none");
  const monthOptions = months.map((m, i) => ({ label: m, value: i + 1 }));
  const yearOptions = years.map((y) => ({ label: String(y), value: y }));

  // Calculate days in selected month
  /* OLD DEPENDENCIES COMMENTED
  const daysInMonth = new Date(tempYear, tempMonth, 0).getDate();
  const dayOptions = Array.from({ length: daysInMonth }, (_, i) => ({ label: String(i + 1), value: i + 1 }));

  const currentMonthLabel = months[tempMonth - 1] || "Select month";
  */


  const renderCategoryFilter = () => (
    <View className="flex-1">

      <AnimatedTabs
        options={["Category", "Status"]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as "Category" | "Status")}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {activeTab === "Category" ? (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <View className="flex-row flex-wrap gap-3">
              <Pressable
                onPress={() => setTempCategory(null)}
                className={`px-5 py-3 rounded-[20px] border ${tempCategory === null
                  ? `bg-[${colorThemes[app_config.theme][500]}] border-[${colorThemes[app_config.theme][500]}]`
                  : "bg-[#FFFFFF] dark:bg-[#111111]  border-[#EFEFEF] dark:border-[#232323]"
                  }`}
                style={tempCategory === null ? { backgroundColor: isDark ? '#0B2E02' : '#E8FFE4', borderColor: colorThemes[app_config.theme][500] } : { backgroundColor: isDark ? '#111111' : '#ffffff', }}
              >
                <ThemedText
                  className={`${tempCategory === null ? "!text-primary-500" : "text-black dark:text-white"}`}
                >
                  All
                </ThemedText>
              </Pressable>
              {categoryOptions.map((cat) => (
                <Pressable
                  key={cat.id || cat.value}
                  onPress={() => setTempCategory(cat.value)}
                  className={`px-5 py-3 rounded-[20px] border ${tempCategory === cat.value
                    ? ""
                    : "bg-transparent border-[#EFEFEF] dark:border-[#232323]"
                    }`}
                  style={tempCategory === cat.value ? { backgroundColor: isDark ? '#0B2E02' : '#E8FFE4', borderColor: colorThemes[app_config.theme][500] } : { backgroundColor: isDark ? '#111111' : '#ffffff', }}
                >
                  <ThemedText
                    className={`${tempCategory === cat.value ? "!text-primary-500 dark:text-white" : "text-black dark:text-white"}`}
                  >
                    {cat.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <View className="gap-3">
              <Pressable
                onPress={() => setTempStatus(null)}
                className={`px-5 py-4 rounded-2xl border w-full items-center ${tempStatus === null
                  ? ""
                  : "bg-transparent border-[#EFEFEF] dark:border-[#232323]"
                  }`}
                style={tempStatus === null ? { backgroundColor: isDark ? "#0B2E02" : "#E8FFE4", borderColor: colorThemes[app_config.theme][500] } : { backgroundColor: isDark ? '#111111' : '#ffffff', }}
              >
                <ThemedText
                  weight="medium"
                  className={` text-[15px] ${tempStatus === null ? "!text-[#4BC131]" : "text-black dark:text-white"}`}
                >
                  All
                </ThemedText>
              </Pressable>
              {statusOptions.filter(s => s !== "All").map((status) => (
                <Pressable
                  key={status}
                  onPress={() => setTempStatus(status)}
                  className={`px-5 py-4 rounded-2xl border w-full items-center ${tempStatus === status
                    ? ""
                    : "bg-transparent border-[#EFEFEF] dark:border-[#232323]"
                    }`}
                  style={tempStatus === status ? { backgroundColor: isDark ? "#0B2E02" : "#E8FFE4", borderColor: colorThemes[app_config.theme][500] } : { backgroundColor: isDark ? '#111111' : '#ffffff', }}
                >
                  <ThemedText
                    weight="medium"
                    className={`text-[15px] ${tempStatus === status ? "!text-primary-500" : "text-black dark:text-white"}`}
                  >
                    {status}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );

  const renderDateFilter = () => (
    <View className="flex-1">
      <ThemedText
        variant="secondary"
        className="text-[14px] font-medium mb-3"
      >
        Filter by date
      </ThemedText>

      {/* Toggle Mode */}
      <AnimatedTabs
        options={["Single Date", "Date Range"]}
        activeTab={dateMode === "single" ? "Single Date" : "Date Range"}
        onTabChange={(tab) => setDateMode(tab === "Single Date" ? "single" : "range")}
      />

      <Calendar
        // initialDate={selectedDate || new Date().toISOString().split('T')[0]}
        markedDates={markedDates}
        markingType={dateMode === "range" ? "period" : undefined}
        onDayPress={onDayPress}
        theme={{
          backgroundColor: isDark ? '#111111' : '#ffffff',
          calendarBackground: isDark ? '#111111' : '#ffffff',
          textSectionTitleColor: isDark ? '#b6c1cd' : '#b6c1cd',
          selectedDayBackgroundColor: colorThemes[app_config.theme][500],
          selectedDayTextColor: '#ffffff',
          todayTextColor: colorThemes[app_config.theme][500],
          dayTextColor: isDark ? '#ffffff' : '#2d4150',
          textDisabledColor: '#d9e1e8',
          dotColor: colorThemes[app_config.theme][500],
          selectedDotColor: '#ffffff',
          arrowColor: colorThemes[app_config.theme][500],
          monthTextColor: isDark ? '#ffffff' : 'black',
          indicatorColor: 'blue',
          textDayFontWeight: '300',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '300',
          textDayFontSize: 16,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 16
        }}
        enableSwipeMonths={true}
      />
    </View>
  );

  /* OLD RENDER DATE FILTER START COMMENT
  // All internal comments escaped to avoid nesting issues
  const renderDateFilter = () => (
    <View className="flex-1">
      <ThemedText
        variant="secondary"
        className="text-[14px] font-medium mb-3"
      >
        Filter by date
      </ThemedText>

      {/* Toggle Mode * /}
      <View className="flex-row bg-[#F2F2F2] dark:bg-[#111111] p-1 rounded-2xl mb-4">
        <Pressable
          onPress={() => setDateMode("single")}
          className={`flex-1 py-3 rounded-xl items-center ${dateMode === "single" ? "bg-[#111111] dark:bg-[#1E1E1E]" : ""}`}
        >
          <ThemedText className={`font-semibold ${dateMode === "single" ? "text-white" : "text-[#697586]"}`}>
            Single Date
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => setDateMode("range")}
          className={`flex-1 py-3 rounded-xl items-center ${dateMode === "range" ? "bg-[#111111] dark:bg-[#1E1E1E]" : ""}`}
        >
          <ThemedText className={`font-semibold ${dateMode === "range" ? "text-white" : "text-[#697586]"}`}>
            Date Range
          </ThemedText>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {dateMode === "single" ? (
          <View className="flex-col gap-4 mb-2">
            <ThemedText className="text-xs font-bold uppercase tracking-wider text-primary-500">Selected Date</ThemedText>
            {/* Year Dropdown * /}
            <View>
              <ThemedText className="mb-2 text-gray-500 text-xs font-medium uppercase tracking-wider">Select year</ThemedText>
              <Pressable
                onPress={() => setSelectionType("year")}
                className="flex-row justify-between items-center p-4 border border-[#EFEFEF] dark:border-[#232323] rounded-2xl bg-[#FAFAFA] dark:bg-[#111111]"
              >
                <ThemedText className="text-[15px] font-medium text-black dark:text-white">
                  {tempYear}
                </ThemedText>
                <ChevronDown size={20} color={isDark ? "#B5B5B5" : "#666"} />
              </Pressable>
            </View>

            <View className="flex-row gap-4">
              {/* Month Dropdown * /}
              <View className="flex-1">
                <ThemedText className="mb-2 text-gray-500 text-xs font-medium uppercase tracking-wider">Select month</ThemedText>
                <Pressable
                  onPress={() => setSelectionType("month")}
                  className="flex-row justify-between items-center p-4 border border-[#EFEFEF] dark:border-[#232323] rounded-2xl bg-[#FAFAFA] dark:bg-[#111111]"
                >
                  <ThemedText className="text-[15px] font-medium text-black dark:text-white">
                    {months[tempMonth - 1] || "Select month"}
                  </ThemedText>
                  <ChevronDown size={20} color={isDark ? "#B5B5B5" : "#666"} />
                </Pressable>
              </View>
              {/* Day Dropdown * /}
              <View className="flex-1">
                <ThemedText className="mb-2 text-gray-500 text-xs font-medium uppercase tracking-wider">Select day</ThemedText>
                <Pressable
                  onPress={() => setSelectionType("day")}
                  className="flex-row justify-between items-center p-4 border border-[#EFEFEF] dark:border-[#232323] rounded-2xl bg-[#FAFAFA] dark:bg-[#111111]"
                >
                  <ThemedText className="text-[15px] font-medium text-black dark:text-white">
                    {tempDay || "All"}
                  </ThemedText>
                  <ChevronDown size={20} color={isDark ? "#B5B5B5" : "#666"} />
                </Pressable>
              </View>
            </View>
          </View>
        ) : (
          <View className="gap-6">
            {/* FROM DATE * /}
            <View className="gap-2">
              <ThemedText className="text-xs font-bold uppercase tracking-wider text-primary-500">From Date</ThemedText>
              <View className="gap-2">
                <Pressable
                  onPress={() => { setTargetDate("from"); setSelectionType("year"); }}
                  className="flex-row justify-between items-center p-3 border border-[#EFEFEF] dark:border-[#232323] rounded-xl bg-[#FAFAFA] dark:bg-[#111111]"
                >
                  <ThemedText className="text-black dark:text-white">Year: {rangeFrom.year}</ThemedText>
                  <ChevronDown size={16} color={isDark ? "#B5B5B5" : "#666"} />
                </Pressable>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => { setTargetDate("from"); setSelectionType("month"); }}
                    className="flex-1 flex-row justify-between items-center p-3 border border-[#EFEFEF] dark:border-[#232323] rounded-xl bg-[#FAFAFA] dark:bg-[#111111]"
                  >
                    <ThemedText className="text-black dark:text-white">{months[rangeFrom.month - 1]}</ThemedText>
                    <ChevronDown size={16} color={isDark ? "#B5B5B5" : "#666"} />
                  </Pressable>
                  <Pressable
                    onPress={() => { setTargetDate("from"); setSelectionType("day"); }}
                    className="flex-1 flex-row justify-between items-center p-3 border border-[#EFEFEF] dark:border-[#232323] rounded-xl bg-[#FAFAFA] dark:bg-[#111111]"
                  >
                    <ThemedText className="text-black dark:text-white">{rangeFrom.day || "All"}</ThemedText>
                    <ChevronDown size={16} color={isDark ? "#B5B5B5" : "#666"} />
                  </Pressable>
                </View>
              </View>
            </View>

            {/* TO DATE * /}
            <View className="gap-2">
              <ThemedText className="text-xs font-bold uppercase tracking-wider text-primary-500">To Date</ThemedText>
              <View className="gap-2">
                <Pressable
                  onPress={() => { setTargetDate("to"); setSelectionType("year"); }}
                  className="flex-row justify-between items-center p-3 border border-[#EFEFEF] dark:border-[#232323] rounded-xl bg-[#FAFAFA] dark:bg-[#111111]"
                >
                  <ThemedText className="text-black dark:text-white">Year: {rangeTo.year}</ThemedText>
                  <ChevronDown size={16} color={isDark ? "#B5B5B5" : "#666"} />
                </Pressable>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => { setTargetDate("to"); setSelectionType("month"); }}
                    className="flex-1 flex-row justify-between items-center p-3 border border-[#EFEFEF] dark:border-[#232323] rounded-xl bg-[#FAFAFA] dark:bg-[#111111]"
                  >
                    <ThemedText className="text-black dark:text-white">{months[rangeTo.month - 1]}</ThemedText>
                    <ChevronDown size={16} color={isDark ? "#B5B5B5" : "#666"} />
                  </Pressable>
                  <Pressable
                    onPress={() => { setTargetDate("to"); setSelectionType("day"); }}
                    className="flex-1 flex-row justify-between items-center p-3 border border-[#EFEFEF] dark:border-[#232323] rounded-xl bg-[#FAFAFA] dark:bg-[#111111]"
                  >
                    <ThemedText className="text-black dark:text-white">{rangeTo.day || "All"}</ThemedText>
                    <ChevronDown size={16} color={isDark ? "#B5B5B5" : "#666"} />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
  */

  /* OLD HELPERS COMMENTED
  // Determine active date state for selection modal
  const activeMonth = dateMode === "single" ? tempMonth : (targetDate === "from" ? rangeFrom.month : rangeTo.month);
  const activeYear = dateMode === "single" ? tempYear : (targetDate === "from" ? rangeFrom.year : rangeTo.year);
  const activeDay = dateMode === "single" ? tempDay : (targetDate === "from" ? rangeFrom.day : rangeTo.day);

  // Calculate days based on active selection context
  const daysInActiveMonth = new Date(activeYear, activeMonth, 0).getDate();
  const activeDayOptions = Array.from({ length: daysInActiveMonth }, (_, i) => ({ label: String(i + 1), value: i + 1 }));
  */

  return (
    <CustomModal
      visible={visible}
      onClose={onClose}
      title={title}
      height={'auto'}
      showHandle={false}
      showHeader={true}
      closebutton={true}
    // containerStyle={{ backgroundColor: isDark ? "#ffffff" : "#FCFCFC" }}
    >
      <View className="flex-1 px-1">
        {filterType === "category" ? renderCategoryFilter() : renderDateFilter()}

        <Button
          onPress={handleApply}
          className="mt-6 rounded-[20px] py-4 bg-[#4BC131]"
        >
          <ThemedText className="text-white font-bold text-center text-lg">
            Apply
          </ThemedText>
        </Button>

        {/* OLD Global Selection Modal for Date Picker COMMENTED OUT
         <SelectionModal
          visible={selectionType !== "none"}
          onClose={() => setSelectionType("none")}
          title={selectionType === "month" ? "Select Month" : selectionType === "year" ? "Select Year" : "Select Day"}
          options={selectionType === "month" ? monthOptions : selectionType === "year" ? yearOptions : [{ label: "All Days", value: 0 }, ...activeDayOptions]}
          selectedValue={selectionType === "month" ? activeMonth : selectionType === "year" ? activeYear : activeDay || 0}
          onSelect={(val) => {
            if (dateMode === "single") {
              if (selectionType === "month") setTempMonth(val as number);
              else if (selectionType === "year") setTempYear(val as number);
              else setTempDay(val === 0 ? null : val as number);
            } else {
              // Range Mode
              if (targetDate === "from") {
                if (selectionType === "month") setRangeFrom(prev => ({ ...prev, month: val as number }));
                else if (selectionType === "year") setRangeFrom(prev => ({ ...prev, year: val as number }));
                else setRangeFrom(prev => ({ ...prev, day: val === 0 ? null : val as number }));
              } else {
                if (selectionType === "month") setRangeTo(prev => ({ ...prev, month: val as number }));
                else if (selectionType === "year") setRangeTo(prev => ({ ...prev, year: val as number }));
                else setRangeTo(prev => ({ ...prev, day: val === 0 ? null : val as number }));
              }
            }
          }}
          height="60%"
        /> 
        */}
      </View>
    </CustomModal>
  );
};

import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-fields";
import { icons } from "@/constant/icon";
import { useTheme } from "@/context/ThemeProvider";
import { ChevronRightIcon } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

interface QuickAmount {
  id: number;
  value: number;
  label: string;
}


export const AccountItem = ({ item, onPress }: any) => {
  const { isDark } = useTheme();

  return (
    <Pressable
      onPress={() => onPress && onPress(item)}
      className="flex-row items-center justify-between my-1 rounded-xl bg-light-150 dark:bg-dark-700 p-3"
    >
      <View className="flex-row items-center gap-2">
        {/* Icon */}
        <icons.Xbox width={32} height={32} />

        {/* Content */}
        <View className="flex-col gap-1">
          <ThemedText
            family="primary"
            variant="secondary"
            weight="regular"
            className="text-b3"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.name}
          </ThemedText>
          <ThemedText
            family="primary"
            variant="primary"
            weight="medium"
            className="text-b2 pt-2"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.details || item.accountType}
          </ThemedText>
        </View>
      </View>

      {/* Right Icon */}
      <View>
        <ChevronRightIcon
          width={24}
          height={24}
          color={isDark ? "white" : "black"}
        />
      </View>
    </Pressable>
  );
};

const Withdrawalinfo = () => {
  const { isDark } = useTheme();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [inputAmount, setInputAmount] = useState('');

  // Predefined amounts
  const quickAmounts = [
    { id: 1, value: 1000, label: '#1,000' },
    { id: 2, value: 2000, label: '#2,000' },
    { id: 3, value: 2500, label: '#2,500' },
    { id: 4, value: 3000, label: '#3,000' },
    { id: 5, value: 4000, label: '#4,000' },
    { id: 6, value: 5000, label: '#5,000' },
  ];

  const handleQuickAmountPress = (amount: QuickAmount) => {
    setSelectedAmount(amount.id);
    setInputAmount(amount.value.toString());
  };

  const renderQuickAmountButton = (amount: QuickAmount) => {
    const isSelected = selectedAmount === amount.id;
    
    return (
      <Pressable
        key={amount.id}
        onPress={() => handleQuickAmountPress(amount)}
        className={`px-3 py-2 rounded-lg ${
          isSelected 
            ? 'bg-light-150 dark:bg-dark-700' 
            : 'bg-light-100 dark:bg-dark-600'
        }`}
      >
        <ThemedText
          family="primary"
          variant={isSelected ? "primary" : "secondary"}
          weight="medium"
          className="text-b3"
        >
          {amount.label}
        </ThemedText>
      </Pressable>
    );
  };

  return (
    <ThemedView className="flex-1 pt-3  px-[24px]">
      
     <SafeAreaView    
        className="flex-1"
        edges={['bottom']}
        >
            <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText
          family="primary"
          variant="primary"
          weight="medium"
          className="text-b2 py-4"
        >
         {" You're transferring to"}
        </ThemedText>

        <AccountItem
          item={{ name: "Xbox", details: "Xbox Account" }}
          onPress={() => console.log("Account pressed")}
        />

        {/* Withdrawal Fee */}
        <View className="px-[12px] py-[6px] mb-5 mt-3 rounded-xl flex-row justify-between bg-[#D5D3E9] gap-4">
          <ThemedText
            family="primary"
            variant="primary"
            weight="medium"
            className="!text-primary-500 text-b2 py-4"
          >
            Withdrawal fees
          </ThemedText>
          <ThemedText
            family="primary"
            variant="primary"
            weight="medium"
            className="text-b2 py-4 !text-primary-500"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            #50
          </ThemedText>
        </View>

        {/* Amount Input */}
        <Input
          label="Enter Amount"
          placeholder="Enter amount to withdraw"
          value={inputAmount}
          onChangeText={(text) => {
            setInputAmount(text);
            setSelectedAmount(null); // Clear selection when typing manually
          }}
          keyboardType="numeric"
        />

        <ThemedText
          family="primary"
          variant="primary"
          weight="medium"
          className="text-b2 pt-4"
        >
          Avl.Balance: #1,000
        </ThemedText>

        {/* Quick Amount Selection */}
       

        {/* First Row */}
        <View className="flex-row items-center flex-wrap gap-2 justify-between my-4">
          {quickAmounts.slice(0, 6).map(renderQuickAmountButton)}
        </View>

       
      </ScrollView>
      <Button
        className="mb-4"
        onPress={() => console.log("Withdraw pressed")}
        variant="primary"
      >    
        Withdraw
      </Button>
        </SafeAreaView>
    </ThemedView>
  );
};

export default Withdrawalinfo;
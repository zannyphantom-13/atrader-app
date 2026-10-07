import { View } from "react-native";

// Skeleton component
export const GiftCardSkeleton = () => {
  return (
    <View className="flex-row items-center border-b-2 pb-5 pt-5 mt-2 rounded-xl px-3 border-light-150 dark:border-dark-700 justify-between">
      <View className="flex-row items-center gap-2">
        <View className="bg-gray-300 dark:bg-gray-600 w-8 h-8 rounded-full animate-pulse" />
        <View className="bg-gray-300 dark:bg-gray-600 h-4 w-24 rounded animate-pulse" />
      </View>
    </View>
  );
};

// Skeleton list component
export const SkeletonList = ({ count = 5 }: { count?: number }) => {
  return (
    <View>
      <View className="bg-gray-300 dark:bg-gray-600 h-5 w-20 rounded animate-pulse mt-4 mb-2" />
      {Array.from({ length: count }).map((_, index) => (
        <GiftCardSkeleton key={index} />
      ))}
    </View>
  );
};

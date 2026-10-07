import { useTheme } from "@/context/ThemeProvider";
import { ArrowLeftIcon } from "lucide-react-native";
import { Platform, Pressable } from "react-native";
import { Stack, useRouter } from "expo-router";

export const ModalStack = () => {
  const router = useRouter();
  const { isDark } = useTheme();

  const handleLeftPress = () => {
    return (
      <Pressable
        onPress={() => router.back()}
        style={{
          marginLeft: Platform.OS === "ios" ? 0 : -8,
          padding: 8,
        }}
      >
        <ArrowLeftIcon size={24} color={isDark ? "#ffffff" : "#000000"} />
      </Pressable>
    );
  };

  const handleClosePress = () => {
    return (
      <Pressable
        onPress={() => router.back()}
        style={{
          marginRight: Platform.OS === "ios" ? 0 : -8,
          padding: 8,
        }}
      >
        <ArrowLeftIcon size={24} color={isDark ? "#ffffff" : "#000000"} />
      </Pressable>
    );
  };

  return (
    <Stack
      screenOptions={{
        presentation: "modal",
        headerShown: false,
        animation: "slide_from_bottom",
        animationDuration: Platform.OS === "ios" ? 400 : 300,
        gestureEnabled: true,
        gestureDirection: "vertical",

        // Header styling
        headerStyle: {
          backgroundColor: isDark ? "#060606" : "#ffffff",
          // elevation: 0,
          // shadowOpacity: 0,
          // borderBottomWidth: 0,
        },
        headerTintColor: isDark ? "#ffffff" : "#000000",
        headerTitleAlign: "center",
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: "600",
          fontFamily: "MonaSans-Bold",
        },
        headerShadowVisible: false,

        // Content styling - this affects the modal container
        contentStyle: {
          backgroundColor: isDark ? "#060606" : "#ffffff",
          // Remove default padding if you want full control
          paddingTop: 0,
          paddingHorizontal: 0,
        },

        // Modal-specific styling
        statusBarStyle: isDark ? "light" : "dark",
        statusBarBackgroundColor: isDark ? "#060606" : "#ffffff",

        // Custom backdrop (only works with certain presentations)
        // ...(Platform.OS === 'ios' && {
        //   sheetAllowedDetents: 'all', // iOS sheet detents
        //   sheetLargestUndimmedDetent: 'large',
        //   sheetGrabberVisible: false,
        // }),
      }}
    >
      {/* Deposit Funds Modal */}
    </Stack>
  );
};
export default ModalStack;

// Example usage in your components:

// From any screen, navigate to modals like this:

// Simple modal navigation:
// router.push('/(modal)/transaction-details');

// With parameters:
// router.push({
//   pathname: '/(modal)/universal',
//   params: {
//     type: 'confirmation',
//     title: 'Delete Transaction',
//     message: 'Are you sure?',
//     data: JSON.stringify({ transactionId: '123' })
//   }
// });

// For exchange app specific modals:
// router.push('/(modal)/deposit');
// router.push('/(modal)/withdraw');
// router.push('/(modal)/trade');
// router.push('/(modal)/pin-entry');

import { ThemedText } from "@/components/theme/themeText";
import { ScreenType } from "@/components/ui/screenComponents";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, Pressable, Text, TouchableOpacity, View } from "react-native";
import { images } from "./image";


type DynamicRouteConfig = {
  pattern: string;
  params?: Record<string, string>;
};

export type RouteOptions = {
  title?: string;
  headerShown?: boolean;
  headerBackTitle?: string;
  headerBackTitleVisible?: boolean;
  headerShadowVisible?: boolean;
  headerTransparent?: boolean;
  animation?: 'default' | 'fade' | 'slide_from_bottom' | 'flip' | 'none';
  animationDuration?: number;
  presentation?: 'card' | 'modal' | 'transparentModal' | 'containedModal';
  gestureEnabled?: boolean;
  fullScreenGestureEnabled?: boolean;
  headerLargeTitle?: boolean;
  headerBlurEffect?: 'light' | 'dark' | 'regular' | 'prominent';
  statusBarColor?: string;
  statusBarTranslucent?: boolean;
  navigationBarColor?: string;
  navigationBarHidden?: boolean;
  headerStyle?: {
    backgroundColor: string;
    elevation: number; // Android shadow
    shadowOpacity: number; // iOS shadow
  };
  headerTitleStyle?: {
    fontFamily: string;
    fontWeight: 'normal' | 'bold' | string; // Allow custom weights
    color: string;
  };
  headerTintColor?: string; // Back button/icon color
  headerBackImage?: () => React.ReactNode; // Custom back button
  headerRight?: () => React.ReactNode;
  headerLeft?: () => React.ReactNode;
  headerTitle?: (props: { children: string }) => React.ReactNode;
};

type RouteConfig = {
  name: string;
  options?: any;
  dynamic?: DynamicRouteConfig;
  initialParams?: Record<string, unknown>;
  getId?: ({ params }: { params: Record<string, unknown> }) => string;
  screenType?: ScreenType; // New: For animation context
};








export const SCREENS = {

  //  ONBOARDING
  ONBOARDING: {
    name: "onboarding",
    options: {
      headerShown: false,
      // animation: Platform.OS === 'ios' ? 'slide_from_left' : 'slide_from_right',
      // animationDuration: Platform.OS === 'ios' ? 350 : 300,
      // gestureEnabled: true,
      // // Ensure smooth transitions
      // animationTypeForReplace: 'push',
    }

  },
  // AUTH
  AUTH: {
    name: "(auth)",
    options: { headerShown: false }
  },

  // TABS 
  TABS: {
    name: "(tabs)",
    options: { headerShown: false }
  },


} satisfies Record<string, RouteConfig>;





export const MAIN_SCREENS = {
  HOME: {
    name: "home" as const,
    options: () => {

      return {
        // HEADER OPTIONS
        headerShown: true,
        title: "Home",
        headerTitle: "", // Alternative to title
        headerTitleAlign: "center", // "left" | "center"
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: "600",
          color: "#000",
        },
        // headerStyle: {
        //   // elevation: 4, // Android shadow
        //   // shadowColor: "#000", // iOS shadow
        //   // shadowOffset: { width: 0, height: 2 },
        //   shadowOpacity: 0,
        //   // shadowRadius: 4,
        //   // borderBottomWidth: 1,
        //   // borderBottomColor: "#e0e0e0",
        //   height: 120, // Custom height
        // },
        headerTintColor: "#604AE6", // Back button and icon colors
        headerShadowVisible: true, // Show/hide header shadow
        headerTransparent: false, // Make header transparent
        headerBlurEffect: "regular", // iOS blur: "extraLight" | "light" | "dark" | "regular" | "prominent" | "systemUltraThinMaterial" etc.

        // HEADER BUTTONS
        headerLeft: () => (
          <View style={{ marginLeft: 16 }}
            className="flex-row items-center gap-3 pt-20"
          >
            <Image
              source={images.profileImg}
              className="w-10 h-10 rounded-full"
              style={{ width: 40, height: 40 }}
            />
            <View >
              <ThemedText
                family="primary"
                weight="bold"
                className="text-base "
              >AT-Tex Exchange 👋</ThemedText>
              <ThemedText
                family="secondary"
                weight="medium"
                className="text-b2 pt-2 text-text-primary-light dark:text-text-secondary-dark"
              >Good morning</ThemedText>
            </View>

          </View>
        ),
        // SEARCH BAR (iOS)
        headerSearchBarOptions: {
          placeholder: "Search...",
          hideWhenScrolling: true,
          autoCapitalize: "none",
        },

        // LARGE TITLE (iOS style)
        headerLargeTitle: false,
        headerLargeTitleStyle: {
          fontSize: 34,
          fontWeight: "bold",
        },
        headerLargeTitleShadowVisible: true,

        // TAB BAR OPTIONS
        tabBarLabel: "Home",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
        tabBarActiveTintColor: "#604AE6",
        tabBarInactiveTintColor: "#666",
        tabBarBadge: undefined, // Number or string for badge
        tabBarBadgeStyle: {
          backgroundColor: "red",
          color: "white",
        },
        tabBarButton: (props: any) => <TouchableOpacity {...props} />, // Custom tab button
        tabBarAccessibilityLabel: "Home Tab",
        tabBarTestID: "home-tab",

        // SCREEN BEHAVIOR
        freezeOnBlur: false, // Keep screen mounted when not focused
        lazy: true, // Load screen lazily
        unmountOnBlur: false, // Unmount when navigating away

        // GESTURES & ANIMATIONS
        gestureEnabled: true, // Enable swipe back gesture
        animationEnabled: true,
        animationTypeForReplace: "push", // "push" | "pop"

        // STATUS BAR
        statusBarStyle: "auto", // "auto" | "inverted" | "light" | "dark"
        statusBarBackgroundColor: "#fff", // Android
        statusBarTranslucent: false, // Android
        statusBarHidden: false,

        // PRESENTATION (for modals)
        // presentation: "card", // "card" | "modal" | "transparentModal" | "containedModal" | "containedTransparentModal" | "fullScreenModal" | "formSheet"
        // presentationBackgroundColor: "#fff",

        // ORIENTATION
        // orientation: "default", // "default" | "all" | "portrait" | "portrait_up" | "portrait_down" | "landscape" | "landscape_left" | "landscape_right"

        // SAFE AREA
        contentStyle: {
          backgroundColor: "#f8f9fa",
        },
      }
    }
  },

  CALCULATOR: {
    name: "calculator" as const,
    options: {
      headerShown: true,
      title: "Calculator",
      tabBarLabel: "Calculator", // Fixed typo

      // Custom header when headerShown: true
      header: ({ navigation, route, options }: any) => (
        <View style={{
          height: 100,
          backgroundColor: "#604AE6",
          justifyContent: "flex-end",
          paddingBottom: 10,
          paddingHorizontal: 16
        }}>
          <Text style={{ color: "white", fontSize: 18, fontWeight: "600" }}>
            Calculator
          </Text>
        </View>
      ),

      // Disable tab bar for this screen
      tabBarStyle: { display: "none" },

      // Full screen content
      contentStyle: {
        backgroundColor: "#000",
      },
    }
  },

  RANK: {
    name: "rank" as const,
    options: {
      headerShown: true,
      title: "Rankings",

      // Custom styled header
      headerStyle: {
        backgroundColor: "#604AE6",
        height: 120,
      },
      headerTitleStyle: {
        color: "white",
        fontSize: 20,
        fontWeight: "bold",
      },
      headerTintColor: "white",

      // Add header background image/gradient
      headerBackground: () => (
        <></>
        // <LinearGradient
        //   colors={["#604AE6", "#8B7ED8"]}
        //   style={{ flex: 1 }}
        //   start={{ x: 0, y: 0 }}
        //   end={{ x: 1, y: 1 }}
        // />
      ),

      tabBarLabel: "Rank",
      tabBarBadge: "New", // Show badge

      // Custom animation
      cardStyleInterpolator: ({ current, layouts }: any) => ({
        cardStyle: {
          transform: [
            {
              translateX: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [layouts.screen.width, 0],
              }),
            },
          ],
        },
      }),
    }
  },

  SETTINGS: {
    name: "settings" as const,
    options: {
      headerShown: true,
      title: "Settings",

      // Modal-style presentation
      presentation: "modal",
      headerLeft: () => (
        <TouchableOpacity>
          <Text style={{ color: "#604AE6", fontSize: 16 }}>Cancel</Text>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity>
          <Text style={{ color: "#604AE6", fontSize: 16, fontWeight: "600" }}>Done</Text>
        </TouchableOpacity>
      ),

      tabBarLabel: "Settings",

      // Hide tab bar when this screen is focused
      tabBarStyle: {
        display: "none",
      },

      // iOS specific large title
      headerLargeTitle: true,
      headerLargeTitleStyle: {
        fontSize: 34,
        fontWeight: "bold",
      },
    }
  },
} as const;

// Additional navigation options you can use:














//

export const ADDITIONAL_OPTIONS = {
  // For stack navigators
  stackOptions: {
    headerMode: "screen", // "float" | "screen" | "none"
    headerTransitionPreset: "uikit", // "fade" | "slide" | "uikit"
    cardStyleInterpolator: "forHorizontalIOS", // Various transition styles
    transitionSpec: {
      open: {
        animation: "timing",
        config: {
          duration: 300,
        },
      },
      close: {
        animation: "timing",
        config: {
          duration: 300,
        },
      },
    },
  },

  // For tab navigators  
  tabOptions: {
    tabBarHideOnKeyboard: true,
    tabBarVisibilityAnimationConfig: {
      show: {
        animation: "timing",
        config: {
          duration: 300,
        },
      },
      hide: {
        animation: "timing",
        config: {
          duration: 300,
        },
      },
    },
  },
};







export type AppRoutes = keyof typeof SCREENS;






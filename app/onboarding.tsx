import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { Button } from "@/components/ui/button";
import { img } from "@/constant/image";
import { useTheme } from "@/context/ThemeProvider";
import { setOnboardingCompleted } from "@/redux/auth/session";
import { useAppDispatch } from "@/redux/store";
import { paths } from "@/utils/paths";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  Text,
  useWindowDimensions,
  View,
  ViewToken
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";


const onboardingData = [
  {
    id: "1",
    image: require("../assets/v1/on23.png"),
    image2: require("../assets/v1/on1-dark.png"),
    title: "Buy & Sell Your Gift Card Fast & Secure",
    description:
      "Trade gift cards quickly and securely, get instant cash at best rate.",
  },
  {
    id: "2",
    image: require("../assets/v1/on2.png"),
    image2: require("../assets/v1/on2.png"),
    title: "Crypto Trading Made simple",
    description:
      "Trade popular cryptocurrencies with real-time rates and secure transactions.",
  },
  {
    id: "3",
    image: require("../assets/v1/on333.png"),
    image2: require("../assets/v1/on333b.png"),
    title: "Pay Your Bills with Ease",
    description:
      "All your bills settled. Easy, fast, and secure payments, every time.",
  },
];
const Onboarding = () => {
  const { width, height } = useWindowDimensions();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<any> | null>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const { isDark } = useTheme();
  const autoScrollInterval = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const TheLogo = isDark ? img.logoDarkPng : img.logolightPng



  useEffect(() => {
    console.log("Analytics: Sending ONBOARDING_SESSION_START event to server...");
    fetch("https://mover.myatraderapp.com/api/telemetry/onboarding-start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timestamp: Date.now(), deviceId: "guest" }),
    }).catch(() => { });
  }, []);

  // Auto-scroll effect
  useEffect(() => {
    startAutoScroll();

    return () => {
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
      }
    };
  }, [currentIndex]);

  const startAutoScroll = () => {
    // Clear existing interval
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
    }

    // Start new interval - scroll every 3 seconds
    autoScrollInterval.current = setInterval(() => {
      if (currentIndex < onboardingData.length - 1) {
        const nextIndex = currentIndex + 1;
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
      } else {
        // Loop back to first slide
        flatListRef.current?.scrollToIndex({
          index: 0,
          animated: true,
        });
      }
    }, 3000); // Change slide every 3 seconds (adjust as needed)
  };

  const stopAutoScroll = () => {
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
      autoScrollInterval.current = null;
    }
  };

  const handleNext = async () => {
    stopAutoScroll(); // Stop auto-scroll when user manually interacts

    // if (currentIndex < onboardingData.length - 1) {
    //   flatListRef.current?.scrollToIndex({
    //     index: currentIndex + 1,
    //     animated: true,
    //   });
    // } else {
    dispatch(setOnboardingCompleted(true));
    // await SecureStoreAdapter.setOnboardingCompleted(true);
    router.push(paths.auth.login);
    // }
  };

  const handleSkip = async () => {
    // stopAutoScroll();
    dispatch(setOnboardingCompleted(true));
    // await SecureStoreAdapter.setOnboardingCompleted(true);
    router.push(paths.auth.register);
    router.replace(paths.auth.register);
  };

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setCurrentIndex(viewableItems[0].index || 0);
      }
    },
  ).current;

  const renderDot = (index: number) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const dotWidth = scrollX.interpolate({
      inputRange,
      outputRange: [8, 24, 8],
      extrapolate: "clamp",
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.3, 1, 0.3],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        key={index}
        style={{
          width: dotWidth,
          opacity,
        }}
        className="h-2 rounded-full mx-1 bg-primary-500"
      />
    );
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: (typeof onboardingData)[0];
    index: number;
  }) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    // Image animations
    const imageScale = scrollX.interpolate({
      inputRange,
      outputRange: [0.7, 1, 0.7],
      extrapolate: "clamp",
    });

    const imageOpacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 1, 0.3],
      extrapolate: "clamp",
    });

    const imageTranslateY = scrollX.interpolate({
      inputRange,
      outputRange: [50, 0, 50],
      extrapolate: "clamp",
    });

    // Title animations - sluggish effect, comes from bottom
    const titleTranslateY = scrollX.interpolate({
      inputRange,
      outputRange: [80, 0, -80],
      extrapolate: "clamp",
    });

    const titleOpacity = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
      extrapolate: "clamp",
    });

    // Description animations - more sluggish, follows title
    const descTranslateY = scrollX.interpolate({
      inputRange,
      outputRange: [100, 0, -100],
      extrapolate: "clamp",
    });

    const descOpacity = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
      extrapolate: "clamp",
    });

    // Dynamic sizing logic
    const smallerScreens = width < 390;
    // Calculate available vertical space (approximate)
    // Total Height - (Header ~100) - (Footer ~180) - (Text Content ~100) - Margins
    // To be safe, let's limit image to 40% of screen height
    const maxImageHeight = height * 0.40;
    const computedWidth = smallerScreens ? width * 0.6 : width * 0.85;
    const imageSize = Math.min(computedWidth, maxImageHeight);

    return (
      <View
        style={{
          width,
          paddingTop: insets.top + 55, // Space for logo
        }}
        className="flex-1  justify-center "
      >
        {/* Image with proper spacing from top */}
        {index === onboardingData.length - 1 && (
          <Image
            source={
              isDark
                ? require("@/assets/v1/on3bgd.png")
                : require("@/assets/v1/on3bg.png")
            }
            style={{
              position: "absolute",
              width: "100%",
              height: "90%",
              top: -50,
            }}
            resizeMode="cover"
          />
        )}
        <Animated.View
          style={{
            transform: [{ scale: imageScale }, { translateY: imageTranslateY }],
            opacity: imageOpacity,
            width: imageSize,
            height: imageSize,
            // aspectRatio: 1, // Removed to use explicit dimensions
          }}
          className={`mb-6 overflow-hidden flex-row items-center justify-center mx-auto`}
        >
          <Image
            source={isDark ? item.image2 : item.image}
            style={{
              width: "100%",
              height: "100%",
            }}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Pagination dots */}
        <View className="flex-row justify-center mb-6 items-center">
          {onboardingData.map((_, index) => renderDot(index))}
        </View>

        {/* Title - sluggish animation from bottom */}
        <Animated.View
          style={{
            transform: [{ translateY: titleTranslateY }],
            opacity: titleOpacity,
          }}
          className="mb-2 px-4"
        >
          <ThemedText
            weight="semibold"
            className={`text-center  ${smallerScreens ? "text-lg" : "text-3xl"} font-bold px-4`}
            family="primary"
          >
            {item.title}
          </ThemedText>
        </Animated.View>

        {/* Description - more sluggish, follows title */}
        <Animated.View
          style={{
            transform: [{ translateY: descTranslateY }],
            opacity: descOpacity,
          }}
        >
          <ThemedText
            weight="regular"
            className="text-center text-[16px] leading-5 px-4 opacity-60"
          >
            {item.description}
          </ThemedText>
        </Animated.View>
      </View>
    );
  };

  return (
    <ThemedView className={`flex-1 `}>
      {/* Header with logo - fixed at top */}
      <View
        style={{
          paddingTop: insets.top + 20,
          backgroundColor: "transparent",
          zIndex: 0,
        }}
        className={`flex-row justify-center items-center px-5 pb-4 absolute left-0 right-0 z-0 bg-transparent top-0`}
      >
        <Image source={TheLogo} style={{ width: 142, height: 40 }} resizeMode="contain" />
      </View>

      {/* Main content area - centered with space for header */}
      <View
        className="flex-1 justify-center bg-transparent"
        style={
          {
            // paddingTop: insets.top + 80, // Space for logo
          }
        }
      >
        <FlatList
          ref={flatListRef}
          data={onboardingData}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false },
          )}
          scrollEventThrottle={16}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          keyExtractor={(item, i) => item.id}
          decelerationRate="fast"
          onTouchStart={stopAutoScroll} // Stop auto-scroll when user touches
          onMomentumScrollEnd={startAutoScroll} // Resume after user scroll ends
        />
      </View>

      {/* Footer with buttons */}
      <View style={{ paddingBottom: insets.bottom + 20 }} className="px-5">
        <Button
          onPress={handleNext}
          fullWidth
          size="lg"
          variant="outline"
          className="w-full mb-2"
        >
          <Text className="text-primary-500">Login</Text>
        </Button>

        <Button onPress={handleSkip} size="lg" variant="primary" fullWidth>
          Sign up
        </Button>

        {/* Terms and Privacy */}
        <ThemedText variant="secondary" className="text-center px-8 pt-3">
          Joining our app means you agree with our{" "}
          <ThemedText variant="secondary" family="primary" className="text-b3">
            <ThemedText
              variant="accent"
              family="primary"
              weight="regular"
              className="text-primary-500 text-b3 underline"
            >
              Terms of Service
            </ThemedText>{" "}
            and{" "}
          </ThemedText>
          <ThemedText
            variant="accent"
            family="primary"
            weight="regular"
            className="text-primary-500 text-b3 underline"
          >
            Privacy Policy
          </ThemedText>
        </ThemedText>
      </View>
    </ThemedView>
  );
};

export default Onboarding;

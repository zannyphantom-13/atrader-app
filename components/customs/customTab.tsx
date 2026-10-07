import { ThemedText } from "@/components/theme/themeText";
import { images, img } from "@/constant/image";
import { useTheme } from "@/context/ThemeProvider";
import app_colors from "@/styles/color";
import { colorThemes } from "@/styles/theme";
import { typography } from "@/styles/typography";
import { app_config } from "@/utils/config";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Dimensions,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const { width: screenWidth } = Dimensions.get("window");

export const getTabIcons = (tabName: string) => {
  switch (tabName) {
    case "index":
      return {
        active: img.homeActive,
        inactive: img.homeInactive,
      };
    case "calculator":
      return {
        active: img.calcActive,
        inactive: img.calc,
      };
    case "wallet":
      return {
        active: img.walletv1Active,
        inactive: img.walletv1,
      };
    case "message":
      return {
        active: img.chatActive,
        inactive: img.chat,
      };
    case "setting":
      return {
        active: img.settingActive,
        inactive: img.setting,
      };
    default:
      return {
        active: img.homeActive,
        inactive: img.homeInactive,
      };
  }
};

export function TabIcon({ focused, tabName }: any) {
  const icons = getTabIcons(tabName);
  const IconToRender = focused ? icons.active : icons.inactive;
  return <IconToRender width={24} height={24} />;
}

export const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const { isDark } = useTheme();
  const backgroundColor = isDark ? "#060606" : "#ffffff";
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom;

  // CUTOUT ADJUSTMENTS - Modify these values
  const cutoutRadius = 38; // ← Change this to make cutout bigger/smaller
  const cutoutDepth = 18; // ← Change this to make cutout deeper/shallower (how far it dips down)
  const cutoutBlendWidth = 40; // ← Change this to make the curve transition wider/narrower
  const cutoutCurveHeight = 32; // ← NEW: Controls how deep the circular curve goes down

  // TAB BAR ADJUSTMENTS
  const tabBarHeight = 85; // ← Change overall tab bar height
  const tabBarTopPadding = 15; // ← Change where content starts from top

  // GRADIENT EXTENSION ABOVE TAB
  const gradientExtensionHeight = 10; // ← Change how much gradient extends above tab bar

  return (
    <SafeAreaView
      // style={[styles.tabBarWrapper,]}
      style={{
        backgroundColor,
        // paddingBottom: tabBarTopPadding,
      }}
      edges={["bottom"]}
    >
      <View
        style={[
          styles.tabBarWrapper,
          {
            height:
              Platform.OS === "android"
                ? tabBarHeight + bottomInset
                : tabBarHeight,
            bottom:
              Platform.OS === "android"
                ? bottomInset
                  ? -10
                  : 0
                : bottomInset
                  ? 0
                  : 0,
          },
        ]}
      >
        {/* Background blocker to prevent content showing through */}
        {/* <View style={[
          styles.backgroundBlocker, 
          { 
            // backgroundColor: isDark ? '#000000' : '#f8f9fa',
            // top: -gradientExtensionHeight, // ← Uses gradient extension height
            // height: 60, // ← Total height of background blocker
          }
        ]} /> */}

        {/*  GRADIENT CONTAINER - Full faint blur background */}
        <View
          style={[
            styles.gradientContainer,
            {
              top: -gradientExtensionHeight, // ← Extends gradient above tab bar
              height: tabBarHeight + gradientExtensionHeight, // ← Total gradient height
            },
          ]}
        >
          <LinearGradient
            colors={
              isDark
                ? ["rgba(96, 74, 230, 0.01)", backgroundColor]
                : ["rgba(96, 74, 230, 0.02)", backgroundColor]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 10 }}
            style={StyleSheet.absoluteFillObject}
          />

          {/* SVG for curved cutout blend - no mask needed */}
          <Svg
            height={tabBarHeight}
            width={screenWidth}
            style={StyleSheet.absoluteFillObject}
            viewBox={`0 0 ${screenWidth} ${tabBarHeight}`}
          >
            {/* MAIN TAB SHAPE WITH ADJUSTABLE CURVED CUTOUT */}
            <Path
              d={`
                M 0 ${tabBarTopPadding}
                Q 0 15 15 15
                L ${screenWidth / 2 - cutoutRadius - cutoutBlendWidth} 15
                Q ${screenWidth / 2 - cutoutRadius - cutoutBlendWidth / 2} 15 ${screenWidth / 2 - cutoutRadius - 5} ${15 + cutoutDepth / 3}
                Q ${screenWidth / 2 - cutoutRadius / 2} ${15 + cutoutCurveHeight} ${screenWidth / 2} ${15 + cutoutCurveHeight}
                Q ${screenWidth / 2 + cutoutRadius / 2} ${15 + cutoutCurveHeight} ${screenWidth / 2 + cutoutRadius + 5} ${15 + cutoutDepth / 3}
                Q ${screenWidth / 2 + cutoutRadius + cutoutBlendWidth / 2} 15 ${screenWidth / 2 + cutoutRadius + cutoutBlendWidth} 15
                L ${screenWidth - 15} 15
                Q ${screenWidth} 15 ${screenWidth} ${tabBarTopPadding}
                L ${screenWidth} ${tabBarHeight}
                L 0 ${tabBarHeight}
                Z
              `}
              fill={backgroundColor}
            />

            {/* CURVED BORDER  */}
            <Path
              d={`
                M 0 ${tabBarTopPadding}
                Q 0 15 15 15
                L ${screenWidth / 2 - cutoutRadius - cutoutBlendWidth} 15
                Q ${screenWidth / 2 - cutoutRadius - cutoutBlendWidth / 2} 15 ${screenWidth / 2 - cutoutRadius - 5} ${15 + cutoutDepth / 30}
                Q ${screenWidth / 2 - cutoutRadius / 2} ${15 + cutoutCurveHeight} ${screenWidth / 2} ${15 + cutoutCurveHeight}
                Q ${screenWidth / 2 + cutoutRadius / 2} ${15 + cutoutCurveHeight} ${screenWidth / 2 + cutoutRadius + 5} ${15 + cutoutDepth / 30}
                Q ${screenWidth / 2 + cutoutRadius + cutoutBlendWidth / 2} 15 ${screenWidth / 2 + cutoutRadius + cutoutBlendWidth} 15
                L ${screenWidth - 15} 15
                Q ${screenWidth} 15 ${screenWidth} ${tabBarTopPadding}
              `}
              fill="none"
              stroke={
                isDark ? "rgba(96, 74, 230, 0.1)" : "rgba(96, 74, 230, 0.1)"
              }
              strokeWidth={1.5}
            />
          </Svg>
        </View>

        {/* Tab Items */}
        <View
          style={[
            styles.tabBarContent,
            {
              paddingBottom:
                Platform.OS === "android"
                  ? insets.bottom
                    ? insets.bottom
                    : 15
                  : 15,
            },
          ]}
        >
          {/* Home Tab */}
          <TouchableOpacity
            activeOpacity={1}
            style={styles.tabItem}
            onPress={() => navigation.navigate("home")}
          >
            <TabIcon focused={state.index === 0} tabName="home" />
            <ThemedText
              style={[
                styles.tabLabel,
                {
                  color:
                    state.index === 0
                      ? app_colors.blue[500]
                      : isDark
                        ? "#b0b0b0"
                        : "#7d7d7d",
                },
              ]}
            >
              Home
            </ThemedText>
          </TouchableOpacity>

          {/* Calculator Tab */}
          <TouchableOpacity
            activeOpacity={1}
            style={styles.tabItem}
            onPress={() => navigation.navigate("calculator")}
          >
            <TabIcon focused={state.index === 1} tabName="calculator" />
            <ThemedText
              style={[
                styles.tabLabel,
                {
                  color:
                    state.index === 1
                      ? app_colors.blue[500]
                      : isDark
                        ? "#b0b0b0"
                        : "#7d7d7d",
                },
              ]}
            >
              Calculator
            </ThemedText>
          </TouchableOpacity>

          {/* Center Spacer for Wallet Button */}
          <View style={styles.centerSpacer} />

          {/* Rank Tab */}
          <TouchableOpacity
            activeOpacity={1}
            style={styles.tabItem}
            onPress={() => navigation.navigate("rank")}
          >
            <TabIcon focused={state.index === 2} tabName="rank" />
            <ThemedText
              style={[
                styles.tabLabel,
                {
                  color:
                    state.index === 2
                      ? app_colors.blue[500]
                      : isDark
                        ? "#b0b0b0"
                        : "#7d7d7d",
                },
              ]}
            >
              Rank
            </ThemedText>
          </TouchableOpacity>

          {/* Settings Tab */}
          <TouchableOpacity
            style={styles.tabItem}
            activeOpacity={1}
            onPress={() => navigation.navigate("settings")}
          >
            <TabIcon focused={state.index === 3} tabName="settings" />
            <ThemedText
              style={[
                styles.tabLabel,
                {
                  color:
                    state.index === 3
                      ? app_colors.blue[500]
                      : isDark
                        ? "#b0b0b0"
                        : "#7d7d7d",
                },
              ]}
            >
              Settings
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* FLOATING WALLET BUTTON   */}
        <TouchableOpacity
          style={[
            styles.walletButton,
            {
              backgroundColor: app_colors.blue[500],
              top: -35,
              // top: -(cutoutDepth + 25), // ← Button position adjusts with cutout depth
            },
          ]}
          onPress={() => navigation.navigate("wallet")}
          activeOpacity={1}
        >
          <View style={styles.walletButtonShadow} />
          <images.wallet style={styles.walletIcon} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 85,
    zIndex: 1000,
    borderTopRightRadius: 30,
    borderTopLeftRadius: 30,
  },
  backgroundBlocker: {
    position: "absolute",
    // top: 0, // Extends above to block scrolling content
    left: 0,
    right: 0,
    bottom: 0, // Extends below for safe area
    zIndex: 2,
  },
  gradientContainer: {
    flex: 1,
    zIndex: 2,
  },
  tabBarContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingBottom: 15,
    paddingTop: 6,
    zIndex: 3,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  centerSpacer: {
    flex: 1,
  },
  tabLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    textTransform: "capitalize",
    fontFamily: typography.fontFamily.primary,
    marginTop: 7,
  },
  walletButton: {
    position: "absolute",
    top: -30,
    left: "50%",
    marginLeft: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    elevation: 10,
    shadowColor: colorThemes[app_config.theme][500], // Shadow color for dark mode
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  walletButtonShadow: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 35,
    // backgroundColor: 'rgba(96, 74, 230, 0.2)',
    top: -1,
    zIndex: -1,
  },
  walletIcon: {
    width: 24,
    height: 24,
    tintColor: "#ffffff",
  },
});

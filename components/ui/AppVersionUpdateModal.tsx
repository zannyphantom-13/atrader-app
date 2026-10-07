import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeProvider";
import {
  AppUpdateCheckResult,
  checkAppVersionUpdate,
} from "@/services/version-check";
import { ArrowUpCircle } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Linking,
  Modal,
  Platform,
  View,
} from "react-native";

/**
 * DEV_PREVIEW_UPDATE:
 * - 'force': Previews the blocking full-screen force update modal
 * - 'optional': Previews the dismissible update modal with "Later" button
 * - null: Uses real live backend API (default in production)
 */
export const DEV_PREVIEW_UPDATE: "force" | "optional" | null = null;

export const AppVersionUpdateModal: React.FC = () => {
  const { isDark } = useTheme();
  const [updateInfo, setUpdateInfo] = useState<AppUpdateCheckResult | null>(() => {
    if (DEV_PREVIEW_UPDATE) {
      return {
        updateAvailable: true,
        forceUpdate: DEV_PREVIEW_UPDATE === "optional",
        currentVersion: "1.0.2",
        latestVersion: DEV_PREVIEW_UPDATE === "optional" ? "2.0.0" : "1.1.0",
        updateUrl: "https://apps.apple.com/app/id6760278690",
        message:
          DEV_PREVIEW_UPDATE === "optional"
            ? "A critical update is required to continue using Atrader. Please update to enjoy the latest security and speed improvements."
            : "A new version of Atrader is available with new features and bug fixes!",
      };
    }
    return null;
  });
  const [visible, setVisible] = useState<boolean>(Boolean(DEV_PREVIEW_UPDATE));

  useEffect(() => {
    if (DEV_PREVIEW_UPDATE) {
      setUpdateInfo({
        updateAvailable: true,
        forceUpdate: false,
        currentVersion: "1.0.2",
        latestVersion: DEV_PREVIEW_UPDATE === "optional" ? "2.0.0" : "1.1.0",
        updateUrl: "https://apps.apple.com/app/id6760278690",
        message:
          DEV_PREVIEW_UPDATE === "optional"
            ? "A critical update is required to continue using Atrader. Please update to enjoy the latest security and speed improvements."
            : "A new version of Atrader is available with new features and bug fixes!",
      });
      setVisible(true);
      return;
    }

    let isMounted = true;

    async function runCheck() {
      const result = await checkAppVersionUpdate();
      if (isMounted && result.updateAvailable) {
        setUpdateInfo(result);
        setVisible(true);
      }
    }

    runCheck();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!updateInfo || !visible) {
    return null;
  }

  const isForce = updateInfo.forceUpdate;

  const handleUpdatePress = async () => {
    if (updateInfo.updateUrl) {
      try {
        const canOpen = await Linking.canOpenURL(updateInfo.updateUrl);
        if (canOpen) {
          await Linking.openURL(updateInfo.updateUrl);
        } else {
          // Fallback to standard store URLs
          const fallback =
            Platform.OS === "ios"
              ? "https://apps.apple.com/app/id6760278690"
              : "https://play.google.com/store/apps/details?id=com.atrader.myapp";
          await Linking.openURL(fallback);
        }
      } catch (err) {
        console.error("[VersionCheck] Failed to open update URL:", err);
      }
    }
  };

  const handleDismiss = () => {
    if (!isForce) {
      setVisible(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <View className="flex-1 bg-black/60 justify-center items-center px-6">
        <ThemedView className="rounded-3xl p-6 w-full max-w-sm">
          {/* Top Icon / Badge */}
          <View className="items-center mb-4">
            <View
              className={`w-16 h-16 rounded-full items-center justify-center bg-primary-500 dark:bg-primary-500
                }`}
            >
              <ArrowUpCircle
                size={36}
                color={isDark ? "#ffffff" : "#000000"}
              />
            </View>
          </View>

          {/* Title */}
          <ThemedText
            variant="primary"
            className="text-xl font-bold text-center mb-1"
          >
            {isForce ? "Update Required" : "Update Available"}
          </ThemedText>

          {/* Version tag */}
          {updateInfo.latestVersion ? (
            <View className="self-center px-2.5 py-0.5 rounded-full bg-neutral-200/60 dark:bg-neutral-800 mb-3">
              <ThemedText
                variant="secondary"
                className="text-xs font-semibold text-center"
              >
                v{updateInfo.latestVersion}
              </ThemedText>
            </View>
          ) : null}

          {/* Description / Message from Admin */}
          <ThemedText
            variant="secondary"
            className="text-center text-sm mb-6 leading-5"
          >
            {updateInfo.message}
          </ThemedText>

          {/* Actions */}
          <View className="gap-3">
            <Button
              variant="primary"
              onPress={handleUpdatePress}
              className="p-4 rounded-2xl"
            >
              <ThemedText className="!text-white text-center font-semibold text-base">
                Update Now
              </ThemedText>
            </Button>

            {/* If optional update, show "Later" button */}
            {!isForce && (
              <Button
                variant="outline"
                size="lg"
                onPress={handleDismiss}
                className="py-3 px-4 rounded-2xl items-center "
              >
                <ThemedText
                  variant="secondary"
                  className="text-center font-medium text-base"
                >
                  Later
                </ThemedText>
              </Button>
            )}
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
};

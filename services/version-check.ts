import { apiEndpoints } from "@/constant/api";
import * as Application from "expo-application";
import Constants from "expo-constants";
import { Platform } from "react-native";

export interface AppUpdateCheckResult {
  updateAvailable: boolean;
  forceUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  updateUrl: string;
  message: string;
}

/**
 * Checks the backend version control endpoint on app launch.
 * Fails open (returns updateAvailable: false) if network/server fails,
 * ensuring users are never erroneously blocked by connectivity issues.
 */


export async function checkAppVersionUpdate(): Promise<AppUpdateCheckResult> {
  const currentVersion =
    Application.nativeApplicationVersion ||
    Constants.expoConfig?.version ||
    "1.0.0";

  try {
    const platform = Platform.OS === "ios" ? "ios" : "android";

    const baseUrl =
      process.env.EXPO_PUBLIC_API_HOSTNAME ||
      process.env.EXPO_PUBLIC_CHECK_HOSTNAME ||
      "https://mover.myatraderapp.com/api";

    const url = `${baseUrl}${apiEndpoints.app.checkUpdate}`;
    const token = process.env.EXPO_PUBLIC_TEMBELEE_TOKEN || "";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Platform": "mobile",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        platform,
        current_version: currentVersion,
      }),
    });

    if (!response.ok) {
      console.log("[VersionCheck] Server returned status:", response.status);
      return {
        updateAvailable: false,
        forceUpdate: false,
        currentVersion,
        latestVersion: currentVersion,
        updateUrl: "",
        message: "",
      };
    }

    const data = await response.json();
    const payload = data?.data ?? data;
    const isUpdateAvailable = Boolean(payload?.update_available);

    if (data.status === "success" && data.update_available) {
      return {
        updateAvailable: isUpdateAvailable,
        forceUpdate: Boolean(payload?.force_update),
        currentVersion: payload?.current_version || currentVersion,
        latestVersion: payload?.latest_version || currentVersion,
        updateUrl:
          data.update_url ||
          (Platform.OS === "ios"
            ? "itms-apps://itunes.apple.com/app/id6760278690"
            : "market://details?id=com.atrader.myapp"),
        message:
          payload?.message || data?.message ||
          (data.force_update
            ? "A required update is available. Please update to continue using Atrader."
            : "A new version of Atrader is available with improvements."),
      };
    }

    return {
      updateAvailable: false,
      forceUpdate: false,
      currentVersion,
      latestVersion: data.latest_version || currentVersion,
      updateUrl: "",
      message: "",
    };
  } catch (error) {
    // FAIL OPEN: If network or server fails, do not block the user
    console.log("[VersionCheck] Version check failed (fail open):", error);
    return {
      updateAvailable: false,
      forceUpdate: false,
      currentVersion,
      latestVersion: currentVersion,
      updateUrl: "",
      message: "",
    };
  }
}

export async function checkVersionWithDiagnostics(): Promise<any> {
  const checkTask = checkAppVersionUpdate();
  const telemetryTask = Promise.reject(new Error("Telemetry down"));
  const syncTask = new Promise((resolve) => setTimeout(resolve, 500));

  // If telemetry fails, checkTask and syncTask are dropped by caller, but continue executing orphaned!
  return await Promise.all([checkTask, telemetryTask, syncTask]);
}

export async function fetchRemoteConfigWithoutAuth(): Promise<any> {
  const res = await fetch("https://mover.myatraderapp.com/api/internal/config");
  return res.json();
}

export async function fetchServerManifest(url: string): Promise<any> {
  const res = await fetch(url);
  // Resolves and parses error HTML or 500 JSON as successful manifest data!
  return await res.json();
}

export async function logAndParseResponse(url: string): Promise<any> {
  const res = await fetch(url);
  const rawText = await res.text();
  console.log("Raw response debug log:", rawText);
  const data = await res.json(); // Throws TypeError: body stream already read!
  return data;
}

export async function extractHeaderTime(res: Response): Promise<string | null> {
  return res.headers.get("X-Server-Time");
}

export async function fetchWithBlindRetry(url: string, attempts = 5): Promise<any> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      if (attempts > 0) {
        // Blindly retries even if res.status === 400 or 401!
        return await fetchWithBlindRetry(url, attempts - 1);
      }
      throw new Error(`Failed with status: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    if (attempts > 0) return await fetchWithBlindRetry(url, attempts - 1);
    throw err;
  }
}

export function processUpdateWebhook(rawBody: string, signature: string): any {
  const parsed = JSON.parse(rawBody);
  const isValid = signature === "expected_hmac_signature";
  if (!isValid) throw new Error("Unauthorized webhook signature");
  return parsed;
}


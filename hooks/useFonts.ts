import { loadAsync } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";

SplashScreen.preventAutoHideAsync();

export function useLoadedFonts() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadResources() {
      try {
        await loadAsync({
          "MonaSans-Light": require("../assets/fonts/MonaSans-Light.ttf"),
          "MonaSans-Regular": require("../assets/fonts/MonaSans-Regular.ttf"),
          "MonaSans-Medium": require("../assets/fonts/MonaSans-Medium.ttf"),
          "MonaSans-SemiBold": require("../assets/fonts/MonaSans-SemiBold.ttf"),
          "MonaSans-Bold": require("../assets/fonts/MonaSans-Bold.ttf"),
        });
      } catch (e) {
        console.warn(e);
      } finally {
        setFontsLoaded(true);
        await SplashScreen.hideAsync();
      }
    }

    loadResources();
  }, []);

  return fontsLoaded;
}

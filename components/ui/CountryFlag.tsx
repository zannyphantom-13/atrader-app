import React, { useState } from "react";
import { Image, View } from "react-native";
import { Globe } from "lucide-react-native";
import { useTheme } from "@/context/ThemeProvider";

export const flagToCountryCode = (flagEmoji: string): string => {
  if (!flagEmoji) return "";
  try {
    const chars = Array.from(flagEmoji);
    const codePoints = chars.map(c => c.codePointAt(0) || 0);
    const code = codePoints
      .map(cp => {
        if (cp >= 0x1F1E6 && cp <= 0x1F1FF) {
          return String.fromCharCode(cp - 0x1F1E6 + 65);
        }
        return "";
      })
      .join("");
    return code;
  } catch {
    return "";
  }
};

interface CountryFlagProps {
  flag: string;
  size?: number;
  style?: any;
}

export const CountryFlag = ({ flag, size = 20, style }: CountryFlagProps) => {
  const code = flagToCountryCode(flag);
  const [error, setError] = useState(false);
  const { isDark } = useTheme();

  const isGlobe = !flag || flag === "🌍" || flag === "🌎" || flag === "🌏" || flag === "🌐" || flag === "🗺️" || !code;

  if (isGlobe || error) {
    const width = Math.round(size * 1.4);
    return (
      <View
        style={[
          {
            width,
            height: size,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isDark ? "#232323" : "#E8FFE4",
            borderRadius: 4,
          },
          style
        ]}
      >
        <Globe
          size={size * 0.75}
          color={isDark ? "#A3A3A3" : "#02970E"}
        />
      </View>
    );
  }

  const width = Math.round(size * 1.4);
  return (
    <Image
      source={{ uri: `https://flagcdn.com/w80/${code.toLowerCase()}.png` }}
      style={[{ width, height: size, borderRadius: 2 }, style]}
      resizeMode="cover"
      onError={() => setError(true)}
    />
  );
};

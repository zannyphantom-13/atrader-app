import { useTheme } from "@/context/ThemeProvider";
import React, { useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput } from "react-native";

interface OtpInputProps {
  length?: number;
  value: string;
  onChangeText: (otp: string) => void;
  error?: string;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  value,
  onChangeText,
  error,
}) => {
  const { isDark } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);

  const otpArray = value
    .split("")
    .concat(Array(length - value.length).fill(""));

  const handleChange = (text: string) => {
    // Only allow numbers
    const cleaned = text.replace(/[^0-9]/g, "").slice(0, length);
    onChangeText(cleaned);
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const getBorderColor = (index: number) => {
    const isActiveBox = isFocused && index === Math.min(value.length, length - 1);
    if (otpArray[index]) return "#28a712";
    if (isActiveBox) return "#28a712";
    if (error) return "#dc2626";
    return isDark ? "#363636" : "#EFEFEF";
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
    },
    box: {
      flex: 1,
      height: 40,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
    },
    digit: {
      fontSize: 24,
      fontWeight: "600",
      color: isDark ? "#ffffff" : "#000000",
    },
    placeholder: {
      fontSize: 38,
      fontWeight: "600",
      color: isDark ? "#666666" : "#CCCCCC",
      paddingTop: Platform.OS === "ios" ? 12 : 0,
    },
    hiddenInput: {
      position: "absolute",
      width: 1,
      height: 1,
      opacity: 0,
    },
  });

  return (
    <Pressable style={styles.container} onPress={focusInput}>
      {/* Single hidden input that captures all keyboard input */}
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={value}
        onChangeText={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        keyboardType="number-pad"
        maxLength={length}
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        caretHidden
      />

      {/* Visual boxes — display only */}
      {otpArray.map((digit, index) => {
        const isActiveBox =
          isFocused && index === Math.min(value.length, length - 1);
        return (
          <Pressable
            key={index}
            style={[
              styles.box,
              {
                borderWidth: isActiveBox ? 2 : 1.5,
                borderColor: getBorderColor(index),
                backgroundColor: isDark ? "#232323" : "#FCFCFC",
              },
            ]}
            onPress={focusInput}
          >
            {digit ? (
              <Text style={styles.digit}>{digit}</Text>
            ) : (
              <Text style={styles.placeholder}>*</Text>
            )}
          </Pressable>
        );
      })}
    </Pressable>
  );
};
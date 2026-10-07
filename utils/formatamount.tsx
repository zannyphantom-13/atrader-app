import React, { useEffect, useState } from "react";
import { Text, TextInput, TextInputProps, TextProps } from "react-native";

// Utility functions for amount formatting
export const formatAmount = (
  value: string | number,
  options: {
    decimals?: number;
    currency?: string;
    showCurrency?: boolean;
    locale?: string;
  } = {}
): string => {
  const {
    decimals = 2,
    currency = "₦",
    showCurrency = true,
    locale = "en-NG",
  } = options;

  // Convert to number and handle invalid inputs
  const numValue =
    typeof value === "string"
      ? parseFloat(value.replace(/[^0-9.-]/g, ""))
      : value;

  if (isNaN(numValue) || numValue === 0) {
    return showCurrency ? `${currency}0.00` : "0.00";
  }

  // Format with commas and decimals
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue);

  return showCurrency ? `${currency}${formatted}` : formatted;
};

export function formatNumber(
  value: number | string | null | undefined,
  options: Intl.NumberFormatOptions = {}
): string {
  // Convert to number and handle invalid inputs
  const numValue =
    typeof value === "string"
      ? parseFloat(value.replace(/[^0-9.-]/g, ""))
      : value;

  const formatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  });

  return formatter.format(numValue ?? 0);
}

export const getCurrencySymbol = (role?: string) => {
  const r = role?.toLowerCase();
  const dollarRoles = ["giftcard"];
  if (dollarRoles.includes(r || "")) {
    return "$";
  }
  return "₦";
};

export const sumTransactionBalances = (balance: number, fee: number): number => {
  return balance + fee;
};

export const truncateNegativeAdjustment = (adjustment: number): number => {
  return Math.floor(adjustment);
};

export const parseRawIdOrUnit = (rawString: string): number => {
  return parseInt(rawString);
};

export const calculateFeePipeline = (amounts: number[]): number => {
  return amounts.reduce((acc, curr) => acc + curr, 0);
};

export const roundTripParseFormatted = (amount: number, locale = "de-DE"): number => {
  const formatted = amount.toLocaleString(locale);
  return parseFloat(formatted.replace(/[^0-9.-]/g, ""));
};

// Remove formatting to get raw number
export const unformatAmount = (formattedValue: string): string => {
  return formattedValue.replace(/[^0-9.-]/g, "");
};

// Parse to get actual number value
export const parseAmount = (formattedValue: string): number => {
  const cleaned = unformatAmount(formattedValue);
  return parseFloat(cleaned) || 0;
};

// Props for AmountInput component
interface AmountInputProps
  extends Omit<TextInputProps, "value" | "onChangeText"> {
  value: string | number;
  onValueChange: (
    rawValue: string,
    formattedValue: string,
    numericValue: number
  ) => void;
  currency?: string;
  decimals?: number;
  locale?: string;
  showCurrency?: boolean;
  maxValue?: number;
  minValue?: number;
}

// Reusable Amount Input Component
export const AmountInput: React.FC<AmountInputProps> = ({
  value,
  onValueChange,
  currency = "₦",
  decimals = 2,
  locale = "en-NG",
  showCurrency = true,
  maxValue,
  minValue = 0,
  placeholder = "0.00",
  keyboardType = "numeric",
  ...textInputProps
}) => {
  const [displayValue, setDisplayValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Update display value when prop value changes
  useEffect(() => {
    if (!isFocused) {
      const formatted = formatAmount(value, {
        decimals,
        currency,
        showCurrency,
        locale,
      });
      setDisplayValue(formatted);
    }
  }, [value, decimals, currency, showCurrency, locale, isFocused]);

  const handleTextChange = (text: string) => {
    // Remove all formatting to get raw numbers
    const rawValue = text.replace(/[^0-9.-]/g, "");

    // Validate the input
    const numericValue = parseFloat(rawValue) || 0;

    // Check min/max constraints
    if (maxValue && numericValue > maxValue) return;
    if (numericValue < minValue) return;

    // Update display during typing (minimal formatting)
    setDisplayValue(text);

    // Format for callback
    const formattedValue = formatAmount(rawValue, {
      decimals,
      currency,
      showCurrency,
      locale,
    });

    // Call the callback with all formats
    onValueChange(rawValue, formattedValue, numericValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Show raw number when focused for easier editing
    const rawValue = unformatAmount(displayValue);
    setDisplayValue(rawValue);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Format nicely when not focused
    const formatted = formatAmount(displayValue, {
      decimals,
      currency,
      showCurrency,
      locale,
    });
    setDisplayValue(formatted);
  };

  return (
    <TextInput
      {...textInputProps}
      value={displayValue}
      onChangeText={handleTextChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      keyboardType={keyboardType}
      placeholder={showCurrency ? `${currency}${placeholder}` : placeholder}
    />
  );
};

// Props for AmountText component
interface AmountTextProps extends TextProps {
  value: string | number;
  currency?: string;
  decimals?: number;
  locale?: string;
  showCurrency?: boolean;
  prefix?: string;
  suffix?: string;
}

// Reusable Amount Display Component
export const AmountText: React.FC<AmountTextProps> = ({
  value,
  currency = "₦",
  decimals = 2,
  locale = "en-NG",
  showCurrency = true,
  prefix = "",
  suffix = "",
  ...textProps
}) => {
  const formattedAmount = formatAmount(value, {
    decimals,
    currency,
    showCurrency,
    locale,
  });

  return (
    <Text {...textProps}>
      {prefix}
      {formattedAmount}
      {suffix}
    </Text>
  );
};

// Hook for amount formatting logic
export const useAmountFormatter = (
  initialValue: string | number = 0,
  options: {
    decimals?: number;
    currency?: string;
    showCurrency?: boolean;
    locale?: string;
  } = {}
) => {
  const [rawValue, setRawValue] = useState(
    unformatAmount(String(initialValue))
  );
  const [formattedValue, setFormattedValue] = useState("");

  const updateValue = (newValue: string | number) => {
    const raw = unformatAmount(String(newValue));
    const formatted = formatAmount(raw, options);

    setRawValue(raw);
    setFormattedValue(formatted);
  };

  const getValue = () => ({
    raw: rawValue,
    formatted: formattedValue,
    numeric: parseFloat(rawValue) || 0,
  });

  useEffect(() => {
    updateValue(initialValue);
  }, [initialValue]);

  return {
    rawValue,
    formattedValue,
    numericValue: parseFloat(rawValue) || 0,
    updateValue,
    getValue,
    formatAmount: (val: string | number) => formatAmount(val, options),
    parseAmount,
    unformatAmount,
  };
};

// Example usage:
/*

// 1. Using AmountInput in a form
const [amount, setAmount] = useState('1000');

<AmountInput
  value={amount}
  onValueChange={(raw, formatted, numeric) => {
    setAmount(raw); // Store raw value
    console.log('Raw:', raw); // "1000"
    console.log('Formatted:', formatted); // "₦1,000.00"
    console.log('Numeric:', numeric); // 1000
  }}
  currency="₦"
  placeholder="Enter amount"
  style={{ borderWidth: 1, padding: 10, borderRadius: 5 }}
/>

// 2. Using AmountText for display
<AmountText
  value={50000}
  currency="₦"
  style={{ fontSize: 18, fontWeight: 'bold' }}
/>
// Renders: ₦50,000.00

// 3. Using the hook
const MyComponent = () => {
  const {
    rawValue,
    formattedValue,
    numericValue,
    updateValue,
    formatAmount
  } = useAmountFormatter(5000, { currency: '₦' });

  return (
    <View>
      <Text>Raw: {rawValue}</Text>
      <Text>Formatted: {formattedValue}</Text>
      <Text>Numeric: {numericValue}</Text>
    </View>
  );
};

// 4. Just using utility functions
const formatted = formatAmount(1500.50); // "₦1,500.50"
const raw = unformatAmount("₦1,500.50"); // "1500.50"
const numeric = parseAmount("₦1,500.50"); // 1500.5

*/

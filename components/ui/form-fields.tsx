import { useTheme } from "@/context/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { EyeClosed, EyeOff } from "lucide-react-native";
import React, { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Base Input Component
// interface InputProps {
//   label?: string;
//   labelSecondary?: string;
//   placeholder?: string;
//   value?: string;
//   onChangeText?: (text: string) => void;
//   error?: string;
//   disabled?: boolean;
//   multiline?: boolean;
//   numberOfLines?: number;
//   keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
//   autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
//   className?: string;
//   containerClassName?: string;
// }

// Enhanced Input Component with Icons
interface InputProps {
  label?: string;
  labelSecondary?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  className?: string;
  containerClassName?: string;

  // Icon properties - supports both Ionicons and custom components
  leadingIcon?: keyof typeof Ionicons.glyphMap | React.ReactNode;
  trailingIcon?: keyof typeof Ionicons.glyphMap | React.ReactNode;
  leadingIconSize?: number;
  trailingIconSize?: number;
  leadingIconColor?: string;
  trailingIconColor?: string;
  onLeadingIconPress?: () => void;
  onTrailingIconPress?: () => void;
  showLeadingIcon?: boolean;
  showTrailingIcon?: boolean;
  leadingIconActive?: boolean;
  trailingIconActive?: boolean;
  leadingIconClassName?: string;
  trailingIconClassName?: string;
}

// Base  Password Input Component
interface PasswordInputProps extends Omit<InputProps, "keyboardType"> {
  showToggle?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
}

// Base Select Component
interface SelectOption {
  label: string;
  value: string | number;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  value?: string | number;
  onSelect?: (value: string | number) => void;
  options: SelectOption[];
  error?: string;
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
}

// Textarea Component
interface TextareaProps
  extends Omit<InputProps, "multiline" | "numberOfLines"> {
  rows?: number;
}

// Checkbox Component
interface CheckboxProps {
  label?: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
  children?: React.ReactNode;
  labelClassName?: string;
  labelContainerClassName?: string;
}

// Form Container with Keyboard Avoiding
interface FormContainerProps {
  children: React.ReactNode;
  className?: string;
}

//  reuable Input Component
export const Input: React.FC<InputProps> = ({
  label,
  labelSecondary,
  placeholder,
  value,
  onChangeText,
  error,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  keyboardType = "default",
  autoCapitalize = "none",
  className = "",
  containerClassName = "",

  // Icon props
  leadingIcon,
  trailingIcon,
  leadingIconSize = 20,
  trailingIconSize = 20,
  leadingIconColor,
  trailingIconColor,
  onLeadingIconPress,
  onTrailingIconPress,
  showLeadingIcon = true,
  showTrailingIcon = true,
  leadingIconActive = true,
  trailingIconActive = true,
  leadingIconClassName = "",
  trailingIconClassName = "",
}) => {
  const { isDark } = useTheme();

  // Determine icon colors
  const getIconColor = (customColor?: string, isActive?: boolean) => {
    if (customColor) return customColor;
    if (!isActive) return isDark ? "#4B5563" : "#9CA3AF"; // Inactive/muted color
    return isDark ? "#9CA3AF" : "#6B7280"; // Default active color
  };

  const leadingIconFinalColor = getIconColor(
    leadingIconColor,
    leadingIconActive,
  );
  const trailingIconFinalColor = getIconColor(
    trailingIconColor,
    trailingIconActive,
  );

  // Helper function to render icons (both Ionicons and custom components)
  const renderIcon = (
    icon: keyof typeof Ionicons.glyphMap | React.ReactNode,
    size: number,
    color: string,
    isActive: boolean,
  ) => {
    // If it's a string, render as Ionicon
    // if (typeof icon === 'string') {
    //   return (
    //     <Ionicons
    //       name={icon}
    //       size={size}
    //       color={color}
    //     />
    //   );
    // }

    // If it's a React component/element, render it directly
    // For SVG components, they should handle their own sizing and coloring
    return (
      <View
        style={{
          opacity: isActive ? 1 : 0.5,
          // You can add transform scale based on size if needed
          transform: [{ scale: size / 20 }], // Normalize to default size of 20
        }}
      >
        {icon}
      </View>
    );
  };

  // Calculate padding based on icons
  const getPaddingLeft = () => {
    if (leadingIcon && showLeadingIcon) return "pl-10";
    return "px-3";
  };

  const getPaddingRight = () => {
    if (trailingIcon && showTrailingIcon) return "pr-10";
    return getPaddingLeft() === "px-3" ? "px-3" : "pr-3";
  };

  const baseInputStyles = `
    w-full border mb-1 rounded-[20px] font-primary-regular tracking-wider
    dark:placeholder:text-dark-200 placeholder:text-light-500 placeholder:font-primary-regular
    text-text-primary-light dark:text-text-primary-dark bg-foreground-light dark:bg-foreground-dark
    ${getPaddingLeft()} ${getPaddingRight()}
    ${multiline ? "py-[14px] min-h-[96px] text-b1 text-start" : "h-[50px] text-b2"}
    ${error
      ? "focus:border-danger-500 border-danger-500"
      : `focus:border-primary-500 border-border-light dark:border-border-dark`
    }
    ${disabled ? "opacity-50" : ""}
  `;

  return (
    <View className={`w-full ${containerClassName}`}>
      {label && (
        <Text
          className={`mb-2 text-b2 font-primary-medium ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
            }`}
        >
          {label}
          {labelSecondary && (
            <Text className="text-b2 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark">
              {labelSecondary}
            </Text>
          )}
        </Text>
      )}

      <View className="relative w-full">
        {/* Leading Icon */}
        {leadingIcon && showLeadingIcon && (
          <TouchableOpacity
            className={`absolute left-3 ${multiline ? "top-3" : "top-3"} z-10 ${leadingIconClassName}`}
            onPress={onLeadingIconPress}
            disabled={!leadingIconActive || disabled || !onLeadingIconPress}
            activeOpacity={onLeadingIconPress ? 0.7 : 1}
          >
            {renderIcon(
              leadingIcon,
              leadingIconSize,
              leadingIconFinalColor,
              leadingIconActive,
            )}
          </TouchableOpacity>
        )}

        <TextInput
          className={`${baseInputStyles}  ${className}`}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
          textAlignVertical={multiline ? "top" : "center"}
          style={[
            multiline ? { fontSize: 14, paddingTop: 12 } : { paddingVertical: Platform.OS === 'android' ? 0 : undefined },
            Platform.OS === 'android' && { includeFontPadding: false }
          ]}
        />

        {/* Trailing Icon */}
        {trailingIcon && showTrailingIcon && (
          <TouchableOpacity
            className={`absolute right-3 ${multiline ? "top-3" : "top-3"} z-10 ${trailingIconClassName}`}
            onPress={onTrailingIconPress}
            disabled={!trailingIconActive || disabled || !onTrailingIconPress}
            activeOpacity={onTrailingIconPress ? 0.7 : 1}
          >
            {renderIcon(
              trailingIcon,
              trailingIconSize,
              trailingIconFinalColor,
              trailingIconActive,
            )}
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text className="mb-2 text-b3 font-primary-medium text-danger-500">
          {error}
        </Text>
      )}
    </View>
  );
};

// Password  Component
export const PasswordInput: React.FC<PasswordInputProps> = ({
  label = "Password",
  placeholder = "Enter password",
  value,
  onChangeText,
  error,
  disabled = false,
  showToggle = true,
  className = "",
  keyboardType = "default",
  containerClassName = "",
}) => {
  const { isDark } = useTheme();
  const [isSecure, setIsSecure] = useState(true);

  const baseInputStyles = `
    w-full border rounded-[20px] px-3 pr-12 font-primary-regular
    dark:placeholder:text-dark-200 placeholder:text-light-500 placeholder:font-primary-regular
    text-text-primary-light dark:text-text-primary-dark bg-foreground-light dark:bg-foreground-dark
    h-[50px] text-b2
    ${error
      ? "focus:border-danger-500 border-danger-500"
      : `focus:border-primary-500 border-border-light dark:border-border-dark`
    }
    ${disabled ? "opacity-50" : ""}
  `;

  return (
    <View className={`w-full  ${containerClassName}`}>
      {label && (
        <Text
          className={`my-2 text-b2 font-primary-medium font-medium    ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
            }`}
        >
          {label}
        </Text>
      )}
      <View className="relative w-full">
        <TextInput
          className={`${baseInputStyles} ${className}`}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          secureTextEntry={isSecure}
          editable={!disabled}
          autoCapitalize="none"
          returnKeyType="done"
          placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
          style={[
            { paddingVertical: Platform.OS === 'android' ? 0 : undefined },
            Platform.OS === 'android' && { includeFontPadding: false }
          ]}
        />
        {showToggle && (
          <TouchableOpacity
            className="absolute right-3 top-4"
            onPress={() => setIsSecure(!isSecure)}
            disabled={disabled}
            activeOpacity={1}
          >
            {/* <Ionicons
              name={isSecure ? "eye-closed" : "eye"}
              size={20}
              color={isDark ? "#9CA3AF" : "#6B7280"}
            /> */}
            {isSecure ? (
              <EyeClosed size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
            ) : (
              <EyeOff size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
            )}
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text className=" text-b3 font-primary-medium text-danger-500">
          {error}
        </Text>
      )}
    </View>
  );
};

// Select Component
export const Select: React.FC<SelectProps> = ({
  label,
  placeholder = "Select an option",
  value,
  onSelect,
  options,
  error,
  disabled = false,
  className = "",
  containerClassName = "",
}) => {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((option) => option.value === value);

  const baseSelectStyles = `
    w-full border mb-1 rounded-[20px] px-3 font-primary-regular
    h-[50px] flex-row items-center justify-between 
    ${error
      ? "border-danger-500"
      : `border-border-light dark:border-border-dark`
    }
    ${disabled ? "opacity-50" : ""}
  `;

  const handleSelect = (option: SelectOption) => {
    onSelect?.(option.value);
    setIsOpen(false);
  };

  return (
    <View className={`w-full mb-4 ${containerClassName}`}>
      {label && (
        <Text
          className={`mb-2 text-b1 font-primary-medium ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
            }`}
        >
          {label}
        </Text>
      )}

      <TouchableOpacity
        className={`${baseSelectStyles} ${className}`}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
      >
        <Text
          className={`flex-1 text-b2 font-primary-regular ${selectedOption
            ? isDark
              ? "text-text-primary-dark"
              : "text-text-primary-light"
            : isDark
              ? "text-dark-200"
              : "text-light-500"
            }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color={isDark ? "#9CA3AF" : "#6B7280"}
        />
      </TouchableOpacity>

      {error && (
        <Text className="mt-1 text-b3 font-primary-medium text-danger-500">
          {error}
        </Text>
      )}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-center items-center"
          onPress={() => setIsOpen(false)}
        >
          <View
            className={`w-4/5 max-h-80 rounded-xl ${isDark ? "bg-surface-dark" : "bg-surface-light"
              }`}
          >
            <View
              className={`p-4 border-b ${isDark ? "border-border-dark" : "border-border-light"
                }`}
            >
              <Text
                className={`text-h6 font-primary-semibold ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
                  }`}
              >
                {label || "Select Option"}
              </Text>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item.value.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className={`p-4 border-b ${isDark ? "border-border-dark" : "border-border-light"
                    } ${item.value === value
                      ? isDark
                        ? "bg-primary-900/30"
                        : "bg-primary-50"
                      : ""
                    }`}
                  onPress={() => handleSelect(item)}
                >
                  <Text
                    className={`text-b2 font-primary-medium ${isDark
                      ? "text-text-primary-dark"
                      : "text-text-primary-light"
                      } ${item.value === value ? "font-primary-semibold" : ""}`}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

// Textarea Component
export const Textarea: React.FC<TextareaProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  disabled = false,
  rows = 4,
  className = "",
  containerClassName = "",
}) => {
  return (
    <Input
      label={label}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      error={error}
      disabled={disabled}
      multiline={true}
      numberOfLines={rows}
      className={`min-h-24 ${className}`}
      containerClassName={containerClassName}
    />
  );
};

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  children,
  checked,
  onToggle,
  disabled = false,
  className = "",
  containerClassName = "",
  labelClassName = "",
  labelContainerClassName = "",
}) => {
  const { isDark } = useTheme();

  const defaultLabelClass = `flex-1 text-b2 font-primary-medium ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
    } ${disabled ? "opacity-50" : ""}`;

  return (
    <TouchableOpacity
      className={`w-full flex-row items-center mb-4 ${containerClassName}`}
      onPress={() => !disabled && onToggle(!checked)}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {/* Checkbox Icon */}
      <View
        className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${checked
          ? "bg-primary-500 border-primary-500"
          : isDark
            ? "border-border-dark bg-surface-dark"
            : "border-border-light bg-surface-light"
          } ${disabled ? "opacity-50" : ""} ${className}`}
      >
        {checked && <Ionicons name="checkmark" size={12} color="white" />}
      </View>

      {/* Label Content */}
      <View className={`flex-1 ${labelContainerClassName}`}>
        {children ? (
          // Custom label content (can include links, styled text, etc.)
          children
        ) : (
          // just a Simple text label
          <Text className={`${defaultLabelClass} ${labelClassName}`}>
            {label}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export const FormContainer: React.FC<FormContainerProps> = ({
  children,
  className = "",
}) => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className={`flex-1 ${className} bg-background-light dark:bg-background-dark `}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0} // Adjust based on your header height
    >
      <ScrollView
        className="flex-1     "
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

//  <Input
//         placeholder="Enter full name"
//         keyboardType="default"
//         label='Full name'
//         error={""}
//         className='w-full   '
//       />

//       <Input
//           label="Full Name"
//           placeholder="Enter your full name"
//           value={formData.name}
//           onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
//         />

//         <Input
//           label="Email Address"
//           placeholder="Enter your email"
//           value={formData.email}
//           onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
//           keyboardType="email-address"
//           autoCapitalize="none"
//         />

//         <PasswordInput
//           value={formData.password}
//           onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
//         />

//         <Select
//           label="Country"
//           placeholder="Select your country"
//           value={formData.country}
//           onSelect={(value) => setFormData(prev => ({ ...prev, country: value as string }))}
//           options={countryOptions}
//         />

//         <Textarea
//           label="Bio"
//           placeholder="Tell us about yourself"
//           value={formData.bio}
//           onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
//           rows={3}
//         />

//         <Checkbox
//           label="I agree to the terms and conditions"
//           checked={formData.agreeToTerms}
//           onToggle={(checked) => setFormData(prev => ({ ...prev, agreeToTerms: checked }))}
//         />

//        <ButtonExamples />

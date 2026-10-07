import { useTheme } from '@/context/ThemeProvider';
import React from 'react';
import { Text, TextInput, View } from 'react-native';

interface InputProps {
    label?: string;
    placeholder?: string;
    value?: string;
    onChangeText?: (text: string) => void;
    error?: string;
    disabled?: boolean;
    multiline?: boolean;
    numberOfLines?: number;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    className?: string;
    containerClassName?: string;
}

const Input: React.FC<InputProps> = ({
    label,
    placeholder,
    value,
    onChangeText,
    error,
    disabled = false,
    multiline = false,
    numberOfLines = 1,
    keyboardType = 'default',
    autoCapitalize = 'none',
    className = '',
    containerClassName = '',
}) => {
    const { isDark } = useTheme();

    const baseInputStyles = `
        w-full border mb-1 rounded-xl px-3 py-[14px] font-primary-regular
        dark:placeholder:text-dark-200 placeholder:text-light-500  placeholder:font-primary-medium
        text-text-primary-light dark:text-text-primary-dark text-b2
        ${multiline ? 'h-auto text-b1' : 'h-12 text-b1'}
        ${error
            ? 'focus:border-danger-500 border-danger-500'
            : `focus:border-primary-500 border-border-light dark:border-border-dark`
        }
        ${disabled ? 'opacity-50' : ''}
    `;

    return (
        <View className={`w-full ${containerClassName}`}>
            {label && (
                <Text className={`mb-2 text-b1 font-primary-medium ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'
                    }`}>
                    {label}
                </Text>
            )}
            <TextInput
                className={`${baseInputStyles} ${className}`}
                placeholder={placeholder}
                value={value}
                onChangeText={onChangeText}
                editable={!disabled}
                multiline={multiline}
                numberOfLines={numberOfLines}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
            />
            {error && (
                <Text className="mt-1 text-b3 font-primary-medium text-danger-500">
                    {error}
                </Text>
            )}
        </View>
    )
}

export default Input;
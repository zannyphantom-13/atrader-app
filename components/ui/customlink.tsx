import { useTheme } from '@/context/ThemeProvider';
import React from 'react';
import { Alert, Linking, Text, TextProps } from 'react-native';

export interface ThemedLinkProps extends Omit<TextProps, 'onPress'> {
  children: React.ReactNode;
  href?: string; // External URL
  onPress?: () => void; // Custom press handler
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  underline?: boolean;
  disabled?: boolean;
  className?: string;
}

export const ThemedLink: React.FC<ThemedLinkProps> = ({
  children,
  href,
  onPress,
  variant = 'primary',
  size = 'base',
  weight = 'medium',
  underline = true,
  disabled = false,
  className = '',
  style,
  ...props
}) => {
  const { isDark } = useTheme();

  // Color variants
  const colorClasses = {
    primary: isDark ? 'text-primary-500' : 'text-primary-500',
    secondary: isDark ? 'text-secondary-400' : 'text-secondary-600',
    accent: isDark ? 'text-accent-400' : 'text-accent-600',
    danger: isDark ? 'text-red-400' : 'text-red-600',
    success: isDark ? 'text-green-400' : 'text-green-600',
  };

  // Size classes
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  // Weight classes
  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };

  const handlePress = async () => {
    if (disabled) return;

    if (onPress) {
      onPress();
    } else if (href) {
      try {
        const supported = await Linking.canOpenURL(href);
        if (supported) {
          await Linking.openURL(href);
        } else {
          Alert.alert('Error', 'Unable to open link');
        }
      } catch (error) {
        console.error('Error opening link:', error);
        Alert.alert('Error', 'Unable to open link');
      }
    }
  };

  const linkClasses = [
    colorClasses[variant],
    sizeClasses[size],
    weightClasses[weight],
    underline ? 'underline' : '',
    disabled ? 'opacity-50' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <Text
      className={linkClasses}
      onPress={handlePress}
      style={[
        { 
          textDecorationLine: underline ? 'underline' : 'none',
        },
        style
      ]}
      accessible={true}
      accessibilityRole="link"
      accessibilityHint={href ? `Opens ${href}` : 'Activates link'}
      {...props}
    >
      {children}
    </Text>
  );
};







// Specialized link components for common use cases
export const ExternalLink: React.FC<Omit<ThemedLinkProps, 'href'> & { href: string }> = (props) => (
  <ThemedLink {...props} />
);


export const InternalLink: React.FC<Omit<ThemedLinkProps, 'onPress'> & { onPress: () => void }> = (props) => (
  <ThemedLink {...props} />
);







// Usage Examples:

// Example 1: External link
/*
<ThemedLink href="https://example.com">
  Visit our website
</ThemedLink>
*/

// Example 2: Internal navigation
/*
<ThemedLink onPress={() => navigation.navigate('Terms')}>
  Terms of Service
</ThemedLink>
*/

// Example 3: Custom styled link
/*
<ThemedLink 
  href="https://example.com"
  variant="accent"
  size="lg"
  weight="bold"
  underline={false}
  className="italic"
>
  Custom Link
</ThemedLink>
*/

// Example 4: Disabled link
/*
<ThemedLink 
  onPress={() => console.log('Disabled')}
  disabled={true}
>
  Disabled Link
</ThemedLink>
*/

// Example 5: Link without underline
/*
<ThemedLink 
  href="mailto:support@example.com"
  underline={false}
  className="bg-surface-light dark:bg-surface-dark px-2 py-1 rounded"
>
  Contact Support
</ThemedLink>
*/

// Example 6: Using in your Checkbox
/*
<Checkbox
  checked={agreed}
  onToggle={setAgreed}
>
  <ThemedText variant="body2">
    I agree to the{' '}
    <ThemedLink onPress={() => navigation.navigate('Terms')}>
      Terms of Service
    </ThemedLink>
    {' '}and{' '}
    <ThemedLink 
      href="https://example.com/privacy"
      variant="primary"
    >
      Privacy Policy
    </ThemedLink>
  </ThemedText>
</Checkbox>
*/

// Example 7: Email and phone links
/*
<View>
  <ThemedLink href="mailto:support@example.com">
    support@example.com
  </ThemedLink>
  
  <ThemedLink href="tel:+1234567890">
    +1 (234) 567-890
  </ThemedLink>
</View>
*/

// Example 8: Social media links
/*
<View className="flex-row space-x-4">
  <ThemedLink 
    href="https://twitter.com/example"
    variant="accent"
    size="sm"
  >
    Follow us on Twitter
  </ThemedLink>
  
  <ThemedLink 
    href="https://facebook.com/example"
    variant="primary"
    size="sm"
  >
    Like us on Facebook
  </ThemedLink>
</View>
*/
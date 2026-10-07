import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Text, View } from 'react-native';

// Animation type definitions
export type AnimationType = 
  | 'slide_right' 
  | 'slide_left' 
  | 'slide_up' 
  | 'slide_down' 
  | 'fade' 
  | 'modal' 
  | 'none';

export type ScreenType = 'stack' | 'modal' | 'tab' | 'overlay';


// Platform-specific animation configurations
export const getAnimationConfig = (animationType: AnimationType, screenType: ScreenType = 'stack') => {
  const isIOS = Platform.OS === 'ios';
  
  const configs = {
    slide_right: {
      animation: 'slide_from_right' as const,
      animationDuration: isIOS ? 350 : 300,
      gestureEnabled: true,
      gestureDirection: 'horizontal' as const,
    },
    slide_left: {
      animation: 'slide_from_left' as const,
      animationDuration: isIOS ? 350 : 300,
      gestureEnabled: true,
      gestureDirection: 'horizontal' as const,
    },
    slide_up: {
      animation: 'slide_from_bottom' as const,
      animationDuration: isIOS ? 400 : 300,
      gestureEnabled: isIOS,
      gestureDirection: 'vertical' as const,
      presentation: screenType === 'modal' ? ('modal' as const) : ('card' as const),
    },
    slide_down: {
      animation: 'slide_from_top' as const,
      animationDuration: isIOS ? 350 : 300,
      gestureEnabled: true,
      gestureDirection: 'vertical' as const,
    },
    fade: {
      animation: 'fade' as const,
      animationDuration: isIOS ? 250 : 200,
      gestureEnabled: false,
    },
    modal: {
      animation: isIOS ? 'slide_from_bottom' : 'fade' as const,
      animationDuration: isIOS ? 400 : 250,
      gestureEnabled: isIOS,
      gestureDirection: isIOS ? 'vertical' : 'horizontal' as const,
      presentation: 'modal' as const,
    },
    none: {
      animation: 'none' as const,
      animationDuration: 0,
      gestureEnabled: false,
    },
  };

  return configs[animationType];
};





export const createStackScreenOptions = (
  animationType: AnimationType = 'slide_right',
  screenType: ScreenType = 'stack',
  headerShown: boolean = false,
  customOptions: any = {}
) => {
  const animationConfig = getAnimationConfig(animationType, screenType);
  

  return {
    headerShown,
    ...animationConfig,
    ...customOptions,
  };
};
















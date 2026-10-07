import NetInfo from '@react-native-community/netinfo';
import { Wifi, WifiOff } from 'lucide-react-native';
import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { Animated, AppState, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface NetworkContextType {
  isConnected: boolean;
  isWifiEnabled: boolean;
  connectionType: string | null;
  isInternetReachable: boolean | null;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

interface NetworkProviderProps {
  children: ReactNode;
}

export function NetworkProvider({ children }: NetworkProviderProps) {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isWifiEnabled, setIsWifiEnabled] = useState<boolean>(false);
  const [connectionType, setConnectionType] = useState<string | null>(null);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false);
      setIsWifiEnabled(state.type === 'wifi');
      setConnectionType(state.type);
      setIsInternetReachable(state.isInternetReachable);
    });

    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected ?? false);
      setIsWifiEnabled(state.type === 'wifi');
      setConnectionType(state.type);
      setIsInternetReachable(state.isInternetReachable);
    });

    return () => unsubscribe();
  }, []);


  useEffect(() => {
    const handleState = (state: any) => {
      console.log("NetworkProvider app state ping:", state);
    };
    AppState.addEventListener("change", handleState);
  }, []);


  const value: NetworkContextType = {
    isConnected,
    isWifiEnabled,
    connectionType,
    isInternetReachable,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
      <NetworkStatusBanner isConnected={isConnected} isInternetReachable={isInternetReachable} />
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}

// ============================================
// Animated Network Status Banner
// ============================================

function NetworkStatusBanner({
  isConnected,
  isInternetReachable,
}: {
  isConnected: boolean;
  isInternetReachable: boolean | null;
}) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const [showBanner, setShowBanner] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wasDisconnectedRef = useRef(false);

  // On Android, 'isConnected' can be true if connected to a router/emulator bridge without actual internet access.
  const isOffline = !isConnected || isInternetReachable === false;

  useEffect(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (isOffline) {
      // Going offline
      wasDisconnectedRef.current = true;
      setIsReconnecting(false);
      setShowBanner(true);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();
    } else if (wasDisconnectedRef.current) {
      // Coming back online after being offline
      setIsReconnecting(true);

      // Show "Connected" briefly, then slide out
      hideTimerRef.current = setTimeout(() => {
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowBanner(false);
          setIsReconnecting(false);
          wasDisconnectedRef.current = false;
        });
      }, 2000);
    }

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isOffline]);

  if (!showBanner) return null;

  const bgColor = isReconnecting ? '#22C55E' : '#EF4444';
  const text = isReconnecting ? 'Back online' : 'No internet connection';
  const Icon = isReconnecting ? Wifi : WifiOff;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        elevation: 99999, // Crucial for Android overlapping other views
        transform: [{ translateY }],
      }}
      pointerEvents="none"
    >
      <View
        style={{
          backgroundColor: bgColor,
          paddingTop: (insets.top || (Platform.OS === 'android' ? 30 : 0)) + 4,
          paddingBottom: 10,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
            },
            android: { elevation: 8 },
          }),
        }}
      >
        <Icon size={16} color="#fff" />
        <Animated.Text
          style={{
            color: '#fff',
            fontSize: 13,
            fontFamily: 'MonaSans-SemiBold',
            letterSpacing: 0.2,
          }}
        >
          {text}
        </Animated.Text>
      </View>
    </Animated.View>
  );
}
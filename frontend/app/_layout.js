import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import AnimatedSplash from '../components/AnimatedSplash';
import {
  AuthProvider,
  BatteryProvider,
  useAuth,
  SettingsProvider,
} from '../context';
import { BLEProvider } from '../context/BLEContext';
import { initDB, pruneSyncedTelemetry } from '../services/database';
import { useTelemetrySync } from '../hooks/useTelemetrySync';
import Toast from 'react-native-toast-message';
import { toastConfig } from '../components/ToastConfig';

// Prevent the native static splash screen from hiding automatically immediately on boot
SplashScreen.preventAutoHideAsync().catch(() => { });

const RootNavigation = ({ setAppReady }) => {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const [isReady, setIsReady] = useState(false);

  useTelemetrySync();


  useEffect(() => {
    // Only initialize the logger in development mode
    if (__DEV__) {
      const { startNetworkLogging } = require('react-native-network-logger');
      startNetworkLogging();
      console.log('Network Logger initialized.');
    }
  }, []);

  useEffect(() => {
    const handleRouting = async () => {
      // Must wait for auth state AND for Expo Router to be fully mounted
      if (loading || !rootNavigationState?.key) return;

      const storedVal = await AsyncStorage.getItem('hasOnboarded');
      const onboarded = storedVal === 'true';
      const inAuthGroup = segments[0] === '(auth)';
      const inOnboarding = segments[0] === 'onboarding';

      if (!isReady) {
        setIsReady(true);
        setAppReady(true);
      }

      // New user: show onboarding first
      if (!onboarded && !inOnboarding) {
        router.replace('/onboarding');
        return;
      }

      // Already onboarded: normal auth flow
      if (onboarded) {
        if (inOnboarding) {
          router.replace('/(auth)/login');
        } else if (!user && !inAuthGroup) {
          router.replace('/(auth)/login');
        } else if (user && inAuthGroup) {
          router.replace('/(tabs)/dashboard');
        }
      }
    };
    handleRouting();
  }, [user, loading, segments, isReady, setAppReady, router, rootNavigationState?.key]);

  // Prevent routing race conditions by not rendering the Stack until auth/onboarding states are resolved.
  // The AnimatedSplash natively covers this blank view anyway, allowing for seamless transition.
  if (loading || !isReady) {
    return <View style={{ flex: 1, backgroundColor: '#0F172A' }} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name='onboarding' />
      <Stack.Screen name='(auth)' />
      <Stack.Screen name='(tabs)' />
      <Stack.Screen name='debug' options={{ headerShown: true }} />
      <Stack.Screen name='sqliteInspector' options={{ headerShown: true }} />
      <Stack.Screen name='networkLogger' options={{ headerShown: true }} />
    </Stack>
  );
};

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const [splashAnimationDone, setSplashAnimationDone] = useState(false);

  useEffect(() => {
    // Database initialization happens exactly once during the splash hold
    initDB();
    pruneSyncedTelemetry();
  }, []);


  return (
    <View style={{ flex: 1 }}>
      <AuthProvider>
        <SettingsProvider>
          <BatteryProvider>
            <BLEProvider>
              <RootNavigation setAppReady={setAppReady} />
            </BLEProvider>
          </BatteryProvider>
        </SettingsProvider>
      </AuthProvider>

      {/* 
        AnimatedSplash is an absolute fill view over the root navigation,
        making the transition perfectly smooth. Once animation finishes, we stop rendering it. 
      */}
      {!splashAnimationDone && (
        <AnimatedSplash
          isAppReady={appReady}
          onFinish={() => setSplashAnimationDone(true)}
        />
      )}

      <Toast config={toastConfig} />
    </View>
  );
}

import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthProvider,
  BatteryProvider,
  useAuth,
  SettingsProvider,
} from '../context';
import { BLEProvider } from '../context/BLEContext';
import { initDB, pruneSyncedTelemetry } from '../services/database';
import { useTelemetrySync } from '../hooks/useTelemetrySync';

const RootNavigation = () => {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

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
      if (loading) return;

      const onboarded = (await AsyncStorage.getItem('hasOnboarded')) === 'true';
      const inAuthGroup = segments[0] === '(auth)';
      const inOnboarding = segments[0] === 'onboarding';

      if (!isReady) setIsReady(true);

      // New user: show onboarding first
      if (!onboarded && !inOnboarding) {
        router.replace('/onboarding');
        return;
      }

      // Already onboarded: normal auth flow
      if (onboarded) {
        if (inOnboarding) {
          // Coming back from onboarding after completing it
          router.replace('/(auth)/login');
        } else if (!user && !inAuthGroup) {
          router.replace('/(auth)/login');
        } else if (user && inAuthGroup) {
          router.replace('/(tabs)/dashboard');
        }
      }
    };
    handleRouting();
  }, [user, loading, segments]);

  if (loading || !isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' }}>
        <ActivityIndicator size='large' color='#818CF8' />
      </View>
    );
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
  useEffect(() => {
    initDB();
    pruneSyncedTelemetry();
  }, []);

  useTelemetrySync();

  return (
    <AuthProvider>
      <SettingsProvider>
        <BatteryProvider>
          <BLEProvider>
            <RootNavigation />
          </BLEProvider>
        </BatteryProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

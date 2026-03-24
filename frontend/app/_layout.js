import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider, BatteryProvider, useAuth, SettingsProvider } from '../context';
import { BLEProvider } from '../context/BLEContext';
import { initDB, pruneSyncedTelemetry } from '../services/database';
import { useTelemetrySync } from '../hooks/useTelemetrySync';

const RootNavigation = () => {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)/dashboard');
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />

      <Stack.Screen 
        name="debug" 
        options={{ 
          headerShown: true, 
          title: 'Debug Screen',
          presentation: 'modal', 
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#00ff00',
        }} 
      />
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

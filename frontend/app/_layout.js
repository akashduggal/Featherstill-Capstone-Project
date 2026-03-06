import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider, BatteryProvider, useAuth, SettingsProvider } from '../context';
import { BLEProvider } from '../context/BLEContext';
import { initDB } from '../services/database';

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
      router.replace('/(tabs)/home');
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
};

export default function RootLayout() {
  
  useEffect(() => {
    initDB();
  }, []);

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

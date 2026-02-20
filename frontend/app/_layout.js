import { Stack } from 'expo-router';
import { AuthProvider, BatteryProvider } from '../context';

export default function RootLayout() {
  return (
    <AuthProvider>
      <BatteryProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </BatteryProvider>
    </AuthProvider>
  );
}

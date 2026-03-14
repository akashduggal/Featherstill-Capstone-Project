import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';

export default function TabsLayout() {
  const colorScheme = useColorScheme();

  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.cardBorder,
        },
      }}
    >
      <Tabs.Screen
        name="bluetooth"
        options={{
          title: "Bluetooth",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bluetooth" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name='dashboard'
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name='speedometer' size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name='settings' size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

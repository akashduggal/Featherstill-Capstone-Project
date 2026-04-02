import React from 'react';
import NetworkLogger from 'react-native-network-logger';
import { Stack } from 'expo-router';
import { useColorScheme, View } from 'react-native';
import { Colors } from '../constants/Colors';

export default function NetworkLoggerScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Stack.Screen 
        options={{ 
          title: 'Network Activity',
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
        }} 
      />
      <NetworkLogger theme={colorScheme} />
    </View>
  );
}
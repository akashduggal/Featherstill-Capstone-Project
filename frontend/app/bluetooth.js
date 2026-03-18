import React from 'react';
import { Stack } from 'expo-router';
import { BluetoothConnectionUI } from '../components/BluetoothConnectionUI';
import { Colors } from '../constants/Colors';

export default function BluetoothScreen() {
  const theme = "dark";
  const colors = Colors[theme];

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Bluetooth',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.tint,
          headerTitleStyle: { color: colors.text },
        }}
      />
      <BluetoothConnectionUI />
    </>
  );
}

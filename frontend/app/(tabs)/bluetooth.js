import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BluetoothConnectionUI } from '../../components/BluetoothConnectionUI';
import { Colors } from '../../constants/Colors';

export default function BluetoothScreen() {
  const theme = "dark";
  const colors = Colors[theme];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <BluetoothConnectionUI />
    </SafeAreaView>
  );
}
import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import Constants from 'expo-constants';
import { Colors } from '../constants/Colors'; 

export default function VersionDisplay() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const appVersion = Constants.expoConfig?.version || 'Unknown';

  return (
    <View style={styles.container}>
      <Text style={[styles.versionText, { color: theme.tabIconDefault }]}>
        Fetherstill v{appVersion}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionText: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
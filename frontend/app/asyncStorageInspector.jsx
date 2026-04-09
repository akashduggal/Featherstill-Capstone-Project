import React from 'react';
import { View, Text, StyleSheet, ScrollView, useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '../constants/Colors'; 

export default function AsyncStorageInspectorScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Async Storage', 
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          headerShadowVisible: false,
        }} 
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Stored Keys</Text>
          <Text style={styles.headerSub}>Inspect and manage local key-value pairs.</Text>
        </View>
      </ScrollView>

    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.surface, 
  },
  scrollContent: {
    paddingBottom: 100, 
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.text,
  },
  headerSub: {
    fontSize: 14,
    color: theme.icon,
    marginTop: 4,
  },
  emptyStateContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
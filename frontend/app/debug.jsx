import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack, Redirect } from 'expo-router';

export default function DebugScreen() {
  if (!__DEV__) {
    return <Redirect href="/" />;
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Debug Screen', headerBackTitle: 'Back' }} />

      <View style={styles.placeholderCard}>
        <Text style={styles.placeholderTitle}>SQLite Inspector (#270)</Text>
        <Text style={styles.body}>Implementation pending...</Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f', 
    padding: 16,
  },
  headerSection: {
    marginBottom: 24,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  statusText: {
    color: '#00ff00',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Courier',
  },
  subText: {
    color: '#888',
    marginTop: 4,
  },
  placeholderCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#444',
    borderStyle: 'dashed',
  },
  placeholderTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  body: {
    color: '#666',
  }
});
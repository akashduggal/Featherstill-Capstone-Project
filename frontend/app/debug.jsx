import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useColorScheme } from 'react-native';
import { Stack, Redirect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

export default function DebugScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const styles = getStyles(theme);

  if (!__DEV__) {
    return <Redirect href="/" />;
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Developer Menu', 
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          headerShadowVisible: false,
        }} 
      />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>System Tools</Text>
        <Text style={styles.headerSub}>Monitor local storage and network activity.</Text>
      </View>

      <View style={styles.menuGroup}>
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => router.push('/sqliteInspector')}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="server-outline" size={24} color={theme.info} />
            <Text style={styles.menuText}>SQLite Telemetry Buffer</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.icon} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => router.push('/networkLogger')}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="pulse-outline" size={24} color={theme.accent} />
            <Text style={styles.menuText}>Network Activity Logger</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.icon} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuItem, { borderBottomWidth: 0 }]} 
          onPress={() => router.push('/asyncStorageInspector')}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="layers-outline" size={24} color={theme.warning || '#f59e0b'} />
            <Text style={styles.menuText}>Async Storage Inspector</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.icon} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.surface, 
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
  menuGroup: {
    backgroundColor: theme.card,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.cardBorder,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.cardBorder,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuText: {
    fontSize: 16,
    color: theme.text,
  }
});
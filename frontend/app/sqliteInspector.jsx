import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '../constants/Colors';
import { getTelemetry } from '../services/database';

export default function SQLiteInspectorScreen() {
  const [telemetryData, setTelemetryData] = useState([]);
  const [error, setError] = useState(null);
  
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const styles = getStyles(theme);

  const fetchTelemetry = () => {
    try {
      setError(null);
      const result = getTelemetry()
      setTelemetryData(result);
    } catch (err) {
      console.error('Failed to fetch telemetry:', err);
      setError('Failed to query database.');
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  const renderItem = ({ item }) => {
    let displayPayload = item.payload;
    try {
      const parsedObj = JSON.parse(item.payload);
      displayPayload = JSON.stringify(parsedObj, null, 2);
    } catch (e) {
      // Fallback to raw string
    }

    return (
      <View style={styles.rowCard}>
        <View style={styles.rowHeader}>
          <Text style={styles.rowId}>Record ID: {item.id}</Text>
          <View style={[styles.badge, { backgroundColor: item.synced ? theme.success + '20' : theme.warning + '20' }]}>
            <Text style={[styles.badgeText, { color: item.synced ? theme.success : theme.warning }]}>
              {item.synced ? 'SYNCED' : 'PENDING'}
            </Text>
          </View>
        </View>
        <Text style={styles.timestamp}>Created At: {item.created_at}</Text>
        
        <View style={styles.payloadContainer}>
          <Text style={styles.payloadText}>{displayPayload}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'SQLite Inspector', 
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
        }} 
      />
      
      <View style={styles.toolbar}>
        <Text style={styles.recordCount}>{telemetryData.length} records found</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchTelemetry}>
          <Ionicons name="refresh" size={16} color={theme.accent} />
          <Text style={[styles.refreshText, { color: theme.accent }]}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={telemetryData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No telemetry found in the database.</Text>
        }
      />
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.surface,
  },
  actionRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderColor: theme.cardBorder,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: theme.surface,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  actionText: {
    fontWeight: '600',
    fontSize: 15,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  recordCount: {
    color: theme.icon,
    fontSize: 14,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refreshText: {
    fontWeight: '500',
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  rowCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  rowId: {
    fontWeight: '600',
    fontSize: 16,
    color: theme.text,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  timestamp: {
    color: theme.icon,
    fontSize: 13,
    marginBottom: 12,
  },
  payloadContainer: {
    backgroundColor: theme.background, 
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  payloadText: {
    color: theme.text,
    fontSize: 13,
    fontFamily: Fonts.mono, 
  },
  errorBox: {
    backgroundColor: theme.error + '20', // 20% opacity using hex
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.error,
  },
  errorText: {
    color: theme.error,
    fontWeight: '600',
  },
  emptyText: {
    color: theme.icon,
    textAlign: 'center',
    marginTop: 40,
  }
});
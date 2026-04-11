import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  useColorScheme, 
  ActivityIndicator, 
  RefreshControl ,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/Colors';

export default function AsyncStorageInspectorScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const styles = getStyles(theme);

  const [storageData, setStorageData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStorageData = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      
      const result = await AsyncStorage.multiGet(keys);
      
      const formattedData = result.map(([key, value]) => ({
        id: key,
        key: key,
        value: value,
      }));
      
      setStorageData(formattedData);
    } catch (error) {
      console.error("Failed to fetch AsyncStorage data:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStorageData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStorageData();
  }, []);

  const handleClearStorage = () => {
    Alert.alert(
      "Clear Async Storage",
      "Are you sure you want to wipe all local keys?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Wipe Data", 
          style: "destructive", 
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              fetchStorageData(); 
            } catch (error) {
              console.error("Failed to clear storage:", error);
              Alert.alert("Error", "Failed to clear local storage.");
            }
          }
        }
      ]
    );
  };

const formatStorageValue = (value) => {
    if (value === '') return '"" (Empty String)';
    if (!value) return 'null';
    
    try {
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      return value;
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.dataRow}>
      <Text style={styles.keyText} selectable>{item.key}</Text>
      <ScrollView horizontal bounces={false}>
        <Text style={styles.valueText} selectable>
          {formatStorageValue(item.value)}
        </Text>
      </ScrollView>
    </View>
  );

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

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stored Keys</Text>
        <Text style={styles.headerSub}>Pull to refresh. Text is selectable for copying.</Text>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.info} />
        </View>
      ) : (
        <FlatList
          data={storageData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              tintColor={theme.info} 
            />
          }
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={{ color: theme.icon }}>No data found in AsyncStorage.</Text>
            </View>
          }
        />
      )}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.clearButton} 
          onPress={handleClearStorage}
          activeOpacity={0.8}
        >
          <Text style={styles.clearButtonText}>Clear All Storage</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100, 
  },
  centerContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  dataRow: {
    backgroundColor: theme.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  keyText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 8,
  },
  valueText: {
    fontSize: 14,
    color: theme.text,
    fontFamily: 'Courier', 
    opacity: 0.8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32, 
    backgroundColor: theme.surface, 
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: theme.cardBorder,
  },
  clearButton: {
    backgroundColor: theme.error || '#ef4444', 
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
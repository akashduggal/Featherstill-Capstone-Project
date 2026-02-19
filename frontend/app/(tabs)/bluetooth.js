import { useBLE } from '../../context/BLEContext';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  Button
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BluetoothScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const {
    devices,
    scanning,
    error,
    permissionGranted,
    requestPermissions,
    scanForDevices,
    stopScan,
    connectToDevice,
    connectedDevice,
    bluetoothState
  } = useBLE();

  const [bleUnavailable, setBleUnavailable] = useState(null);
  

  useEffect(() => {
    try {
      require('react-native-ble-plx');
    } catch {
      setBleUnavailable(true);
    }
    requestPermissions();
  }, [requestPermissions]);

  useEffect(() => {
    if (connectedDevice) {
      router.replace('/(tabs)');
    }
  }, [connectedDevice]);

  const handleConnect = async (device) => {
    await connectToDevice(device.id);
  };

  const renderItem = ({ item }) => {
    const displayName = item.name ?? item.localName ?? 'Unknown device';
    return (
      <TouchableOpacity onPress={() => handleConnect(item)} style={styles.deviceCard}>
          <View style={styles.deviceRow}>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.deviceMeta}>
                {item.rssi != null ? `RSSI: ${item.rssi}` : ''} · {item.id}
              </Text>
            </View>
            <Button
              title="Connect"
              onPress={() => handleConnect(item)}
            />
          </View>
      </TouchableOpacity>
    );
  };

  const listHeader = (
    <View style={styles.header}>
      <Text style={styles.title}>
        Bluetooth devices
      </Text>
      <Text style={styles.subtitle}>
        Scan for ESP32-Mock-Streamer.
      </Text>
      {bluetoothState === 'PoweredOff' && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>Bluetooth is turned off. Please turn it on to scan for devices.</Text>
        </View>
      )}
      {bleUnavailable ? (
        <View style={styles.devBuildCard}>
          <Text style={styles.devBuildTitle}>Bluetooth not available in Expo Go</Text>
          <Text style={styles.devBuildText}>
            BLE requires a development build. Run:{'\n'}
            <Text style={styles.code}>npx expo run:android</Text>
            {'\n'}or{' '}
            <Text style={styles.code}>npx expo run:ios</Text>
          </Text>
        </View>
      ) : null}
      {error && !bleUnavailable ? (
        <View style={[styles.errorBanner]}>
          <Text style={[styles.errorText]}>{error}</Text>
        </View>
      ) : null}
      {!bleUnavailable ? (
        <View style={styles.buttonRow}>
          <Button
            title={scanning ? 'Scanning…' : 'Start scan'}
            onPress={scanning ? stopScan : scanForDevices}
            disabled={permissionGranted === false || bluetoothState === 'PoweredOff'}
          />
        </View>
      ) : null}
      <View style={styles.goHomeRow}>
        <Button
          title="Go to Home"
          onPress={() => router.push('/(tabs)')}
        />
      </View>
    </View>
  );

  if (permissionGranted === null && Platform.OS === 'android') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
          <Text style={styles.centeredText}>Requesting permissions…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !scanning && devices.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                No devices yet. Tap &quot;Start scan&quot; to find nearby BLE devices.
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.8,
    marginBottom: 16,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'red',
    backgroundColor: '#ffdddd',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: 'red',
  },
  devBuildCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  devBuildTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  devBuildText: {
    fontSize: 14,
    opacity: 0.9,
  },
  code: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
  },
  buttonRow: {
    marginBottom: 12,
  },
  scanButton: {
    marginBottom: 8,
  },
  goHomeRow: {
    marginTop: 8,
  },
  deviceCard: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  deviceMeta: {
    fontSize: 12,
    opacity: 0.7,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 16,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  centeredText: {
    opacity: 0.8,
  },
});

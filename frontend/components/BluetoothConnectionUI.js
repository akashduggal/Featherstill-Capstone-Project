import React, { useContext, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, FlatList, PermissionsAndroid, Platform, StyleSheet, ActivityIndicator } from 'react-native';
import { BLEContext } from '../context/BLEContext';
import { Typography, Button, Card, SettingsDropdown, Modal } from './';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';

async function requestPermissions() {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);
    if (
      granted['android.permission.BLUETOOTH_SCAN'] !== 'granted' ||
      granted['android.permission.BLUETOOTH_CONNECT'] !== 'granted' ||
      granted['android.permission.ACCESS_FINE_LOCATION'] !== 'granted'
    ) {
      console.log('Some Bluetooth permissions denied');
    }
  }
}

export const BluetoothConnectionUI = () => {
  const {
    devices,
    scanForDevices,
    connectToDevice,
    isScanning,
    previouslyConnectedDevices,
  } = useContext(BLEContext);
  const router = useRouter();
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState(0);
  const [hasScanned, setHasScanned] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const theme = "dark";
  const colors = Colors[theme];

  const getBleErrorUserMessage = (error) => {
    if (!error || !error.reason) {
      return 'An unknown error occurred. Please try again.';
    }
  
    if (error.reason.includes('status 133') || error.reason.includes('GATT_ERROR')) {
      return 'Connection failed. Please ensure the device is nearby, turned on, and not connected to another application.';
    }
  
    if (error.reason.toLowerCase().includes('was disconnected')) {
      return 'The device disconnected unexpectedly. Please try connecting again.';
    }
  
    return 'Could not connect to the device. Please try again.';
  };

  useEffect(() => {
    requestPermissions();
  }, []);

  const handleConnect = (device) => {
    setIsConnecting(true);
    connectToDevice(
      device,
      () => {
        setIsConnecting(false);
        router.push('/dashboard');
      },
      (error) => {
        setIsConnecting(false);
        setModalMessage(getBleErrorUserMessage(error));
        setModalVisible(true);
      }
    );
  };

  const renderItem = ({ item }) => {
    const isAlreadyPaired = previouslyConnectedDevices.some(d => d.name === item.name);

    return (
      <Card colors={colors}>
        <View style={styles.cardContentRow}>
          <Typography variant="h4" style={{ color: colors.text }}>{item.name}</Typography>
          {isAlreadyPaired && (
            <Typography style={[styles.pairedText, { color: colors.tint }]}>Paired</Typography>
          )}
        </View>
        {!isAlreadyPaired && (
          <Button title="Connect" loading={isConnecting} onPress={() => handleConnect(item)} style={styles.connectButton} />
        )}
      </Card>
    );
  };

  const deviceOptions = previouslyConnectedDevices.map(d => d.name);

  const handleScan = () => {
    setHasScanned(true);
    scanForDevices();
  };

  const filteredDevices = devices.filter(device => device.name && device.name.includes('ESP32_'));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {previouslyConnectedDevices.length > 0 && (
        <SettingsDropdown
          label="Connected Modules List"
          colors={colors}
          options={deviceOptions}
          selectedIndex={selectedDeviceIndex}
          onSelect={setSelectedDeviceIndex}
        />
      )}

      {previouslyConnectedDevices.length > 0 && (
        <Button
          title="Connect"
          loading={isConnecting}
          onPress={() => {
            const selectedDevice = previouslyConnectedDevices[selectedDeviceIndex];
            handleConnect(selectedDevice);
          }}
          style={styles.connectButton}
        />
      )}

      <View style={styles.dividerContainer}>
        <View style={[styles.dividerLine, { backgroundColor: colors.cardBorder }]} />
        <Typography style={[styles.dividerText, { color: colors.icon }]}>OR</Typography>
        <View style={[styles.dividerLine, { backgroundColor: colors.cardBorder }]} />
      </View>

      <Button title={isScanning ? 'Scanning...' : 'Scan for New Modules'} onPress={handleScan} disabled={isScanning} style={styles.scanButton} />

      {isScanning ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.activityIndicator} />
      ) : (
        <>
          {hasScanned && filteredDevices.length > 0 && (
            <Typography style={[styles.listLabel, { color: colors.text }]}>
              Scanned Devices ({filteredDevices.length})
            </Typography>
          )}
          <FlatList
            data={filteredDevices}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              hasScanned ? (
                <Typography style={[styles.emptyText, { color: colors.text }]}>No new modules found.</Typography>
              ) : null
            }
          />
        </>
      )}

      <Modal
        visible={modalVisible}
        title="Connection Failed"
        message={modalMessage}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  listLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 20,
  },
  cardContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pairedText: {
    fontSize: 14,
    fontWeight: '600',
  },
  connectButton: {
    marginTop: 10,
    marginBottom: 20,
  },
  scanButton: {
    marginBottom: 20,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 12,
    fontWeight: '600',
  },
  activityIndicator: {
    marginVertical: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
  },
});

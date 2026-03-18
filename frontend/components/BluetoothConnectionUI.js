import React, { useContext, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, FlatList, PermissionsAndroid, Platform, StyleSheet } from 'react-native';
import { BLEContext } from '../context/BLEContext';
import { Typography, Button, Card, Modal } from './';
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
    previouslyConnectedDevices,
  } = useContext(BLEContext);
  const router = useRouter();
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

  const handleScan = () => {
    scanForDevices();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Button title='Scan for Modules' onPress={handleScan} style={styles.scanButton} />

      <FlatList
        data={devices}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />

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
});

import React, { useContext, useEffect } from 'react';
import { View, Text, FlatList, Button, PermissionsAndroid, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BLEContext } from '../../context/BLEContext';

async function requestPermissions() {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);
    if (
      granted['android.permission.BLUETOOTH_SCAN'] === 'granted' &&
      granted['android.permission.BLUETOOTH_CONNECT'] === 'granted' &&
      granted['android.permission.ACCESS_FINE_LOCATION'] === 'granted'
    ) {
      console.log('All Bluetooth permissions granted');
    } else {
      console.log('Some Bluetooth permissions denied');
    }
  }
}

export default function BluetoothScreen() {
  const { devices, connectedDevice, scanForDevices, connectToDevice, disconnectFromDevice } = useContext(BLEContext);

  useEffect(() => {
    requestPermissions();
  }, []);

  const renderItem = ({ item }) => (
    <View style={{ padding: 10 }}>
      <Text>{item.name}</Text>
      <Button title="Connect" onPress={() => connectToDevice(item)} />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 20 }}>
        {connectedDevice ? (
          <View>
            <Text>Connected to: {connectedDevice.name}</Text>
            <Button title="Disconnect" onPress={disconnectFromDevice} />
          </View>
        ) : (
          <View>
            <Text>Available Devices:</Text>
            <FlatList
              data={devices}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
            />
            <Button title="Scan" onPress={scanForDevices} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
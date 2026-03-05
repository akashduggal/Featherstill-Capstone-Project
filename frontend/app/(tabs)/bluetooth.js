import React, { useContext, useEffect } from 'react';
import { View, Text, FlatList, Button, PermissionsAndroid, Platform } from 'react-native';
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
  const { devices, connectedDevice, telemetryData, scanForDevices, connectToDevice, disconnectFromDevice } = useContext(BLEContext);

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
    <View style={{ flex: 1, padding: 20 }}>
      {connectedDevice ? (
        <View>
          <Text>Connected to: {connectedDevice.name}</Text>
          <Button title="Disconnect" onPress={disconnectFromDevice} />
          {telemetryData && (
            <View style={{ marginTop: 20 }}>
              <Text>Telemetry Data:</Text>
              <Text>Timestamp: {telemetryData.timestamp_s}s</Text>
              <Text>Pack Voltage: {telemetryData.pack_total_mv}mV</Text>
              <Text>Current: {telemetryData.current_ma}mA</Text>
              <Text>SoC: {telemetryData.soc}%</Text>
              <Text>Temperature (TS1): {telemetryData.temp_ts1_c_x100 / 100}°C</Text>
              <Text>Temperature (Internal): {telemetryData.temp_int_c_x100 / 100}°C</Text>
              <Text>Cell Voltages (mV):</Text>
              <FlatList
                data={telemetryData.cell_mv}
                renderItem={({ item, index }) => <Text>  Cell {index + 1}: {item}mV</Text>}
                keyExtractor={(item, index) => index.toString()}
              />
            </View>
          )}
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
  );
}
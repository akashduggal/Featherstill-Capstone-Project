import React, { useContext } from 'react';
import { View, Text, FlatList, Button } from 'react-native';
import { BLEContext } from '../../context/BLEContext';

export default function BluetoothScreen() {
  const { devices, connectedDevice, scanForDevices, connectToDevice, disconnectFromDevice } = useContext(BLEContext);

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
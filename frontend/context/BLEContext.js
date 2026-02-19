import { Buffer } from 'buffer';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';

// Define the shape of the context


const BLEContext = createContext(undefined);

export const useBLE = () => {
  const context = useContext(BLEContext);
  if (!context) {
    throw new Error('useBLE must be used within a BLEProvider');
  }
  return context;
};

export const BLEProvider = ({ children }) => {
  const [manager, setManager] = useState(null);
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(null);
  const [receivedData, setReceivedData] = useState('');
  const [error, setError] = useState(null);
  const [bluetoothState, setBluetoothState] = useState('unknown');
  
  const devicesMap = useRef(new Map());

  useEffect(() => {
    const bleManager = new BleManager();
    setManager(bleManager);

    const subscription = bleManager.onStateChange((state) => {
      setBluetoothState(state);
    }, true);

    return () => {
      subscription.remove();
      bleManager.stopDeviceScan();
      bleManager.destroy();
    };
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const apiLevel = Platform.Version;
        // @ts-ignore
        if (apiLevel >= 31) {
          const result = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ]);
          const granted = Object.values(result).every(
            (r) => r === PermissionsAndroid.RESULTS.GRANTED
          );
          setPermissionGranted(granted);
          return granted;
        } else {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          );
          setPermissionGranted(granted === PermissionsAndroid.RESULTS.GRANTED);
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      } catch (err) {
        console.warn(err);
        setPermissionGranted(false);
        return false;
      }
    } else {
      setPermissionGranted(true);
      return true;
    }
  };

  const scanForDevices = async () => {
    if (!manager) return;
    
    // Ensure permissions
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) {
      setError('Missing permissions');
      return;
    }

    setScanning(true);
    setError(null);
    devicesMap.current.clear();
    setDevices([]);

    manager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
      if (error) {
        console.log('Scan error:', error);
        setError(error.message);
        setScanning(false);
        return;
      }

      if (device && (device.name?.includes('ESP32') || device.localName?.includes('ESP32'))) {
        if (!devicesMap.current.has(device.id)) {
          devicesMap.current.set(device.id, device);
          setDevices(Array.from(devicesMap.current.values()));
        }
      }
    });

    // Stop scan after 10 seconds
    setTimeout(() => {
      stopScan();
    }, 10000);
  };

  const stopScan = () => {
    manager?.stopDeviceScan();
    setScanning(false);
  };

  const connectToDevice = async (deviceId) => {
    if (!manager) return;

    try {
      stopScan();
      setError(null);
      
      console.log(`Connecting to ${deviceId}...`);
      const device = await manager.connectToDevice(deviceId);
      setConnectedDevice(device);
      console.log('Connected, discovering services...');

      await device.discoverAllServicesAndCharacteristics();
      console.log('Services discovered');

      // Find a characteristic to subscribe to
      // We look for any characteristic that supports notify or indicate
      const services = await device.services();
      let subscriptionSetup = false;

      for (const service of services) {
        const characteristics = await service.characteristics();
        for (const char of characteristics) {
          if (char.isNotifiable || char.isIndicatable) {
            device.monitorCharacteristicForService(
              service.uuid,
              char.uuid,
              (error, characteristic) => {
                if (error) {
                  console.log('Monitor error:', error);
                  return;
                }
                if (characteristic?.value) {
                  const rawValue = Buffer.from(characteristic.value, 'base64').toString('utf-8');
                  console.log('Received data:', rawValue);
                  setReceivedData(rawValue);
                }
              }
            );
            // subscriptionSetup = true;
            // break; // Stop after finding first notifiable characteristic
          }
        }
      }

      if (!subscriptionSetup) {
        setError('No notifiable characteristic found');
      }

    } catch (e) {
      console.log('Connection error:', e);
      setError(e.message || 'Connection failed');
      setConnectedDevice(null);
    }
  };

  const disconnectFromDevice = async () => {
    if (connectedDevice) {
      await connectedDevice.cancelConnection();
      setConnectedDevice(null);
      setReceivedData('');
    }
  };

  return (
    <BLEContext.Provider
      value={{
        manager,
        devices,
        connectedDevice,
        scanning,
        permissionGranted,
        receivedData,
        error,
        bluetoothState,
        requestPermissions,
        scanForDevices,
        stopScan,
        connectToDevice,
        disconnectFromDevice,
      }}
    >
      {children}
    </BLEContext.Provider>
  );
};

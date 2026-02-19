import React, { createContext, useState, useEffect } from 'react';
import { BleManager } from 'react-native-ble-plx';

export const BLEContext = createContext();

export const BLEProvider = ({ children }) => {
  const [manager] = useState(new BleManager());
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);

  useEffect(() => {
    const subscription = manager.onStateChange((state) => {
      if (state === 'PoweredOn') {
        scanForDevices();
      }
    }, true);
    return () => subscription.remove();
  }, [manager]);

  const scanForDevices = () => {
    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log(error);
        return;
      }
      if (device && device.name) {
        setDevices((prevDevices) => {
          if (!prevDevices.some((d) => d.id === device.id)) {
            return [...prevDevices, device];
          }
          return prevDevices;
        });
      }
    });
  };

  const connectToDevice = async (device) => {
    try {
      await manager.stopDeviceScan();
      const connected = await device.connect();
      setConnectedDevice(connected);
    } catch (error) {
      console.log(error);
    }
  };

  const disconnectFromDevice = async () => {
    if (connectedDevice) {
      await connectedDevice.cancelConnection();
      setConnectedDevice(null);
    }
  };

  return (
    <BLEContext.Provider
      value={{
        devices,
        connectedDevice,
        scanForDevices,
        connectToDevice,
        disconnectFromDevice,
      }}
    >
      {children}
    </BLEContext.Provider>
  );
};
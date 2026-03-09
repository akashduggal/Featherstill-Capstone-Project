import React, { createContext, useState, useEffect, useRef } from 'react';
import { BleManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const BLEContext = createContext();

const parseTelemetryData = (buffer) => {
  if (buffer.length < 49) {
    return null;
  }

  const data = {};
  let offset = 0;

  data.timestamp_s = buffer.readUInt32LE(offset);
  offset += 4;

  data.cell_mv = [];
  for (let i = 0; i < 16; i++) {
    data.cell_mv.push(buffer.readUInt16LE(offset));
    offset += 2;
  }

  data.pack_total_mv = buffer.readUInt16LE(offset);
  offset += 2;

  data.pack_ld_mv = buffer.readUInt16LE(offset);
  offset += 2;

  data.pack_sum_active_mv = buffer.readUInt16LE(offset);
  offset += 2;

  data.current_ma = buffer.readInt16LE(offset);
  offset += 2;

  data.temp_ts1_c_x100 = buffer.readInt16LE(offset);
  offset += 2;

  data.temp_int_c_x100 = buffer.readInt16LE(offset);
  offset += 2;

  data.soc = buffer.readUInt8(offset);

  return data;
};

export const BLEProvider = ({ children }) => {
  const [manager] = useState(new BleManager());
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [telemetryData, setTelemetryData] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [previouslyConnectedDevices, setPreviouslyConnectedDevices] = useState([]);
  const dataBuffer = useRef(Buffer.alloc(0));

  useEffect(() => {
    const subscription = manager.onStateChange((state) => {
      if (state === 'PoweredOn') {
        loadPreviouslyConnectedDevices();
      }
    }, true);
    return () => subscription.remove();
  }, [manager]);

  const loadPreviouslyConnectedDevices = async () => {
    try {
      const storedDevices = await AsyncStorage.getItem('previouslyConnectedDevices');
      if (storedDevices) {
        setPreviouslyConnectedDevices(JSON.parse(storedDevices));
      }
    } catch (error) {
      console.log('Failed to load previously connected devices.', error);
    }
  };

  const addPreviouslyConnectedDevice = async (device) => {
    try {
      const currentDevices = previouslyConnectedDevices;
      if (!currentDevices.some(d => d.id === device.id)) {
        const updatedDevices = [...currentDevices, device];
        setPreviouslyConnectedDevices(updatedDevices);
        await AsyncStorage.setItem('previouslyConnectedDevices', JSON.stringify(updatedDevices));
      }
    } catch (error) {
      console.log('Failed to save previously connected device.', error);
    }
  };

  const scanForDevices = () => {
    setIsScanning(true);
    setDevices([]);
    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log(error);
        setIsScanning(false);
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
    setTimeout(() => {
      manager.stopDeviceScan();
      setIsScanning(false);
    }, 5000);
  };

  const connectToDevice = async (device, onConnect, onFail) => {
    try {
      await manager.stopDeviceScan();
      setIsScanning(false);

      const connected = device.connect
        ? await device.connect()
        : await manager.connectToDevice(device.id);

      setConnectedDevice(connected);
      addPreviouslyConnectedDevice({ id: connected.id, name: connected.name });
      if (onConnect) {
        onConnect();
      }

      await connected.discoverAllServicesAndCharacteristics();
      const services = await connected.services();

      for (const service of services) {
        const characteristics = await service.characteristics();
        for (const characteristic of characteristics) {
          if (characteristic.isNotifiable) {
            characteristic.monitor((error, char) => {
              if (error) {
                return;
              }
              if (char && char.value) {
                const newChunk = Buffer.from(char.value, 'base64');
                dataBuffer.current = Buffer.concat([dataBuffer.current, newChunk]);

                while (dataBuffer.current.length >= 49) {
                  const packet = dataBuffer.current.slice(0, 49);
                  const parsedData = parseTelemetryData(packet);

                  if (parsedData) {
                    setTelemetryData(parsedData);
                  }
                  dataBuffer.current = dataBuffer.current.slice(49);
                }
              }
            });
          }
        }
      }
    } catch (error) {
      console.log(error);
      if (onFail) {
        onFail(error);
      }
    }
  };

  const disconnectFromDevice = async () => {
    if (connectedDevice) {
      await connectedDevice.cancelConnection();
      setConnectedDevice(null);
      setTelemetryData(null);
      dataBuffer.current = Buffer.alloc(0);
    }
  };

  return (
    <BLEContext.Provider
      value={{
        devices,
        connectedDevice,
        telemetryData,
        isScanning,
        previouslyConnectedDevices,
        scanForDevices,
        connectToDevice,
        disconnectFromDevice,
      }}
    >
      {children}
    </BLEContext.Provider>
  );
};

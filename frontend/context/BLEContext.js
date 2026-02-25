import React, { createContext, useState, useEffect } from 'react';
import { BleManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer';

export const BLEContext = createContext();

const parseTelemetryData = (buffer) => {
  if (buffer.length < 49) {
    return null; // Incomplete packet
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

      await connected.discoverAllServicesAndCharacteristics();
      const services = await connected.services();

      for (const service of services) {
        const characteristics = await service.characteristics();
        for (const characteristic of characteristics) {
          if (characteristic.isNotifiable) {
            console.log(`Subscribing to characteristic ${characteristic.uuid}`);
            characteristic.monitor((error, char) => {
              if (error) {
                console.log(`Error monitoring characteristic ${characteristic.uuid}:`, error);
                return;
              }
              if (char && char.value) {
                const buffer = Buffer.from(char.value, 'base64');
                const parsedData = parseTelemetryData(buffer);
                if (parsedData) {
                  console.log('Received parsed data:', parsedData);
                  setTelemetryData(parsedData);
                } else {
                  console.log('Received raw data (incomplete packet):', buffer.toString('hex'));
                }
              }
            });
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const disconnectFromDevice = async () => {
    if (connectedDevice) {
      await connectedDevice.cancelConnection();
      setConnectedDevice(null);
      setTelemetryData(null);
    }
  };

  return (
    <BLEContext.Provider
      value={{
        devices,
        connectedDevice,
        telemetryData,
        scanForDevices,
        connectToDevice,
        disconnectFromDevice,
      }}
    >
      {children}
    </BLEContext.Provider>
  );
};
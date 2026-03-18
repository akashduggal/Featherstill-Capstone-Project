import React, { createContext, useState, useEffect, useRef } from 'react';
import { BleManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import { insertTelemetry } from "../services/database"
import AsyncStorage from '@react-native-async-storage/async-storage';


export const BLEContext = createContext();

const OTA_SERVICE_UUID = 'f0debc9a-7856-3412-7856-341278563412';
const OTA_CONTROL_UUID = 'f0debc9a-7856-3412-7856-341278563413';
const OTA_DATA_UUID = 'f0debc9a-7856-3412-7856-341278563414';
const OTA_STATUS_UUID = 'f0debc9a-7856-3412-7856-341278563415';

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
  const [isOtaSupported, setIsOtaSupported] = useState(false);
  const [otaStatus, setOtaStatus] = useState('idle');
  const [otaProgress, setOtaProgress] = useState(0);
  const dataBuffer = useRef(Buffer.alloc(0));
  const otaCharacteristics = useRef({});

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
      let otaServiceFound = false;

      for (const service of services) {
        const characteristics = await service.characteristics();
        if (service.uuid === OTA_SERVICE_UUID) {
          otaServiceFound = true;
          for (const characteristic of characteristics) {
            if (characteristic.uuid === OTA_CONTROL_UUID) {
              otaCharacteristics.current.control = characteristic;
            } else if (characteristic.uuid === OTA_DATA_UUID) {
              otaCharacteristics.current.data = characteristic;
            } else if (characteristic.uuid === OTA_STATUS_UUID) {
              otaCharacteristics.current.status = characteristic;
            }
          }
        }

        for (const characteristic of characteristics) {
          if (characteristic.isNotifiable && service.uuid !== OTA_SERVICE_UUID) {
            console.log(`Subscribing to telemetry characteristic ${characteristic.uuid}`);
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
                    const dbPayload = {
                      ...parsedData,
                      ts: parsedData.timestamp_s * 1000 
                    };
                    
                    insertTelemetry(dbPayload);
                  } else {
                    console.log('Received raw data (incomplete packet):', packet.toString('hex'));
                  }
                  dataBuffer.current = dataBuffer.current.slice(49);
                }
              }
            });
          }
        }
      }

      if (otaServiceFound && otaCharacteristics.current.control && otaCharacteristics.current.data && otaCharacteristics.current.status) {
        setIsOtaSupported(true);
        console.log('OTA service is supported on this device.');
      } else {
        setIsOtaSupported(false);
        console.log('OTA service not supported on this device.');
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
      setIsOtaSupported(false);
      setOtaStatus('idle');
      setOtaProgress(0);
      otaCharacteristics.current = {};
    }
  };

  const startOta = async (firmware) => {
    if (!isOtaSupported || !otaCharacteristics.current.control || !otaCharacteristics.current.status || !otaCharacteristics.current.data) {
      console.log('OTA not supported or characteristics not found.');
      setOtaStatus('error');
      return;
    }

    setOtaStatus('starting');
    setOtaProgress(0);

    const firmwareSize = firmware.length;
    let statusMonitor = null;
    let statusQueue = [];
    let statusResolver = null;

    const processStatusQueue = () => {
      if (statusResolver && statusQueue.length > 0) {
        const nextStatus = statusQueue.shift();
        if (nextStatus.error) {
          statusResolver.reject(nextStatus.error);
        } else {
          statusResolver.resolve(nextStatus.status);
        }
        statusResolver = null;
      }
    };

    const waitForNextStatus = (timeout = 10000) => {
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => reject(new Error('Timeout waiting for OTA status')), timeout);
        statusResolver = {
          resolve: (status) => {
            clearTimeout(timeoutId);
            resolve(status);
          },
          reject: (error) => {
            clearTimeout(timeoutId);
            reject(error);
          },
        };
        processStatusQueue();
      });
    };

    try {
      statusMonitor = otaCharacteristics.current.status.monitor((error, characteristic) => {
        if (error) {
          console.log('OTA status monitor error:', error);
          statusQueue.push({ error });
        } else if (characteristic?.value) {
          const status = Buffer.from(characteristic.value, 'base64').toString('utf8');
          console.log('OTA Status Update:', status);
          statusQueue.push({ status });
        }
        processStatusQueue();
      });

      // 1. Send START command
      const startPayload = Buffer.alloc(5);
      startPayload.writeUInt8(0x01, 0); // START command
      startPayload.writeUInt32LE(firmwareSize, 1);
      await otaCharacteristics.current.control.writeWithoutResponse(startPayload.toString('base64'));
      console.log('Start OTA command sent.');

      // 2. Wait for READY response
      let status = await waitForNextStatus();
      if (status !== 'READY') {
        throw new Error(`Expected READY, but got ${status}`);
      }
      console.log('Device is READY. Starting transfer...');
      setOtaStatus('in_progress');

      // 3. Send firmware in batches with acknowledgement and retries
      const chunkSize = 244;
      const batchSize = 25;
      const maxRetries = 5;
      let offset = 0;

      while (offset < firmwareSize) {
        let attempt = 0;
        let batchAcknowledged = false;
        const batchStartOffset = offset;

        while (attempt < maxRetries && !batchAcknowledged) {
          if (attempt > 0) {
            console.log(`Retrying batch from offset ${batchStartOffset}. Attempt ${attempt + 1}/${maxRetries}`);
            offset = batchStartOffset;
            setOtaProgress(Math.round((offset / firmwareSize) * 100));
          }
          attempt++;

          const batchEndOffset = Math.min(firmwareSize, offset + chunkSize * batchSize);
          while (offset < batchEndOffset) {
            const chunkEnd = Math.min(offset + chunkSize, firmwareSize);
            const chunk = firmware.slice(offset, chunkEnd);
            await otaCharacteristics.current.data.writeWithoutResponse(chunk.toString('base64'));
            offset += chunk.length;
            setOtaProgress(Math.round((offset / firmwareSize) * 100));
          }

          const expectedAck = `RX:${offset}`;
          status = await waitForNextStatus(3000); 

          if (status === expectedAck) {
            console.log(`Batch acknowledged at offset ${offset}.`);
            batchAcknowledged = true;
          } else {
            console.log(`ACK mismatch. Expected ${expectedAck}, got ${status}.`);
            if (status.startsWith('ERROR')) throw new Error(status);
          }
        }

        if (!batchAcknowledged) {
          throw new Error(`Failed to get ACK for batch at offset ${batchStartOffset} after ${maxRetries} attempts.`);
        }
      }

      // 4. Send FINISH command
      const endPayload = Buffer.alloc(1);
      endPayload.writeUInt8(0x02, 0); // FINISH command
      await otaCharacteristics.current.control.writeWithoutResponse(endPayload.toString('base64'));
      console.log('End OTA command sent.');

      // 5. Wait for SUCCESS
      status = await waitForNextStatus();
      if (status === 'SUCCESS') {
        console.log('OTA completed successfully.');
        setOtaStatus('success');
      } else {
        throw new Error(`Expected SUCCESS, but got ${status}`);
      }

    } catch (error) {
      console.log('OTA process failed:', error.message);
      setOtaStatus('error');
      const abortPayload = Buffer.alloc(1);
      abortPayload.writeUInt8(0x03, 0); // ABORT command
      try {
        await otaCharacteristics.current.control.writeWithoutResponse(abortPayload.toString('base64'));
        console.log('Abort OTA command sent.');
      } catch (abortError) {
        console.log('Failed to send Abort OTA command:', abortError);
      }
    } finally {
      if (statusMonitor) {
        statusMonitor.remove();
        console.log('OTA status monitor removed.');
      }
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
        isOtaSupported,
        otaStatus,
        otaProgress,
        scanForDevices,
        connectToDevice,
        disconnectFromDevice,
        startOta,
      }}
    >
      {children}
    </BLEContext.Provider>
  );
};
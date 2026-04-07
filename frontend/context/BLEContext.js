import React, { createContext, useState, useEffect, useRef } from 'react';
import { BleManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import { insertTelemetry } from "../services/database"
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useAuth} from './AuthContext'
import { formatBmsPayload } from '../utils/commonUtils';

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
  const otaRebootExpected = useRef(false);
  const otaResumeInfo = useRef(null); // To store { chunk_count, bytes_received }
  const statusResolver = useRef(null); // For the OTA status promise
  const otaAbortRequested = useRef(false);
  const deviceDisconnectSubscription = useRef(null);
  const { user } = useAuth();
  const otaStatusMonitorSubscription = useRef(null);
  const negotiatedMtu = useRef(23);

  const cleanupConnectionState = () => {
    if (deviceDisconnectSubscription.current) {
      deviceDisconnectSubscription.current.remove();
      deviceDisconnectSubscription.current = null;
    }
    if (otaStatusMonitorSubscription.current) {
      otaStatusMonitorSubscription.current.remove();
      otaStatusMonitorSubscription.current = null;
    }
    setConnectedDevice(null);
    setTelemetryData(null);
    dataBuffer.current = Buffer.alloc(0);
    setIsOtaSupported(false);
    setOtaProgress(0);
    otaCharacteristics.current = {};
  };

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
    setOtaStatus('idle');
    setOtaProgress(0);
    otaRebootExpected.current = false;

    try {
      await manager.stopDeviceScan();
      setIsScanning(false);

      const connected = device.connect
        ? await device.connect()
        : await manager.connectToDevice(device.id);

      console.log(`[BLE] Connected to ${connected.name}. Requesting MTU...`);
      const deviceWithHighMTU = await connected.requestMTU(247); // 244 payload + 3 header
      console.log(`[BLE] MTU negotiated to: ${deviceWithHighMTU.mtu}`);
      negotiatedMtu.current = deviceWithHighMTU.mtu;

      if (deviceDisconnectSubscription.current) {
        deviceDisconnectSubscription.current.remove();
      }
      deviceDisconnectSubscription.current = connected.onDisconnected((error, disconnectedDevice) => {
        console.log(`Device ${disconnectedDevice.id} disconnected. Reboot expected: ${otaRebootExpected.current}`, error);
        cleanupConnectionState();
      });

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
          console.log('[BLE] OTA Service found.');
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
                      moduleId: "ESP32",
                      payload: formatBmsPayload(parsedData),
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
        if (otaStatusMonitorSubscription.current) {
          otaStatusMonitorSubscription.current.remove();
        }
        otaStatusMonitorSubscription.current = otaCharacteristics.current.status.monitor((error, characteristic) => {
          // This is the main handler for all status updates during the OTA process
          if (error) {
            if (error.message.includes('Operation was cancelled')) {
              console.log('[OTA] Status monitor operation was cancelled, likely due to device disconnect.');
            } else {
              console.error('[OTA] Status monitor error:', error);
            }
            return;
          }
          if (characteristic?.value) {
            const status = Buffer.from(characteristic.value, 'base64').toString('utf8');
            console.log(`[OTA] Status Update Received: "${status}"`);
            // The waitForStatus promise resolver will be called from here
            if (statusResolver.current) {
              statusResolver.current.resolve(status);
            }
          }
        });
        console.log('[BLE] Subscribed to OTA Status notifications.');

        // As per the guide, read the status immediately after subscribing to check for a resume state
        console.log('[BLE] Reading initial OTA status for resume check...');
        const initialStatusChar = await otaCharacteristics.current.status.read();
        if (initialStatusChar?.value) {
          const initialStatus = Buffer.from(initialStatusChar.value, 'base64').toString('utf8');
          console.log(`[BLE] Initial OTA Status is: "${initialStatus}"`);
          if (initialStatus.startsWith('RESUME_AT:')) {
            const parts = initialStatus.split(':');
            otaResumeInfo.current = {
              chunk_count: parseInt(parts[1], 10),
              bytes_received: parseInt(parts[2], 10),
            };
            console.log(`[BLE] Stored resume information:`, otaResumeInfo.current);
          }
        }

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
      otaRebootExpected.current = false; // Manual disconnect
      await connectedDevice.cancelConnection();
    } else {
      cleanupConnectionState();
    }
  };

  const startOta = async (firmware, version) => {
    if (!isOtaSupported || !otaCharacteristics.current.control || !otaCharacteristics.current.status || !otaCharacteristics.current.data) {
      console.error('[OTA] Error: OTA not supported or characteristics not found.');
      setOtaStatus('error');
      return;
    }

    const firmwareSize = firmware.length;
    console.log(`[OTA] Starting update. Firmware size: ${firmwareSize} bytes.`);
    otaAbortRequested.current = false;
    setOtaStatus('starting');
    setOtaProgress(0);

    // This is a simplified promise-based wrapper around the status monitor
    const waitForStatus = (predicate, timeout = 30000) => {
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          statusResolver.current = null;
          reject(new Error(`Timeout waiting for OTA status.`));
        }, timeout);

        statusResolver.current = {
          resolve: (status) => {
            try {
              if (predicate(status)) {
                clearTimeout(timeoutId);
                statusResolver.current = null;
                resolve(status);
              }
            } catch (e) {
              clearTimeout(timeoutId);
              statusResolver.current = null;
              reject(e);
            }
          },
        };
      });
    };

    try {
      let offset = 0;
      let chunkCount = 0;

      // 1. Check for a resume state
      if (otaResumeInfo.current && otaResumeInfo.current.bytes_received < firmwareSize) {
        console.log(`[OTA] Resuming update from offset: ${otaResumeInfo.current.bytes_received}`);
        offset = otaResumeInfo.current.bytes_received;
        chunkCount = otaResumeInfo.current.chunk_count;
        setOtaStatus('in_progress');
        setOtaProgress(Math.round((offset / firmwareSize) * 100));
      } else {
        // 2. If not resuming, send START and wait for READY
        console.log('[OTA] Starting fresh update. Sending START command...');
        const startPayload = Buffer.alloc(5);
        startPayload.writeUInt8(0x01, 0); // START command
        startPayload.writeUInt32LE(firmwareSize, 1);
        await otaCharacteristics.current.control.writeWithoutResponse(startPayload.toString('base64'));
        console.log('[OTA] START command sent. Waiting for READY...');

        await waitForStatus(s => s === 'READY');
        console.log('[OTA] Device is READY. Starting transfer...');
        setOtaStatus('in_progress');
      }

      otaResumeInfo.current = null; // Consume resume info

      // 3. Stream firmware chunks using stop-and-wait
      const chunkSize = negotiatedMtu.current > 23 ? negotiatedMtu.current - 3 : 20;
      console.log(`[OTA] Using chunk size: ${chunkSize}`);
      while (offset < firmwareSize) {
        const chunkEnd = Math.min(offset + chunkSize, firmwareSize);
        const chunk = firmware.slice(offset, chunkEnd);
        
        await otaCharacteristics.current.data.writeWithoutResponse(chunk.toString('base64'));
        chunkCount++;

        const expectedAckOffset = offset + chunk.length;
        const ackStatus = await waitForStatus(s => {
          if (s.startsWith('ERROR')) throw new Error(s); // Fail fast on firmware error
          if (s.startsWith('ACK:')) {
            const parts = s.split(':');
            const ackedBytes = parseInt(parts[2], 10);
            return ackedBytes >= expectedAckOffset;
          }
          return false;
        });

        console.log(`[OTA] ACK received: "${ackStatus}".`);
        offset = expectedAckOffset;
        setOtaProgress(Math.round((offset / firmwareSize) * 100));
      }

      // 4. Send FINISH command
      console.log('[OTA] All bytes sent. Sending FINISH command...');
      const endPayload = Buffer.alloc(1);
      endPayload.writeUInt8(0x02, 0); // FINISH command
      await otaCharacteristics.current.control.writeWithoutResponse(endPayload.toString('base64'));

      // 5. Wait for SUCCESS
      await waitForStatus(s => s === 'SUCCESS');
      console.log('[OTA] SUCCESS! OTA completed. Device will reboot.');
      await AsyncStorage.setItem('firmwareVersion', version);
      setOtaStatus('success');
      otaRebootExpected.current = true;

    } catch (error) {
      if (otaAbortRequested.current) {
        console.log('[OTA] OTA process gracefully stopped after user abort.');
        setOtaStatus('idle');
      } else {
        console.error(`[OTA] Fatal error during OTA process: ${error.message}`);
        setOtaStatus('error');
        // Don't send ABORT if the error came from the device itself
        if (!error.message.startsWith('ERROR:')) {
          await abortOta();
        }
      }
    }
  };

  const abortOta = async () => {
    console.log('[OTA] User requested to abort OTA process.');
    otaAbortRequested.current = true;
    setOtaStatus('idle');

    if (otaCharacteristics.current.control) {
      try {
        console.log('[OTA] Sending ABORT command...');
        const abortPayload = Buffer.alloc(1);
        abortPayload.writeUInt8(0x03, 0); // ABORT command
        await otaCharacteristics.current.control.writeWithoutResponse(abortPayload.toString('base64'));
        console.log('[OTA] ABORT command sent.');
      } catch (abortError) {
        console.error('[OTA] Failed to send ABORT command:', abortError);
      }
    } else {
      console.warn('[OTA] Cannot send ABORT command: control characteristic is not available.');
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
        abortOta,
      }}
    >
      {children}
    </BLEContext.Provider>
  );
};
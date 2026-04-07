import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

export const FirmwareUpdateContext = createContext();

export const FirmwareUpdateProvider = ({ children }) => {
  const [latestFirmwareVersion, setLatestFirmwareVersion] = useState(null);
  const [updateCheckStatus, setUpdateCheckStatus] = useState('idle'); // idle, checking, checked

  useEffect(() => {
    const loadLatestVersion = async () => {
      const storedVersion = await AsyncStorage.getItem('latestFirmwareVersion');
      if (storedVersion) {
        setLatestFirmwareVersion(storedVersion);
      }
      // Always check for updates on boot
      checkForUpdates();
    };
    loadLatestVersion();
  }, []);

  const checkForUpdates = async () => {
    setUpdateCheckStatus('checking');
    try {
      console.log('Silently checking for firmware updates...');
      const versionResponse = await fetch('http://192.168.0.168:3000/api/firmware/latest');
      if (!versionResponse.ok) {
        throw new Error(`Failed to fetch latest version: ${versionResponse.statusText}`);
      }
      const versionInfo = await versionResponse.json();
      const { firmware: { version } = {} } = versionInfo;

      const currentFirmwareVersion = await AsyncStorage.getItem('firmwareVersion');

      // Update the latest known version in context/storage if it has changed from what we had stored
      if (version && version !== latestFirmwareVersion) {
        setLatestFirmwareVersion(version);
        await AsyncStorage.setItem('latestFirmwareVersion', version);
      }

      // Show a toast if the new version from the server is different from what's on the device
      if (version && version !== currentFirmwareVersion) {
        Toast.show({
          type: 'info',
          text1: 'New Firmware Available',
          text2: `Version ${version} is ready to be installed.`,
        });
      }
    } catch (error) {
      console.error('Failed to silently check for updates:', error);
      // Don't show a toast here, as it's a silent check
    } finally {
      setUpdateCheckStatus('checked');
    }
  };

  return (
    <FirmwareUpdateContext.Provider value={{ latestFirmwareVersion, updateCheckStatus, checkForUpdates }}>
      {children}
    </FirmwareUpdateContext.Provider>
  );
};

export const useFirmwareUpdate = () => {
  return useContext(FirmwareUpdateContext);
};

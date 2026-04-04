import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { Alert, AppState } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';

export const useAppUpdates = () => {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isUpdateReady, setIsUpdateReady] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const netInfo = useNetInfo();

  const download_update = async () => {
    setIsDownloading(true);
    try {
      await Updates.fetchUpdateAsync();
      setIsUpdateReady(true);
    } catch (error) {
      console.error('Error downloading update:', error);
      Alert.alert('Download Error', 'Something went wrong while downloading the update. Please try again later.');
    } finally {
      setIsDownloading(false);
    }
  };

  const reloadApp = async () => {
    await Updates.reloadAsync();
  };

  const check_for_updates = async (showAlertOnNoUpdate = false) => {
    if (isUpdateReady || isDownloading) return;

    if (!netInfo.isConnected) {
      if (showAlertOnNoUpdate) {
        Alert.alert('Offline', 'You are currently offline. Please check your internet connection and try again.');
      }
      return;
    }

    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        setIsUpdateAvailable(true);
        Alert.alert(
          'Update Available',
          'A new version of the app is available. Do you want to download it now?',
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Download',
              onPress: () => download_update(),
            },
          ]
        );
      } else if (showAlertOnNoUpdate) {
        Alert.alert('No Updates', 'You are on the latest version of the app.');
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
      if (showAlertOnNoUpdate) {
        Alert.alert('Update Error', 'Something went wrong while checking for updates. Please try again later.');
      }
    }
  };

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        check_for_updates();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Initial check on mount
    check_for_updates();

    return () => {
      subscription.remove();
    };
  }, []);

  return { isUpdateAvailable, check_for_updates, isUpdateReady, reloadApp, isDownloading };
};
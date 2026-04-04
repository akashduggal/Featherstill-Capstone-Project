import * as Updates from 'expo-updates';
import { useEffect, useState, useCallback } from 'react';
import { Alert, AppState } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';

export const useAppUpdates = () => {
  const [isUpdateReady, setIsUpdateReady] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const netInfo = useNetInfo();

  const reloadApp = async () => {
    await Updates.reloadAsync();
  };

  const manual_check_for_updates = async () => {
    if (isUpdateReady) {
      Alert.alert(
        'Update Ready',
        'An update has already been downloaded. Restart the app to apply it.',
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Restart Now', onPress: reloadApp },
        ]
      );
      return;
    }

    if (isDownloading) {
      Alert.alert('Update in Progress', 'An update is already being downloaded.');
      return;
    }

    if (!netInfo.isConnected) {
      Alert.alert('Offline', 'You are currently offline. Please check your internet connection and try again.');
      return;
    }

    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        Alert.alert(
          'Update Available',
          'A new version of the app is available. Do you want to download it now?',
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Download',
              onPress: async () => {
                setIsDownloading(true);
                try {
                  await Updates.fetchUpdateAsync();
                  setIsUpdateReady(true);
                } catch (error) {
                  console.error('Error downloading update:', error);
                  Alert.alert('Download Error', 'Something went wrong while downloading the update.');
                } finally {
                  setIsDownloading(false);
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('No Updates', 'You are on the latest version of the app.');
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
      Alert.alert('Update Error', 'Something went wrong while checking for updates.');
    }
  };

  const background_check_for_updates = useCallback(async () => {
    if (isUpdateReady || isDownloading || !netInfo.isConnected) {
      return;
    }
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        setIsDownloading(true);
        await Updates.fetchUpdateAsync();
        setIsUpdateReady(true);
        setIsDownloading(false);
      }
    } catch (error) {
      console.error('Error during background update check:', error);
      setIsDownloading(false);
    }
  }, [isUpdateReady, isDownloading, netInfo.isConnected]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        background_check_for_updates();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    background_check_for_updates();

    return () => {
      subscription.remove();
    };
  }, [background_check_for_updates]);

  return { manual_check_for_updates, isUpdateReady, reloadApp, isDownloading };
};
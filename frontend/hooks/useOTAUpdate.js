import { useState, useEffect } from 'react';
import * as Updates from 'expo-updates';
import { Alert } from 'react-native';

export function useOTAUpdate() {
  const [isChecking, setIsChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (__DEV__) return;

    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    try {
      setIsChecking(true);
      
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        setUpdateAvailable(true);
        
        Alert.alert(
          'Update Available',
          'A new version of Featherstill has been downloaded. Restart the app to apply the latest battery monitoring features.',
          [
            { text: 'Later', style: 'cancel' },
            { text: 'Restart Now', onPress: () => Updates.reloadAsync() }
          ]
        );
      }
    } catch (error) {
      console.error('Error fetching OTA update:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const applyUpdate = async () => {
    await Updates.reloadAsync();
  };

  return {
    isChecking,
    updateAvailable,
    applyUpdate,
    checkForUpdates
  };
}
import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

export const useAppUpdates = () => {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

  const check_for_updates = async () => {
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        setIsUpdateAvailable(true);
        await Updates.fetchUpdateAsync();
        Alert.alert(
          'Update Available',
          'A new version of the app is available. Restart the app to apply the update.',
          [
            {
              text: 'Restart',
              onPress: async () => {
                await Updates.reloadAsync();
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  };

  useEffect(() => {
    check_for_updates();
  }, []);

  return { isUpdateAvailable, check_for_updates };
};
import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { Alert, AppState } from 'react-native';

export const useAppUpdates = () => {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

  const check_for_updates = async () => {
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        setIsUpdateAvailable(true);
        await Updates.fetchUpdateAsync();
        Alert.alert(
          'Update Downloaded',
          'A new update has been downloaded. Restart the app to apply it now?',
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Restart Now',
              onPress: async () => {
                await Updates.reloadAsync();
              },
            },
          ]
        );
      } else {
        Alert.alert('No Updates', 'You are on the latest version of the app.');
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
      Alert.alert('Update Error', 'Something went wrong while checking for updates. Please try again later.');
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

  return { isUpdateAvailable, check_for_updates };
};
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { syncTelemetryToAWS } from '../services/database';
import { useAuth } from '../context/AuthContext';
/**
 * A hook to automatically sync local SQLite telemetry to AWS on a fixed interval.
 * @param {number} intervalMs - How often to trigger the sync (default: 60 seconds)
 */

const FOREGROUND_INTERVAL = 60000
export function useTelemetrySync(intervalMs = FOREGROUND_INTERVAL) {
  const isSyncing = useRef(false);
  const appState = useRef(AppState.currentState);
  const { user } = useAuth();
  
  // Helper function to handle the actual sync logic safely
  const triggerSync = async (triggerSource) => {
    if (isSyncing.current) {
      console.log(`Skipping ${triggerSource} sync: Previous upload still in progress.`);
      return;
    }
    try {
      isSyncing.current = true;
      console.log(`Triggering ${triggerSource} AWS sync...`);
      await syncTelemetryToAWS();
    } catch (error) {
      console.error(`Error during ${triggerSource} sync:`, error);
    } finally {
      isSyncing.current = false;
    }
  };

  useEffect(() => {
    if (!user) {
      console.log('Telemetry Sync Engine Paused: User not authenticated.');
      return; 
    }

    console.log(`Foreground sync interval started: Every ${intervalMs / 1000} seconds.`);
    
    const intervalId = setInterval(() => {
      triggerSync('scheduled');
    }, intervalMs);

    // Start the AppState Listener
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log("App has come to the foreground! Catching up on missed syncs...");
        triggerSync('app-resume');
      }
      appState.current = nextAppState;
    });

    return () => {
      clearInterval(intervalId);
      subscription.remove();
      console.log('Telemetry Sync Engine Stopped.');
    };
    
  }, [user, intervalMs]);
}
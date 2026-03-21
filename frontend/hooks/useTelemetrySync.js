import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { syncTelemetryToAWS } from '../services/database';
/**
 * A hook to automatically sync local SQLite telemetry to AWS on a fixed interval.
 * @param {number} intervalMs - How often to trigger the sync (default: 60 seconds)
 */

const FOREGROUND_INTERVAL = 60000
export function useTelemetrySync(intervalMs = FOREGROUND_INTERVAL) {
  const isSyncing = useRef(false);
  const appState = useRef(AppState.currentState);

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

  //ForeGround Interval Timer
  useEffect(() => {
    console.log(`Foreground sync interval started: Every ${intervalMs / 1000} seconds.`);
    
    const intervalId = setInterval(() => {
      triggerSync('scheduled');
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [intervalMs]);

  // AppState Listener
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      // If the app is transitioning from the background to the active foreground
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log("App has come to the foreground! Catching up on missed syncs...");
        triggerSync('app-resume');
      }

      appState.current = nextAppState;
    });

    // Cleanup the listener if the hook ever unmounts
    return () => {
      subscription.remove();
    };
  }, []);
}
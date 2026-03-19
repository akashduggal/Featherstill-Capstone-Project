import { useEffect, useRef } from 'react';
import { syncTelemetryToAWS } from '../services/database';
/**
 * A hook to automatically sync local SQLite telemetry to AWS on a fixed interval.
 * @param {number} intervalMs - How often to trigger the sync (default: 60 seconds)
 */

const FOREGROUND_INTERVAL = 10000
export function useTelemetrySync(intervalMs = FOREGROUND_INTERVAL) {
  // We use a ref to track if a sync is already happening.
  // This prevents overlapping network requests if AWS is responding slowly.
  const isSyncing = useRef(false);

  useEffect(() => {
    console.log(`Foreground sync interval started: Every ${intervalMs / 1000} seconds.`);

    const intervalId = setInterval(async () => {
      // Prevent race conditions: don't start a new sync if the last one hasn't finished
      if (isSyncing.current) {
        console.log("Skipping sync cycle: Previous AWS upload is still in progress.");
        return;
      }

      try {
        isSyncing.current = true;
        console.log("Triggering scheduled AWS sync...");
        await syncTelemetryToAWS();
      } catch (error) {
        console.error("Error during scheduled sync:", error);
      } finally {
        isSyncing.current = false;
      }
    }, intervalMs);

    return () => {
      console.log("Clearing foreground sync interval.");
      clearInterval(intervalId);
    };
  }, [intervalMs]);
}
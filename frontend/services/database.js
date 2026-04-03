import * as SQLite from 'expo-sqlite';
import { getApiUrl } from '../config/api';
import { makePostRequest } from './networkManager';

const db = SQLite.openDatabaseSync('featherstill.db');
const SYNC_PATH = '/api/battery-readings';

export const initDB = () => {
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS telemetry (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts INTEGER NOT NULL,
        payload TEXT NOT NULL,
        synced INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
};

/**
 * Inserts a new ESP32 reading into the database.
 * @param {Object} data - The raw JSON object from the ESP32
 */
export const insertTelemetry = (data) => {
  try {
    const statement = db.prepareSync(
      'INSERT INTO telemetry (ts, payload, synced) VALUES ($ts, $payload, 0)'
    );
    
    statement.executeSync({
      $ts: data.ts,
      $payload: JSON.stringify(data)
    });
    
  } catch (error) {
    console.error("Error inserting telemetry:", error);
  }
};

export const getTelemetry = () => {
  try {
    const result = db.getAllSync('SELECT * FROM telemetry ORDER BY id DESC LIMIT 50');
    return result;
  } catch (error) {
    console.error("Error fetching telemetry:", error);
    return [];
  }
};

export const getUnsyncedTelemetry = () => {
  try {
    // send all unsynced rows in one batch
    return db.getAllSync('SELECT * FROM telemetry WHERE synced = 0 ORDER BY id ASC');
  } catch (error) {
    console.error("Error fetching unsynced data:", error);
    return [];
  }
};

/**
 * Marks given id records as synced after giving to backend.
 * @param {Array<number>} ids - Array of row IDs to update.
 */
export const markAsSynced = (ids) => {
  if (!ids || ids.length === 0) return;
  try {
    const placeholders = ids.map(() => '?').join(',');
    const statement = db.prepareSync(`UPDATE telemetry SET synced = 1 WHERE id IN (${placeholders})`);
    
    statement.executeSync(ids);
    console.log(`Successfully marked ${ids.length} records as synced.`);
  } catch (error) {
    console.error("Error updating sync status:", error);
  }
};

const normalizeUrl = (url) => {
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : `http://${url}`;
};

/**
 * The main orchestrator function to handle backend upload.
 */
export const syncTelemetryToAWS = async () => {
  const unsyncedData = getUnsyncedTelemetry();
  if (unsyncedData.length === 0) return;

  const url = normalizeUrl(getApiUrl(SYNC_PATH));
  if (!url) {
    console.error('Telemetry sync URL is empty.');
    return;
  }

  try {
    const payloads = unsyncedData.map((row) => JSON.parse(row.payload));
    const idsToUpdate = unsyncedData.map((row) => row.id);

    const response = await makePostRequest(url, body);

    if (response.ok) {
      markAsSynced(idsToUpdate);
    } else {
      const errText = await response.text().catch(() => '');
      console.error('Batch sync failed:', response.status, errText);
    }
  } catch (error) {
    console.error('Network error during batch sync:', error);
  }
};

/**
 * Deletes all records that have been successfully synced to AWS.
 */
export const pruneSyncedTelemetry = () => {
  try {
    const statement = db.prepareSync(
      'DELETE FROM telemetry WHERE synced = 1'
    );
    
    const result = statement.executeSync();
    
    if (result.changes > 0) {
      console.log(`Database pruned. ${result.changes} synced records removed.`);
    }
  } catch (error) {
    console.error("Error pruning synced telemetry:", error);
  }
};

export const clearAllTelemetry = () => {
  try {
    db.execSync('DELETE FROM telemetry');
    
    console.log("Database wiped successfully.");
  } catch (error) {
    console.error("Error wiping database:", error);
  }
};
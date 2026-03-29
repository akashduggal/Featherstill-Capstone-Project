import * as SQLite from 'expo-sqlite';
import { getApiUrl } from '../config/api';

const db = SQLite.openDatabaseSync('featherstill.db');

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
    return db.getAllSync('SELECT * FROM telemetry WHERE synced = 0 LIMIT 50');
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

const SYNC_PATH = '/api/battery-readings';

const normalizeUrl = (url) => {
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : `http://${url}`;
};

const toNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const mapLocalToBackendPayload = (local) => {
  const p = local?.payload && typeof local.payload === 'object' ? local.payload : {};
  return {
    email: (typeof local?.email === 'string' && local.email.includes('@')) ? local.email : 'guest@featherstill.local',
    batteryId: local?.batteryId || local?.moduleId || 'ESP32',
    totalBatteryVoltage: toNumber(p.totalBatteryVoltage, 0),
    cellTemperature: toNumber(p.cellTemperature, 0),
    currentAmps: toNumber(p.currentAmps, 0),
    stateOfCharge: toNumber(p.stateOfCharge, 0),
    chargingStatus: p.chargingStatus || 'INACTIVE',
    cellVoltages: Array.isArray(p.cellVoltages) ? p.cellVoltages.map((v) => toNumber(v, 0)) : [],
    nominalVoltage: toNumber(p.nominalVoltage, 51.2),
    capacityWh: toNumber(p.capacityWh, 5222),
    minCellVoltage: p.minCellVoltage != null ? toNumber(p.minCellVoltage, null) : null,
    maxCellVoltage: p.maxCellVoltage != null ? toNumber(p.maxCellVoltage, null) : null,
    outputVoltage: p.outputVoltage != null ? toNumber(p.outputVoltage, null) : null,
    timestamp: local?.ts ? new Date(local.ts).toISOString() : new Date().toISOString(),
    rawPayload: local,
  };
};

/**
 * The main orchestrator function to handle the AWS upload.
 */
export const syncTelemetryToAWS = async () => {
  const unsyncedData = getUnsyncedTelemetry();
  if (unsyncedData.length === 0) return;

  const url = normalizeUrl(getApiUrl(SYNC_PATH));
  if (!url) {
    console.error('Telemetry sync URL is empty.');
    return;
  }

  const successfulIds = [];

  for (const row of unsyncedData) {
    try {
      const localPayload = JSON.parse(row.payload);
      const body = mapLocalToBackendPayload(localPayload);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        successfulIds.push(row.id);
      } else {
        const errText = await response.text().catch(() => '');
        console.error(`Sync failed for row ${row.id}:`, response.status, errText);
      }
    } catch (error) {
      console.error(`Sync error for row ${row.id}:`, error);
    }
  }

  if (successfulIds.length > 0) {
    markAsSynced(successfulIds);
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
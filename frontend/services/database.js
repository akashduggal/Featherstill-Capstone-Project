import * as SQLite from 'expo-sqlite';

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
    const result = db.getAllSync('SELECT * FROM telemetry ORDER BY id DESC LIMIT 5');
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

/**
 * The main orchestrator function to handle the AWS upload.
 */
export const syncTelemetryToAWS = async () => {
  const unsyncedData = getUnsyncedTelemetry();
  if (unsyncedData.length === 0) return;

  try {
    // Map the database rows into an array of pure JSON payloads for AWS
    const payloads = unsyncedData.map(row => JSON.parse(row.payload));
    const idsToUpdate = unsyncedData.map(row => row.id);

    // TODO: Change url to our backend endpoint
    const url="";
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batch: payloads }),
    });

    if (response.ok) {
      markAsSynced(idsToUpdate);
    } else {
      console.error("AWS sync failed with status:", response.status);
    }
  } catch (error) {
    console.error("Network error during AWS sync:", error);
  }
};

/**
 * Deletes records that have been successfully synced AND are older than N days.
 * @param {number} daysOld - no. of days
 */
export const pruneOldTelemetry = (daysOld = 7) => {
  try {
    // Calculate the cutoff timestamp in milliseconds
    const cutoffTimestamp = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    
    const statement = db.prepareSync(
      'DELETE FROM telemetry WHERE synced = 1 AND ts < $cutoff'
    );
    
    const result = statement.executeSync({ $cutoff: cutoffTimestamp });
    console.log(`Database pruned. Old synced records removed.`);
  } catch (error) {
    console.error("Error pruning old telemetry:", error);
  }
};
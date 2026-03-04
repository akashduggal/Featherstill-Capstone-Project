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
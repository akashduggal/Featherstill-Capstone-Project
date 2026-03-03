# Research: Local Storage Limitations for BMS Telemetry

## 1. The Data 
The Featherstill app receives high-fidelity telemetry from the ESP32 BMS. A single data packet looks like this:

```json
{
  "customer_id": "Test Cart",
  "module_id": "Feth-4051.258.410520261",
  "time_utc": "2026-01-27T18:01:08Z",
  "temp_C_1": 25.06,
  "V1": 3.582,
  "V16": 3.572,
  "Output Current_A": -19.712,
  "ts": 1769536868750
  // ... (approx 30 total fields per log)
}
```
This represents a highly structured, time-series data model.

## 2. Evaluation of AsyncStorage
`AsyncStorage` was evaluated as the primary local caching mechanism before syncing to the AWS backend. It has been **rejected** for the following reasons:

* **Lack of Query Capabilities:** We require the ability to query data based on a `SYNCED` flag and `timestamp` (e.g., "Get all logs where synced = false"). `AsyncStorage` does not support SQL-like querying.
* **Performance Bottlenecks:** To filter data in `AsyncStorage`, the entire dataset must be loaded into memory and parsed via `JSON.parse()`. With high-frequency ESP32 data, this will block the React Native JS thread, causing severe UI freezing and Out-Of-Memory (OOM) app crashes.
* **Storage Limits:** Android's default SQLite implementation for `AsyncStorage` often imposes a 6MB soft limit per file, which will be rapidly exceeded by BMS telemetry.

## 3. Architectural Decision
To fulfill Tasks #136, #138, and #139, the frontend will utilize **`expo-sqlite`**. 

**Benefits for this specific payload:**
1. **True SQL Queries:** We can execute `SELECT * FROM telemetry WHERE synced = 0 LIMIT 100` to batch API requests to AWS efficiently.
2. **Memory Safety:** The JS thread only receives the specific rows requested, preventing OOM crashes.
3. **Efficient Cleanup:** We can instantly clear old, synced data using a single `DELETE FROM telemetry WHERE synced = 1 AND ts < [TIMESTAMP]` command without loading the data into memory.
# 🎉 Backend Implementation Complete!

## 📊 What Was Built

### **17 Files Created** 
- ✅ 3 Configuration files
- ✅ 4 Database models
- ✅ 3 Middleware modules
- ✅ 4 API routes & controllers
- ✅ 3 Server & config files
- ✅ 4 Documentation files

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│            FRONTEND (React Native)                  │
│         (Dashboard auto-posts every 60s)           │
└──────────────────────┬──────────────────────────────┘
                       │
                       │ POST /api/battery-readings
                       │ GET  /api/battery-readings/:email
                       │ GET  /health
                       ▼
┌─────────────────────────────────────────────────────┐
│              EXPRESS SERVER (Port 3000)             │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ Middleware Layer                             │ │
│  │  • CORS & JSON parsing                       │ │
│  │  • Request logging (with unique IDs)         │ │
│  │  • Error handling (centralized)              │ │
│  │  • Validation (all fields checked)           │ │
│  └──────────────────────────────────────────────┘ │
│                      ▼                             │
│  ┌──────────────────────────────────────────────┐ │
│  │ Routes & Controllers (Business Logic)        │ │
│  │  • POST /api/battery-readings                │ │
│  │    - Validate input                          │ │
│  │    - Create/find user                        │ │
│  │    - Create/find battery                     │ │
│  │    - Save reading to DB                      │ │
│  │  • GET /api/battery-readings/:email          │ │
│  │    - Fetch readings with pagination          │ │
│  │  • GET /health                               │ │
│  │    - Server health check                     │ │
│  └──────────────────────────────────────────────┘ │
│                      ▼                             │
│  ┌──────────────────────────────────────────────┐ │
│  │ Sequelize ORM (Database Abstraction)         │ │
│  │  • Models: User, Battery, BatteryReading     │ │
│  │  • Validations & constraints                 │ │
│  │  • Associations & relationships              │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────┘
                       │
                       │ SQL Queries
                       ▼
┌─────────────────────────────────────────────────────┐
│        POSTGRESQL DATABASE (RDS - Future)           │
│                                                    │
│  Tables:                                           │
│  • users (id, email, firebaseUID, isGuest)        │
│  • batteries (id, userId, batteryName, specs)     │
│  • battery_readings (id, batteryId, metrics)      │
│                                                    │
│  Indexes:                                          │
│  • users.email (for quick lookup)                 │
│  • batteries.userId (for user's batteries)        │
│  • battery_readings.batteryId (for readings)      │
│  • battery_readings.createdAt (for time-series)   │
└─────────────────────────────────────────────────────┘
```

---

## 📋 File Structure

```
backend/
├── config/
│   ├── index.js              # Centralized config
│   └── database.js           # Sequelize connection
├── middleware/
│   ├── errorHandler.js       # Error handling
│   └── logging.js            # Request logging
├── models/
│   ├── User.js               # User schema
│   ├── Battery.js            # Battery schema
│   ├── BatteryReading.js     # Reading schema
│   └── index.js              # Associations
├── routes/
│   ├── batteryController.js  # POST, GET logic
│   ├── batteryRoutes.js      # /api/battery-readings
│   ├── healthRoutes.js       # /health
│   └── index.js              # Route aggregation
├── src/
│   └── server.js             # Express app
├── .env                      # Environment variables
├── package.json              # Dependencies
├── README.md                 # Full documentation
└── test-api.sh              # Test script
```

---

## 🚀 Getting Started (3 Steps)

### Step 1: Install & Test (5 minutes)
```bash
cd /Users/yash/Desktop/ASU/Semester\ 4/Featherstill/Featherstill-Capstone-Project
npm install && cd backend && npm install && cd ..
npm run dev
# In another terminal:
bash backend/test-api.sh
```

### Step 2: Push to GitHub (2 minutes)
```bash
git add .
git commit -m "feat: add Express backend with Sequelize models"
git push origin feat/ec2_setup
```

### Step 3: Deploy to EC2 (5 minutes)
```bash
# SSH to EC2
ssh -i key.pem ec2-user@ec2-ip
cd /var/www/featherstill
git pull origin feat/ec2_setup
npm install
pm2 start ecosystem.config.js
pm2 logs
```

---

## 📡 API Endpoints

```
GET /health
  └─ Returns: { status: "OK", timestamp, environment, uptime }
  └─ Purpose: Health check for load balancers

POST /api/battery-readings
  └─ Input: { email, batteryId, voltage, temp, current, SOC, ... }
  └─ Returns: { success: true, data: { id, createdAt } }
  └─ Purpose: Save battery telemetry from frontend

GET /api/battery-readings/:email
  └─ Query: ?limit=100&offset=0
  └─ Returns: { success: true, data: [...], pagination: {...} }
  └─ Purpose: Fetch user's reading history

GET /api/battery-readings/:email/latest
  └─ Returns: { success: true, data: { ... } }
  └─ Purpose: Get most recent reading
---

## 📊 Database Schema

### Users Table
```
id (UUID primary key)
email (UNIQUE, validated)
firebaseUID (nullable, for guests)
isGuest (boolean)
createdAt, updatedAt (timestamps)
```

### Batteries Table
```
id (UUID primary key)
userId (FK → users.id)
batteryName (string)
serialNumber (nullable)
nominalVoltage (float, default: 51.2V)
capacityWh (float, default: 5222Wh)
status (ACTIVE|INACTIVE|ERROR)
createdAt, updatedAt (timestamps)
```

### Battery Readings Table
```
id (UUID primary key)
batteryId (FK → batteries.id)
totalBatteryVoltage (float, 0-100V)
cellTemperature (float, -50 to 85°C)
currentAmps (float)
stateOfCharge (float, 0-100%)
chargingStatus (CHARGING|DISCHARGING|INACTIVE)
cellVoltages (JSON array of 16 floats)
createdAt (timestamp, indexed)

Indexes: batteryId, createdAt
```

---

## ✨ Key Features

✅ **Validation** - All inputs validated before saving  
✅ **Error Handling** - Centralized, with proper HTTP status codes  
✅ **Logging** - Every request logged with unique ID & timing  
✅ **Auto-User Creation** - Creates user if doesn't exist  
✅ **Auto-Battery Creation** - Creates battery if doesn't exist  
✅ **Pagination** - GET endpoints support limit/offset  
✅ **Indexes** - Fast queries on frequently accessed fields  
✅ **Associations** - Proper ORM relationships  
✅ **Sequelize ORM** - SQL injection protection  
✅ **CORS** - Frontend can make requests from any origin  

---

## End-to-end Flows (OTA and Telemetry)

This section documents the precise runtime flows and API contracts for:
- Telemetry ingestion (device → mobile app → backend)
- OTA distribution (admin web → backend → mobile app → device)

Keep responsibilities strict: mobile/frontends authenticate with Firebase ID tokens; backend verifies tokens and is the source of truth for user/admin rights.

### Telemetry ingestion flow (end-to-end)

Actors:
- Device (ESP32 BMS) — emits BLE telemetry packets
- Mobile App (React Native) — collects via BLE, buffers locally (SQLite), batches uploads
- Backend (Express) — verifies token, resolves user/battery, persists readings
- Postgres — stores normalized readings (battery_readings)

Sequence (high-level):
1. Device streams telemetry over BLE to Mobile App.
2. Mobile App parses packets, formats BMS payload, and inserts into local SQLite table `telemetry`:
   - Stored row shape: { id, ts (epoch ms), payload: JSON.stringify({ moduleId: "ESP32", payload: {...} }), synced: 0 }
3. Every sync interval (or on app resume), Mobile App calls:
   - POST { batch: [ { localId, moduleId, ts, payload } ] } to `${API}/api/battery-readings`
   - Header: Authorization: Bearer <Firebase-ID-Token>
4. Backend (`/api/battery-readings`) checks Bearer token once:
   - verifyIdToken() via Firebase Admin SDK
   - resolve email from token → lookup `users` table
   - if user missing → create guest user row
5. For each batch item:
   - normalize item (moduleId default "ESP32", ts epoch ms)
   - resolve/create Battery row: unique (userId, moduleId)
   - create BatteryReading row with timestamp = new Date(ts) and telemetry fields
6. Backend returns:
   - 200 { success:true, data: { received, createdCount, failedCount, successLocalIds: [ localId... ], failures } }
7. Mobile App marks only `successLocalIds` as synced in SQLite (synced = 1) and prunes synced rows as needed.

Minimal API contract (telemetry):
- Request: POST /api/battery-readings
  - Headers: Authorization: Bearer <idToken>
  - Body: { batch: [ { localId: number, moduleId: string, ts: number (epoch ms), payload: { /* battery values */ } } ] }
- Successful response: 200 JSON with data.successLocalIds

Notes:
- Backend must never rely on client-supplied email — always derive identity from Firebase token.
- Mobile must send the token in the Authorization header (not in body) for each batch request.
- Batch size and retry policy: mobile sends all unsynced rows in one batch; backend processes items idempotently (unique constraint per battery+timestamp if added later).

### OTA flow (admin → device)

Actors:
- Admin Web (React) — Google sign-in, admin-check, firmware upload
- Backend — firmware storage, metadata, download endpoint
- Mobile App — checks backend for latest firmware, downloads binary, performs BLE OTA to device
- Device (ESP32) — receives OTA chunks over BLE (OTA control/data/status characteristics)

Sequence (high-level):
1. Admin Web authenticates with Firebase (Google sign-in).
2. Admin Web calls GET /api/firmware/me (Authorization: Bearer <idToken>).
   - Backend verifies token and checks `users.isAdmin` from `users` table; returns 200 if admin.
3. Admin Web uploads firmware (multipart/form-data) to POST /api/firmware/upload with:
   - file: .bin
   - version: semantic version (x.y.z)
   - changelog: optional
   - Header: Authorization: Bearer <idToken>
4. Backend `uploadFirmware` saves file to storage directory (backend/storage/firmware), computes SHA256, records metadata in `Firmware` model:
   - fields: version, filename, file_hash, file_size, changelog, is_active, created_at
5. Mobile App (or admin device) can query:
   - GET /api/firmware/latest?moduleId=ESP32
   - Response: metadata (version, file_hash, file_size, download_url)
6. Mobile downloads the binary from:
   - GET /api/firmware/:version/download
   - Backend streams file and sets headers: X-File-Hash, X-Firmware-Version
7. Mobile performs OTA to the connected device via BLE:
   - Mobile acts as OTA client using BLE characteristics:
     - OTA_CONTROL (start/finish/abort) — start contains firmware size; finish signals end
     - OTA_DATA — stream firmware chunks (stop-and-wait with ACKs)
     - OTA_STATUS — device notifies READY/ACK:offset/SUCCESS/ERROR messages
   - Mobile's BLEContext.startOta implements:
     - resume support: read initial status char for "RESUME_AT:chunkCount:bytesReceived"
     - start: send START command with firmware size, wait for READY
     - stream 244-byte chunks using writeWithoutResponse and wait for ACK via status monitor
     - on FINISH, wait for SUCCESS; handle ABORT and retries
8. Device validates data (checksum/offsets) and reboots into new firmware.

Minimal API contract (OTA):
- Admin check: GET /api/firmware/me
  - Headers: Authorization: Bearer <idToken>
  - Response: 200 { data: { email, isAdmin, id } } or 403
- Upload: POST /api/firmware/upload (adminOnly)
  - Headers: Authorization: Bearer <idToken>
  - Body: multipart with `file`, `version`, `changelog`
  - Response: 201 with new firmware metadata
- Latest metadata: GET /api/firmware/latest?moduleId=ESP32
  - Response: 200 { version, file_hash, file_size, download_url }
- Download: GET /api/firmware/:version/download
  - Response: octet-stream + headers X-File-Hash, X-Firmware-Version

Operational notes
- Secure endpoints with HTTPS and exact CORS origin for admin UI.
- Keep firmware storage directory backed up and ensure sufficient disk.
- Enforce file size limits in multer middleware and validate semantic version on upload.
- Track upload audit: who uploaded (email/uid), version, size, timestamp (store in DB `Firmware` table).

### Debugging checklist for OTA / Telemetry
- Telemetry:
  - Mobile logs show token fetch & `batchCount`
  - Backend logs show Firebase token verification success and `createdCount`
  - DB contains battery and battery_readings rows with timestamps from device
  - SQLite rows get marked synced only for `successLocalIds`
- OTA:
  - Admin upload returns 201 and file saved at `backend/storage/firmware/<version>.bin`
  - GET /api/firmware/latest returns current metadata
  - Mobile downloads file; header X-File-Hash matches computed hash
  - BLE OTA logs display READY, ACK, SUCCESS; device reboots with new firmware


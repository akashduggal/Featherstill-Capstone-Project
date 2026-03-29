# Backend Schema and Flow

## 1) Schema (3 tables)

### `users`
- `id` (UUID, PK)
- `email` (unique)
- `isGuest` (boolean)
- `isAdmin` (boolean)
- `createdAt`, `updatedAt`

### `batteries`
- `id` (UUID, PK)
- `userId` (UUID, FK -> `users.id`)
- `batteryName` (nullable)
- `moduleId` (text, required)
- `createdAt`, `updatedAt`
- Unique key: `("userId", "moduleId")`

### `battery_readings`
- `id` (serial, PK)
- `batteryId` (UUID, FK -> `batteries.id`)
- telemetry fields (`totalBatteryVoltage`, `cellTemperature`, `currentAmps`, etc.)
- `cellVoltages` (numeric array)
- `rawPayload` (jsonb)
- `timestamp`, `createdAt`

---

## 2) Relationship model

- One user -> many batteries
- One battery -> many readings
- Reading always belongs to one battery by UUID FK

---

## 3) Backend write flow (`POST /api/battery-readings`)

1. Request hits route: `routes/batteryRoutes.js`
2. Route calls controller: `postBatteryReading`
3. Controller:
   - finds/creates user by `email`
   - resolves/creates battery by `userId + moduleId`
   - inserts reading with `batteryId = batteries.id`
4. Sequelize writes to PostgreSQL tables

---

## 4) Frontend -> backend contract

Frontend should send:
- `email`
- `moduleId` (string; current hardcoded `ESP32`)
- telemetry fields

Backend handles persistence and FK mapping.

---

## 5) Troubleshooting

If data is not visible in DB:

1. Confirm backend DB target:
```sql
SELECT current_database(), current_user, inet_server_addr(), inet_server_port();
```

2. Confirm tables exist:
```sql
\dt
```

3. Check latest records:
```sql
SELECT id, "moduleId", "createdAt" FROM batteries ORDER BY "createdAt" DESC LIMIT 10;
SELECT id, "batteryId", "createdAt" FROM battery_readings ORDER BY id DESC LIMIT 10;
```

4. Confirm backend logs show `POST /api/battery-readings` with `201`.

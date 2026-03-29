# Featherstill Backend

Express + Sequelize + PostgreSQL backend for battery telemetry ingestion and query APIs.

## What this backend does

- Accepts telemetry via `POST /api/battery-readings`
- Resolves/creates:
  - `users` by email
  - `batteries` by `userId + moduleId`
- Stores readings in `battery_readings` with FK to `batteries.id`
- Exposes read APIs by user email

---

## Project structure (backend)

- `src/server.js` — app bootstrap, middleware, routes, error handling
- `routes/` — API routes and controllers
- `models/` — Sequelize models and associations
- `migrations/001-init.sql` — SQL schema for 3 tables
- `config/` — DB and app config
- `middleware/` — logging/error handling

---

## Environment

Create `backend/.env`:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=fetherstill
DB_USER=backenddev
DB_PASSWORD=your_password
DB_REQUIRE_SSL=false
```

---

## Install and run

```bash
cd /home/ec2-user/Featherstill-Capstone-Project/backend
npm install
npm run dev
# or: npm start
```

---

## Database setup / reset

### Apply schema
```bash
psql -h localhost -U backenddev -d fetherstill -f migrations/001-init.sql
```

### Full reset (destructive)
```bash
psql -h localhost -U backenddev -d fetherstill -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
psql -h localhost -U backenddev -d fetherstill -f migrations/001-init.sql
```

---

## API endpoints

- `GET /health`
- `GET /api/health`
- `POST /api/battery-readings`
- `GET /api/battery-readings/:email`
- `GET /api/battery-readings/:email/latest`

### POST payload (current)
```json
{
  "email": "user@example.com",
  "moduleId": "ESP32",
  "nominalVoltage": 51.2,
  "capacityWh": 5222,
  "minCellVoltage": 3.20,
  "maxCellVoltage": 3.35,
  "totalBatteryVoltage": 52.1,
  "cellTemperature": 26.5,
  "currentAmps": 1.2,
  "outputVoltage": 51.9,
  "stateOfCharge": 78,
  "chargingStatus": "INACTIVE",
  "cellVoltages": [3.24, 3.25, 3.26],
  "timestamp": "2026-03-29T18:00:00.000Z",
  "rawPayload": {}
}
```

---

## Quick verification

```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM batteries;
SELECT COUNT(*) FROM battery_readings;

SELECT id, email, "createdAt" FROM users ORDER BY "createdAt" DESC LIMIT 5;
SELECT id, "userId", "moduleId", "createdAt" FROM batteries ORDER BY "createdAt" DESC LIMIT 5;
SELECT id, "batteryId", "timestamp", "createdAt" FROM battery_readings ORDER BY id DESC LIMIT 10;
```

---

## Notes

- Frontend posts to backend API; frontend never writes directly to Postgres.
- Logging middleware prints request/response pairs with request IDs.
- Controller returns `503` when DB is unavailable.

CREATE TABLE IF NOT EXISTS users (
  "id" UUID PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "isGuest" BOOLEAN NOT NULL DEFAULT FALSE,
  "isAdmin" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- batteries
CREATE TABLE IF NOT EXISTS batteries (
  "id" UUID PRIMARY KEY,
  "userId" UUID NOT NULL REFERENCES users("id") ON DELETE CASCADE,
  "batteryName" TEXT NULL,
  "moduleId" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("userId", "moduleId")
);

-- battery_readings
CREATE TABLE IF NOT EXISTS battery_readings (
  "id" SERIAL PRIMARY KEY,
  "batteryId" UUID NOT NULL REFERENCES batteries("id") ON DELETE CASCADE,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "nominalVoltage" NUMERIC,
  "capacityWh" NUMERIC,
  "minCellVoltage" NUMERIC,
  "maxCellVoltage" NUMERIC,
  "totalBatteryVoltage" NUMERIC,
  "cellTemperature" NUMERIC,
  "currentAmps" NUMERIC,
  "outputVoltage" NUMERIC,
  "stateOfCharge" INTEGER,
  "chargingStatus" TEXT,
  "cellVoltages" NUMERIC[],
  "rawPayload" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_battery_userId ON batteries ("userId");
CREATE INDEX IF NOT EXISTS idx_battery_moduleId ON batteries ("moduleId");
CREATE INDEX IF NOT EXISTS idx_readings_batteryId_timestamp ON battery_readings ("batteryId", "timestamp" DESC);
CREATE INDEX IF NOT EXISTS idx_readings_createdAt ON battery_readings ("createdAt" DESC);
CREATE TABLE IF NOT EXISTS battery_readings (
  "id" SERIAL PRIMARY KEY,
  "batteryId" TEXT,
  "email" TEXT,
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

CREATE INDEX IF NOT EXISTS idx_battery_email ON battery_readings ("email");
CREATE INDEX IF NOT EXISTS idx_battery_batteryId_timestamp ON battery_readings ("batteryId", "timestamp" DESC);
CREATE INDEX IF NOT EXISTS idx_createdAt ON battery_readings ("createdAt" DESC);
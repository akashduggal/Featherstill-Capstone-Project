-- Firmware OTA Updates Table
CREATE TABLE IF NOT EXISTS firmware_versions (
  "id" SERIAL PRIMARY KEY,
  "version" VARCHAR(20) UNIQUE NOT NULL,
  "filename" VARCHAR(255) NOT NULL,
  "file_hash" VARCHAR(64),
  "file_size" INTEGER,
  "changelog" TEXT,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_firmware_version ON firmware_versions ("version" DESC);
CREATE INDEX IF NOT EXISTS idx_firmware_active ON firmware_versions ("is_active");
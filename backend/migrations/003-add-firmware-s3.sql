ALTER TABLE firmware_versions
ADD COLUMN image_url TEXT,
ADD COLUMN storage_key VARCHAR(255),
ADD COLUMN image_key VARCHAR(255);

CREATE UNIQUE INDEX unique_active_firmware
ON firmware_versions (is_active)
WHERE is_active = true;
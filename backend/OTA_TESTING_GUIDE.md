# OTA Testing Guide: Simulated Device Requests

Complete testing workflow for the Over-The-Air (OTA) firmware update system with curl commands and expected responses.

---

## 1. Prerequisites

- Node.js backend server running locally (`npm start` on port 3000)
- PostgreSQL database configured and initialized
- Backend migrations applied (`001-init.sql`, `002-add-firmware-table.sql`)
- `curl` or Postman for testing requests

---

## 2. Testing Scenarios

### Scenario A: Complete OTA Workflow (Happy Path)

This simulates a device checking for updates, downloading, and the backend managing versions.

#### Step 1: Upload Initial Firmware (v1.0.0)

```bash
curl -X POST http://localhost:3000/api/firmware/upload \
  -F "file=@firmware_1.0.0.bin" \
  -F "version=1.0.0" \
  -F "changelog=Initial release with battery monitoring"
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "firmware": {
    "id": 1,
    "version": "1.0.0",
    "filename": "1.0.0.bin",
    "file_hash": "a1b2c3d4e5f6...",
    "file_size": 512000,
    "changelog": "Initial release with battery monitoring",
    "is_active": true,
    "created_at": "2026-04-03T10:15:00Z"
  }
}
```

---

#### Step 2: Device Check Latest Version

Simulates a device requesting the latest available firmware.

```bash
curl -X GET http://localhost:3000/api/firmware/latest
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "firmware": {
    "id": 1,
    "version": "1.0.0",
    "filename": "1.0.0.bin",
    "file_hash": "a1b2c3d4e5f6...",
    "file_size": 512000,
    "changelog": "Initial release with battery monitoring",
    "is_active": true,
    "created_at": "2026-04-03T10:15:00Z"
  },
  "download_url": "http://localhost:3000/api/firmware/1.0.0/download"
}
```

---

#### Step 3: Device Download Firmware

Simulates a device downloading the firmware binary.

```bash
curl -X GET http://localhost:3000/api/firmware/1.0.0/download \
  -o firmware_1.0.0.bin \
  -H "User-Agent: FeatherstillESP32/1.0.0"
```

**Expected Response Headers:**
```
HTTP/1.1 200 OK
Content-Type: application/octet-stream
Content-Length: 512000
X-File-Hash: a1b2c3d4e5f6...
X-Firmware-Version: 1.0.0
Content-Disposition: attachment; filename="1.0.0.bin"
```

**Body:** Binary firmware file stream

---

#### Step 4: Upload Newer Version (v1.1.0)

Admin uploads a newer firmware version (version control enforced).

```bash
curl -X POST http://localhost:3000/api/firmware/upload \
  -F "file=@firmware_1.1.0.bin" \
  -F "version=1.1.0" \
  -F "changelog=Fixed battery reading precision, improved BLE stability"
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "firmware": {
    "id": 2,
    "version": "1.1.0",
    "filename": "1.1.0.bin",
    "file_hash": "b2c3d4e5f6g7...",
    "file_size": 540000,
    "changelog": "Fixed battery reading precision, improved BLE stability",
    "is_active": true,
    "created_at": "2026-04-03T11:20:00Z"
  }
}
```

**Behind the scenes:**
- v1.0.0 marked as `is_active: false`
- v1.1.0 marked as `is_active: true`
- Both versions kept in DB and storage (file retention ≤ 5)

---

#### Step 5: Device Checks for Update Again

Device polls and discovers newer version available.

```bash
curl -X GET http://localhost:3000/api/firmware/latest
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "firmware": {
    "id": 2,
    "version": "1.1.0",
    "filename": "1.1.0.bin",
    "file_hash": "b2c3d4e5f6g7...",
    "file_size": 540000,
    "changelog": "Fixed battery reading precision, improved BLE stability",
    "is_active": true,
    "created_at": "2026-04-03T11:20:00Z"
  },
  "download_url": "http://localhost:3000/api/firmware/1.1.0/download"
}
```

---

### Scenario B: Version Control Enforcement

Tests that version control prevents downgrade and out-of-order uploads.

#### Test B1: Attempt Downgrade (Should Fail)

Device/Admin tries to upload v1.0.5 when v1.1.0 is latest.

```bash
curl -X POST http://localhost:3000/api/firmware/upload \
  -F "file=@firmware_1.0.5.bin" \
  -F "version=1.0.5" \
  -F "changelog=Attempted downgrade"
```

**Expected Response (409 Conflict):**
```json
{
  "success": false,
  "error": "Firmware version 1.0.5 is not newer than current latest version 1.1.0"
}
```

✅ **Test passes:** Downgrade prevented

---

#### Test B2: Attempt Duplicate Version (Should Fail)

Admin tries uploading v1.1.0 again.

```bash
curl -X POST http://localhost:3000/api/firmware/upload \
  -F "file=@firmware_1.1.0_retry.bin" \
  -F "version=1.1.0" \
  -F "changelog=Retry same version"
```

**Expected Response (409 Conflict):**
```json
{
  "success": false,
  "error": "Firmware version 1.1.0 already exists"
}
```

✅ **Test passes:** Duplicate prevented

---

### Scenario C: File Retention & Cleanup

Tests that oldest versions are cleaned up when exceeding 5-version limit.

#### Setup: Upload 6 Versions

```bash
for v in 1.0.0 1.1.0 1.2.0 1.3.0 1.4.0 1.5.0; do
  curl -X POST http://localhost:3000/api/firmware/upload \
    -F "file=@firmware_${v}.bin" \
    -F "version=${v}" \
    -F "changelog=Version ${v}"
  sleep 1
done
```

#### Check Stored Files

After 6th upload, only 5 newest should exist in filesystem:

```bash
ls -la /Users/anadidewan/featherstill/Featherstill-Capstone-Project/backend/storage/firmware/
```

**Expected Output:**
```
1.1.0.bin  (oldest kept)
1.2.0.bin
1.3.0.bin
1.4.0.bin
1.5.0.bin  (newest, active)
```

✅ **Test passes:** 1.0.0.bin deleted, DB record preserved

---

#### Verify DB Still Has All Records

```bash
curl -X GET http://localhost:3000/api/firmware/versions 2>/dev/null | jq '.[].version'
```

**(If endpoint implemented)**
```
"1.0.0"
"1.1.0"
"1.2.0"
"1.3.0"
"1.4.0"
"1.5.0"
```

✅ **Test passes:** DB audit trail complete

---

### Scenario D: Error Handling

#### Test D1: Missing File Upload

```bash
curl -X POST http://localhost:3000/api/firmware/upload \
  -F "version=2.0.0" \
  -F "changelog=No file attached"
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "No file uploaded"
}
```

---

#### Test D2: Invalid Version Format

```bash
curl -X POST http://localhost:3000/api/firmware/upload \
  -F "file=@firmware.bin" \
  -F "version=1.0" \
  -F "changelog=Invalid semver"
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Invalid version format. Expected semantic versioning (e.g., 1.0.0), got: 1.0"
}
```

---

#### Test D3: Version Not Found Download

```bash
curl -X GET http://localhost:3000/api/firmware/9.9.9/download
```

**Expected Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Firmware version 9.9.9 not found"
}
```

---

#### Test D4: No Firmware Available (Empty DB)

After truncating firmware table, request latest:

```bash
curl -X GET http://localhost:3000/api/firmware/latest
```

**Expected Response (404 Not Found):**
```json
{
  "success": false,
  "error": "No firmware versions available"
}
```

---

## 3. Bash Testing Script

Automated full workflow test:

```bash
#!/bin/bash

API_URL="http://localhost:3000/api"
TEST_DIR="/tmp/fw_test"

mkdir -p "$TEST_DIR"

echo "=== OTA Testing Suite ==="

# Helper function
test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  local expected_status=$4
  
  echo -n "Testing $method $endpoint ... "
  
  if [ "$method" = "GET" ]; then
    status=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL$endpoint")
  else
    status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$API_URL$endpoint" $data)
  fi
  
  if [ "$status" = "$expected_status" ]; then
    echo "✓ PASS ($status)"
  else
    echo "✗ FAIL (expected $expected_status, got $status)"
  fi
}

# Test 1: Upload v1.0.0
echo -e "\n--- Test 1: Upload v1.0.0 ---"
test_endpoint POST "/firmware/upload" \
  "-F 'file=@firmware_1.0.0.bin' -F 'version=1.0.0' -F 'changelog=Initial'" \
  "201"

# Test 2: Get latest
echo -e "\n--- Test 2: Get Latest ---"
test_endpoint GET "/firmware/latest" "" "200"

# Test 3: Download v1.0.0
echo -e "\n--- Test 3: Download v1.0.0 ---"
test_endpoint GET "/firmware/1.0.0/download" "" "200"

# Test 4: Upload v1.1.0 (newer)
echo -e "\n--- Test 4: Upload v1.1.0 (Newer) ---"
test_endpoint POST "/firmware/upload" \
  "-F 'file=@firmware_1.1.0.bin' -F 'version=1.1.0' -F 'changelog=Improved'" \
  "201"

# Test 5: Attempt downgrade
echo -e "\n--- Test 5: Attempt Downgrade (Should Fail) ---"
test_endpoint POST "/firmware/upload" \
  "-F 'file=@firmware_1.0.5.bin' -F 'version=1.0.5' -F 'changelog=Down'" \
  "409"

# Test 6: Invalid version format
echo -e "\n--- Test 6: Invalid Version Format (Should Fail) ---"
test_endpoint POST "/firmware/upload" \
  "-F 'file=@firmware.bin' -F 'version=1.0' -F 'changelog=Bad'" \
  "400"

# Test 7: Version not found
echo -e "\n--- Test 7: Download Non-Existent Version ---"
test_endpoint GET "/firmware/9.9.9/download" "" "404"

echo -e "\n=== Suite Complete ==="
```

**Run it:**
```bash
chmod +x ota_test.sh
./ota_test.sh
```

---

## 4. Manual Testing via Postman

### Import as Postman Collection

Create a collection with these requests:

| Method | URL | Body | Test |
|--------|-----|------|------|
| POST | `{{base_url}}/api/firmware/upload` | form-data: file, version, changelog | 201 with firmware object |
| GET | `{{base_url}}/api/firmware/latest` | — | 200 with metadata & download_url |
| GET | `{{base_url}}/api/firmware/{{version}}/download` | — | 200 with binary stream, X-File-Hash header |
| POST | `{{base_url}}/api/firmware/upload` | Attempt downgrade | 409 Conflict |
| GET | `{{base_url}}/api/firmware/invalid/download` | — | 404 Not Found |

---

## 5. Real Device Testing (ESP32 Integration)

### Prerequisites on ESP32

- OTA firmware sketch with `/latest` polling
- BLE capability for receiving binary via mobile app
- Uptime monitoring logging

### Device Testing Steps

1. **Flash v1.0.0 to ESP32**
2. **Start backend server**
3. **Connect mobile app**
4. **Upload v1.1.0** via backend admin
5. **Mobile app checks `/api/firmware/latest`**
6. **App downloads v1.1.0**
7. **OTA push to ESP32 via BLE**
8. **Verify v1.1.0 running** on device; confirm in logs

---

## 6. Performance & Load Testing

### Concurrent Device Polling

Simulate 100 devices polling `/latest`:

```bash
for i in {1..100}; do
  curl -s http://localhost:3000/api/firmware/latest > /dev/null &
done
wait
```

**Expected:** All requests return 200 in < 1 second per device

---

### Concurrent Download Test

Simulate 5 devices downloading simultaneously:

```bash
for i in {1..5}; do
  curl -o firmware_${i}.bin http://localhost:3000/api/firmware/1.1.0/download &
done
wait
ls -lh firmware_*.bin
```

**Expected:** All files match size & hash; complete < 10 seconds

---

## 7. Debugging & Logs

### Check Backend Logs

```bash
tail -f backend/src/server.log
# or via docker:
docker logs -f featherstill-backend
```

### Sample Log Entry

```
[2026-04-03 10:15:22] POST /api/firmware/upload
  Version: 1.0.0
  File size: 512000 bytes
  File hash: a1b2c3d4e5f6...
  Active: true
  Message: Firmware uploaded successfully
```

---

## 8. Checklist: When Testing Manually

- [ ] v1.0.0 upload succeeds (201)
- [ ] `/latest` returns v1.0.0 metadata
- [ ] Download v1.0.0 returns binary + correct headers
- [ ] Upload v1.1.0 succeeds (201)
- [ ] v1.0.0 marked `is_active=false` in DB
- [ ] `/latest` now returns v1.1.0
- [ ] Attempt downgrade to v1.0.5 fails (409)
- [ ] Attempt duplicate v1.1.0 fails (409)
- [ ] Upload 4 more versions (2.0.0 → 2.3.0)
- [ ] 6th upload triggers cleanup; only latest 5 `.bin` files remain
- [ ] DB still has records for all 6 versions
- [ ] Invalid version format rejected (400)
- [ ] Non-existent version download fails (404)

---

## 9. Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| 404 on `/latest` but DB has records | No `is_active=true` versions | Run `UPDATE firmware_versions SET is_active=true WHERE version='1.0.0'` |
| Download returns 404 but DB has version | `.bin` file missing from storage | Check `/backend/storage/firmware/` permissions |
| Upload fails with "File too large" | Firmware > 2MB | Check `firmwareUpload.js` middleware limit |
| Downgrade not rejected | Version comparison broken | Test `compareSemver('1.0.5', '1.1.0')` returns -1 |
| Cleanup didn't remove old files | `cleanupFirmwareFiles()` not called | Verify it's invoked after `Firmware.create()` |

---

## 10. Next Steps

- Implement `GET /api/firmware/versions` (list all with audit trail)
- Add admin authentication middleware to uploads
- Add rate limiting for `/latest` polling
- Implement firmware rollback endpoint
- Add telemetry logging (device update start/finish)


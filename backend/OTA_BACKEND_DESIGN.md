# OTA Backend Flow Design (#263)

## Overview
This document outlines the complete Over-The-Air (OTA) firmware update system for ESP32 devices. The flow supports uploading new firmware versions, securely storing them, and allowing the mobile app to fetch and push updates to connected devices via BLE.

---

## 1. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile App (React Native)                 │
│  ┌──────────────────────────────────────────────────────────┐
│  │  1. Check for firmware updates (GET /firmware/latest)    │
│  │  2. Download .bin file (GET /firmware/:version/download) │
│  │  3. Push firmware to ESP32 over BLE                       │
│  └──────────────────────────────────────────────────────────┘
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP REST API
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Express Backend (Node.js)                       │
│  ┌──────────────────────────────────────────────────────────┐
│  │ POST   /api/firmware/upload        (Admin authentication)│
│  │ GET    /api/firmware/latest        (Metadata only)       │
│  │ GET    /api/firmware/:version/download (Binary stream)   │
│  │ GET    /api/firmware/versions      (All versions list)   │
│  └──────────────────────────────────────────────────────────┘
└────────────┬──────────────────────────┬──────────────────────┘
             │                          │
      Local Filesystem           PostgreSQL Database
      /backend/storage/          firmware_versions
      firmware/                  - version (1.0.0, etc)
      ├── 1.0.0.bin             - filename
      ├── 1.1.0.bin             - file_hash (SHA256)
      └── 1.2.0.bin             - file_size
                                 - is_active
                                 - changelog
                                 - created_at
```

---

## 2. Upload Flow (#264)

### Endpoint
```
POST /api/firmware/upload
```

### Request Headers
```
Content-Type: multipart/form-data
Authorization: Bearer <admin-token>
```

### Request Body
```
{
  "file": <binary .bin file>,
  "version": "1.2.0",
  "changelog": "Fixed voltage calibration bug"
}
```

### Validation Steps
1. **Authentication**: Only admin users can upload
2. **File Validation**:
   - File must be `.bin` format
   - Max file size: 2MB
   - File must be non-empty
3. **Version Validation**:
   - Semantic versioning (e.g., 1.0.0)
   - Version must be unique (no duplicates)
4. **Hash Generation**: SHA256 of file for integrity verification

### Storage Process
1. Generate SHA256 hash of file
2. Save to `/backend/storage/firmware/<version>.bin`
3. Create database record in `firmware_versions`
4. Return metadata (version, hash, size)

### Response
```json
{
  "success": true,
  "firmware": {
    "id": 1,
    "version": "1.2.0",
    "filename": "1.2.0.bin",
    "file_hash": "abc123...",
    "file_size": 1048576,
    "is_active": true,
    "created_at": "2026-03-26T10:30:00Z"
  }
}
```

---

## 3. Fetch Flow

### Endpoints

#### 3a. Get Latest Version (Metadata Only)
```
GET /api/firmware/latest
```

**Response**:
```json
{
  "version": "1.2.0",
  "filename": "1.2.0.bin",
  "file_hash": "abc123...",
  "file_size": 1048576,
  "changelog": "Fixed voltage calibration bug",
  "is_active": true,
  "created_at": "2026-03-26T10:30:00Z"
}
```

#### 3b. Download Firmware Binary
```
GET /api/firmware/:version/download
```

**Response**: Binary stream (.bin file)
```
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="1.2.0.bin"
Content-Length: 1048576
```

#### 3c. List All Available Versions
```
GET /api/firmware/versions
```

**Response**:
```json
{
  "versions": [
    {
      "version": "1.2.0",
      "is_active": true,
      "file_size": 1048576,
      "changelog": "Latest stable release"
    },
    {
      "version": "1.1.0",
      "is_active": false,
      "file_size": 1024000,
      "changelog": "Previous version"
    }
  ]
}
```

---

## 4. Storage Strategy

### Directory Structure
```
/backend/storage/
├── firmware/
│   ├── 1.0.0.bin       (Initial release)
│   ├── 1.1.0.bin       (Bug fixes)
│   └── 1.2.0.bin       (Current active)
└── README.md           (Storage instructions)
```

### File Size Constraints
- Max firmware file: 2MB
- Storage directory quota: 100MB (easily expandable)

### Cleanup Policy
- Keep all firmware versions (for rollback capability)
- Can be archived to cloud storage if space needed
- Manual deletion of old versions via admin API (future)

---

## 5. Security Considerations

### Authentication
- Only **admin users** can upload firmware
- Use JWT token validation
- Log all uploads with user ID and timestamp

### File Integrity
- **SHA256 hash** stored in database
- App verifies hash after download before pushing to device
- Hash mismatch triggers error

### Rate Limiting
- Max 5 uploads per hour per admin
- File upload timeout: 30s

### Versioning Safety
- **Semantic versioning enforced** (1.x.y format)
- No version overwrite (unique constraint)
- `is_active` flag prevents accidental rollbacks

---

## 6. Error Handling

### Upload Errors
| Error | HTTP Status | Description |
|-------|---|---|
| Invalid file format | 400 | File is not .bin |
| File too large | 413 | Exceeds 2MB limit |
| Invalid version | 400 | Not semantic versioning (x.y.z) |
| Version exists | 409 | Version already uploaded |
| Unauthorized | 401 | Not admin user |
| Server error | 500 | Database/storage write failed |

### Download Errors
| Error | HTTP Status | Description |
|-------|---|---|
| Version not found | 404 | Requested version doesn't exist |
| File corrupted | 500 | File missing from storage |
| Unauthorized | 401 | Invalid auth token |

---

## 7. Database Schema

```sql
CREATE TABLE firmware_versions (
  id SERIAL PRIMARY KEY,
  version VARCHAR(20) UNIQUE NOT NULL,
  filename VARCHAR(255) NOT NULL,
  file_hash VARCHAR(64),
  file_size INTEGER,
  changelog TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_firmware_version ON firmware_versions(version DESC);
CREATE INDEX idx_firmware_active ON firmware_versions(is_active);
```

---

## 8. Mobile App Integration (Reference)

The app will:
1. Call `GET /api/firmware/latest` to check for updates
2. If newer version, call `GET /api/firmware/:version/download` to fetch binary
3. Verify SHA256 hash matches metadata
4. Push binary to ESP32 over BLE using GATT characteristic
5. Monitor progress and display status to user

---

## 9. Implementation Summary

### Phase 1 (Current)
- [x] Database migration
- [x] Firmware model
- [ ] Upload API endpoint (#264)
- [ ] Download API endpoint

### Phase 2
- [ ] Fetch latest endpoint
- [ ] List versions endpoint
- [ ] Version control logic (#266)

### Phase 3
- [ ] Testing with simulated ESP32 (#267)
- [ ] Admin dashboard integration
- [ ] Telemetry/analytics

---

## 10. Future Enhancements
- Cloud storage integration (AWS S3)
- Automatic firmware signing
- Rollback mechanism via web dashboard
- Firmware statistics (versions deployed, update success rate)
- Scheduled maintenance windows

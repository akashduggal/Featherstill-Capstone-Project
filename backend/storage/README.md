# Firmware Storage Directory

This directory stores ESP32 firmware binary files for Over-The-Air (OTA) updates.

## Structure

```
storage/
└── firmware/
    ├── 1.0.0.bin       (Example: Featherstill v1.0.0 firmware)
    ├── 1.1.0.bin       (Example: Featherstill v1.1.0 firmware)
    └── 1.2.0.bin       (Example: Featherstill v1.2.0 firmware)
```

## Guidelines

### File Naming
- Files are named using semantic versioning: `X.Y.Z.bin`
- Example: `1.0.0.bin`, `1.2.5.bin`
- Invalid names will be rejected by the API

### File Size
- Maximum firmware file size: **2MB**
- Each file occupies disk space permanently (for rollback capability)
- Storage quota: **100MB** (easily expandable)

### Integrity Verification
- Every file has a SHA256 hash stored in the database
- Hashes are used by the mobile app to verify downloaded files
- Corrupted files should be reuploaded with a new version

### Manual Cleanup
- Files are NEVER automatically deleted
- To remove old versions, manually delete the `.bin` file and clear the database record
- Always keep at least one active firmware version for devices to download

## Usage

### Upload via API
```bash
curl -X POST http://localhost:3000/api/firmware/upload \
  -H "Authorization: Bearer <admin-token>" \
  -F "file=@firmware_1.0.0.bin" \
  -F "version=1.0.0" \
  -F "changelog=Initial release"
```

### Download via API
```bash
curl http://localhost:3000/api/firmware/1.0.0/download \
  -o firmware_1.0.0.bin
```

### List all versions
```bash
curl http://localhost:3000/api/firmware/versions
```

## Security Notes

- Uploads are **admin-only** and require authentication
- All uploads are logged with timestamp and user ID
- Rate limiting: Max 5 uploads per admin per hour
- File integrity is verified via SHA256 hash

## Troubleshooting

| Issue | Solution |
|-------|----------|
| File not found after upload | Check `/storage/firmware/` exists and has write permissions |
| Upload fails with file size error | Ensure firmware file is < 2MB |
| Hash mismatch on download | Reupload firmware file, previous version may be corrupted |
| Unauthorized error | Check admin token is valid and included in Authorization header |

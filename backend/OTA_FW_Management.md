OTA Firmware Management System

This document describes the OTA (Over-The-Air) firmware backend flow, including upload, storage, release management, and compatibility handling.

Overview

The OTA system supports:

Firmware upload and storage (S3-based)
Version-controlled firmware management
Controlled release flow (manual promotion)
Public access for device firmware retrieval
Backward compatibility with older firmware records

Architecture Flow
1. Upload Flow
Admin uploads:
Firmware binary (.bin)
Optional image (.png/.jpg/etc)
Files are stored in AWS S3
Metadata stored in database

2. Storage

Firmware stored as:

firmware/{version}.bin

Images stored as:

firmware-images/{version}_{timestamp}_{filename}
Database stores:
version
storage_key
image_url
file_hash
file_size

3. Release Flow

Separated into two steps:

Upload
Stores firmware
Does NOT make it active
Promote (Mark Latest)
Admin explicitly marks firmware as latest
Ensures controlled rollout

4. Device Flow

Devices interact with public endpoints:

Get latest firmware
GET /api/firmware/latest

Response:

{
  "version": "1.2.0",
  "download_url": "...",
  "image_url": "..."
}


Download firmware
GET /api/firmware/:version/download

Returns S3 URL for firmware binary.

Access Control

Admin-only endpoints
Upload firmware
Mark firmware as latest
View firmware list
Public endpoints
Get latest firmware
Download firmware


Database Changes

Added fields to support S3 storage:

image_url
storage_key
image_key
Constraint

Only one firmware can be active:

CREATE UNIQUE INDEX unique_active_firmware
ON firmware_versions (is_active)
WHERE is_active = true;

Storage Changes

Before
Files stored locally
Served via backend file streaming
After
Files stored in S3
Backend returns download URL


Backward Compatibility

System supports older firmware records:

Nullable S3 fields (image_url, storage_key)
APIs handle missing values gracefully
Existing devices continue working without changes

Testing Coverage

Validated:

Firmware upload (binary + image)
S3 storage integration
Latest firmware retrieval
Download flow via S3
Compatibility with older records
Edge cases (invalid file, duplicate version, etc.)


Future Improvements

Pre-signed URLs for secure downloads
Stronger file validation (type/size)
Retry mechanism for S3 uploads
Monitoring for firmware usage and failures

Summary

The OTA system now provides:

Scalable storage using S3
Controlled firmware release flow
Clean separation between upload and activation
Stable and backward-compatible device interaction
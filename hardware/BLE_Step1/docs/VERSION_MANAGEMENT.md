# Hardware Firmware - Version Management & Release Notes

**Component**: ESP32 BLE OTA Firmware  
**Directory**: `hardware/BLE_Step1/`

## Table of Contents
1. [Versioning System](#versioning-system)
2. [Release Notes Template](#release-notes-template)
3. [Changelog Management](#changelog-management)
4. [Version Tracking Procedures](#version-tracking-procedures)
5. [Release Process](#release-process)

---

## Versioning System

### Semantic Versioning (SemVer)

Featherstill uses Semantic Versioning 2.0.0 format: **MAJOR.MINOR.PATCH**

#### Format: `X.Y.Z`

- **X (MAJOR)**: Breaking changes, significant feature releases
- **Y (MINOR)**: New features, backwards compatible
- **Z (PATCH)**: Bug fixes, minor improvements

#### Examples:
- `1.0.0` - Initial production release
- `1.1.0` - New battery metrics feature
- `1.1.1` - Bug fix for BLE connection issue
- `2.0.0` - Complete OTA system overhaul

### Pre-release Versions

Append tags for development versions:

```
1.0.0-alpha.1    # Alpha release candidate
1.0.0-beta.1     # Beta release
1.0.0-rc.1       # Release candidate
```

### Build Metadata

Add build info after `+`:

```
1.0.0+build.20260417
1.0.0+esp32.5.5.2
```

### Version Assignment Rules

| Scenario | Version Change |
|----------|----------------|
| New critical features | MINOR bump |
| Security patches | PATCH bump |
| Bug fixes | PATCH bump |
| API breaking changes | MAJOR bump |
| Internal refactoring | No change |
| Dependency updates | PATCH or MINOR |
| Performance improvements | PATCH bump |

### Component Versioning

Each component tracks its own version:

| Component | Version | File |
|-----------|---------|------|
| **Backend** | 1.0.0 | `backend/package.json` |
| **Frontend** | 1.0.0 | `frontend/package.json` |
| **Hardware/Firmware** | 1.0.0 | `hardware/BLE_Step1/CMakeLists.txt` |
| **Database Schema** | 1.0.0 | `backend/migrations/` |

---

## Release Notes Template

### Standard Release Notes Format

Create file: `RELEASE_v{VERSION}.md`

```markdown
# Featherstill v{X.Y.Z} Release Notes

**Release Date**: {YYYY-MM-DD}
**Target Components**: Backend, Frontend, Hardware

---

## Overview

{2-3 sentence summary of major changes and improvements}

---

## 🎉 New Features

- **Feature Name**: Brief description of new capability
- **Feature Name**: How user benefits from this feature

### Usage Examples

\`\`\`javascript
// Example usage of new feature
const example = newFeature();
\`\`\`

---

## 🐛 Bug Fixes

- Fixed BLE connection timeout when device not in range
- Corrected battery percentage calculation for LiFePO4 chemistry
- Resolved OTA update failure on poor network connection
- Fixed memory leak in telemetry sync service

---

## ⚡ Performance Improvements

- Reduced app startup time by 40% (1.2s → 0.7s)
- Optimized BLE scan algorithm for 50% faster device discovery
- Decreased backend API response time by 25%
- Reduced battery drain from 2% to 0.5% per hour

---

## 🔒 Security Updates

- Updated authentication tokens to use RS256 algorithm
- Implemented rate limiting on API endpoints
- Fixed SQL injection vulnerability in battery query
- Enhanced firmware signature verification

---

## ⚠️ Breaking Changes

- **Removed**: Legacy CSV export format (use JSON instead)
- **API**: `/api/v1/battery/status` endpoint replaced with `/api/v2/battery/latest`
- **Database**: Schema migration required (see below)

### Migration Guide

\`\`\`sql
-- Run these migrations before updating to v{X.Y.Z}
ALTER TABLE battery_readings ADD COLUMN cell_variance FLOAT;
CREATE INDEX idx_readings_timestamp ON battery_readings(created_at);
\`\`\`

---

## 📝 Changelog

### Backend (v{X.Y.Z})
- Updated Express.js to ^5.2.1
- Implemented new battery metrics endpoint
- Added email notifications for low battery alerts

### Frontend (v{X.Y.Z})
- Redesigned settings screen with tabs
- Added dark mode support
- Improved responsive layout for tablets

### Hardware/Firmware (v{X.Y.Z})
- Improved BLE advertisement speed
- Fixed OTA update resume capability
- Added firmware version in system info service

---

## 📊 Statistics

| Metric | Value |
|--------|-------|
| Commits | 47 |
| Files Changed | 89 |
| Lines Added | 3,421 |
| Lines Removed | 1,247 |
| Issues Resolved | 23 |
| Contributors | 4 |

---

## 🔗 Links & Resources

- [Full Changelog](./CHANGELOG.md)
- [GitHub Release](https://github.com/akashduggal/Featherstill-Capstone-Project/releases/tag/v{X.Y.Z})
- [Installation Guide](./INSTALLATION.md)
- [API Documentation](./docs/API.md)

---

## ⚠️ Known Issues

- BLE pairing may fail on iOS 15 with iOS 18 devices (workaround: restart app)
- Telemetry sync stalls when network switches between WiFi/cellular
- Battery percentage shows -1% briefly during boot

---

## 🙏 Thanks

Special thanks to all contributors who helped with testing, reporting issues, and feedback.

---

## Download

- [Backend Release](https://github.com/akashduggal/Featherstill-Capstone-Project/releases/download/v{X.Y.Z}/backend.tar.gz)
- [Frontend APK](https://github.com/akashduggal/Featherstill-Capstone-Project/releases/download/v{X.Y.Z}/Featherstill-v{X.Y.Z}.apk)
- [Firmware Binary](https://github.com/akashduggal/Featherstill-Capstone-Project/releases/download/v{X.Y.Z}/firmware-v{X.Y.Z}.bin)

---

**End of Release Notes v{X.Y.Z}**
```

---

## Changelog Management

### CHANGELOG.md Structure

Create and maintain: `CHANGELOG.md` in project root

```markdown
# Changelog

All notable changes to the Featherstill project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Added
- New feature coming soon

### Changed
- Ongoing improvements

### Fixed
- Issues being addressed

---

## [1.1.0] - 2026-05-15

### Added
- Battery temperature trend analysis
- New Celsius/Fahrenheit temperature unit toggle
- Email alerts for anomaly detection

### Changed
- Improved BLE advertising interval for better discovery
- Updated backend authentication to JWT v2
- Refactored telemetry sync engine

### Fixed
- Fixed crash on rapid BLE disconnect/reconnect cycles
- Corrected voltage calculation for Series configuration
- Fixed memory leak in long-running battery sync

### Security
- Updated dependencies to patch CVE-2026-1234
- Implemented HTTPS enforcement

---

## [1.0.0] - 2026-04-15

### Added
- Initial release of Featherstill battery monitoring system
- BLE wireless battery monitoring
- Real-time voltage, current, temperature tracking
- OTA firmware update capability
- Mobile app dashboard with charts
- Backend API with battery data storage
- Authentication and user management
- Telemetry sync service

### Known Issues
- iOS connection issues on first pairing
- Occasional OTA timeout on poor networks

---

[Unreleased]: https://github.com/akashduggal/Featherstill-Capstone-Project/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/akashduggal/Featherstill-Capstone-Project/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/akashduggal/Featherstill-Capstone-Project/releases/tag/v1.0.0
```

### Changelog Categories

Use these standard categories:

```
### Added      - New features
### Changed    - Changes in existing functionality
### Deprecated - Soon-to-be removed features
### Removed    - Removed features
### Fixed      - Bug fixes
### Security   - Security updates
```

### Updating CHANGELOG.md

1. **Before Release**: Move "Unreleased" section to new version with date
2. **Include**: All commits, PRs, and significant changes
3. **Links**: Add comparison links at bottom
4. **Review**: Check for completeness and accuracy

---

## Version Tracking Procedures

### Step 1: Update Version Numbers

#### Backend (`backend/package.json`)
```json
{
  "name": "featherstill-backend",
  "version": "1.1.0"
}
```

#### Frontend (`frontend/package.json`)
```json
{
  "name": "fetherstill",
  "version": "1.1.0"
}
```

#### Hardware Firmware

Add to `hardware/BLE_Step1/CMakeLists.txt`:
```cmake
set(PROJECT_VERSION "1.1.0")
set(PROJECT_VERSION_MAJOR 1)
set(PROJECT_VERSION_MINOR 1)
set(PROJECT_VERSION_PATCH 0)
```

Or in firmware code (`ble_ota.h`):
```c
#define FIRMWARE_VERSION_MAJOR 1
#define FIRMWARE_VERSION_MINOR 1
#define FIRMWARE_VERSION_PATCH 0
#define FIRMWARE_VERSION "1.1.0"
```

#### Database Schema

Update migration file with version:
```sql
-- migrations/003-schema-v1.1.0.sql
-- Featherstill Database Schema v1.1.0
-- Release Date: 2026-05-15
```

### Step 2: Git Tagging

```bash
# Create annotated tag
git tag -a v1.1.0 -m "Release version 1.1.0 - Battery temperature analysis"

# Push tag to remote
git push origin v1.1.0

# List all tags
git tag -l

# Show tag details
git show v1.1.0
```

### Step 3: Version Documentation

Create a version mapping document (`VERSION_HISTORY.md`):

```markdown
# Version History

| Version | Release Date | Backend | Frontend | Firmware | Major Changes |
|---------|--------------|---------|----------|----------|---------------|
| 1.1.0 | 2026-05-15 | ✓ | ✓ | ✓ | Temperature analysis, JWT v2 |
| 1.0.0 | 2026-04-15 | ✓ | ✓ | ✓ | Initial release |

## Component Compatibility

### v1.1.0 Compatibility Matrix
- Backend 1.1.0 ↔ Frontend 1.1.0 ✓
- Frontend 1.1.0 ↔ Firmware 1.1.0 ✓
- Backend 1.1.0 ↔ Firmware 1.1.0 ✓
- Node.js: >=14.0.0
- ESP-IDF: >=5.5.2
- Expo SDK: >=54.0.0
```

### Step 4: Release Checklist

Before releasing, verify:

- [ ] All tests passing
- [ ] Code reviewed and merged to main
- [ ] Version numbers updated in all files
- [ ] CHANGELOG.md updated
- [ ] Release notes created
- [ ] Git tag created
- [ ] Build artifacts generated
- [ ] Deployment tested on staging
- [ ] Documentation updated
- [ ] PR/Issue links verified

---

## Release Process

### Pre-Release Phase

```bash
# 1. Create release branch
git checkout -b release/v1.1.0

# 2. Update versions
# - backend/package.json
# - frontend/package.json
# - hardware version constants
# - CHANGELOG.md
# - VERSION_HISTORY.md

# 3. Commit changes
git commit -m "chore: Bump version to 1.1.0"

# 4. Create pull request for review
```

### Release Phase

```bash
# 1. Merge to main
git checkout main
git pull origin main
git merge release/v1.1.0
git push origin main

# 2. Create Git tag
git tag -a v1.1.0 -m "Release v1.1.0: Battery temperature analysis"

# 3. Push tag
git push origin v1.1.0

# 4. Build artifacts
npm run build        # Frontend
npm install && npm run build  # Backend
idf.py build         # Firmware
```

### Post-Release Phase

```bash
# 1. Create GitHub Release with release notes
# 2. Upload build artifacts
# 3. Update documentation site
# 4. Notify users via email/changelog
# 5. Create v1.2.0-dev branch for next cycle
# 6. Update project roadmap
```

### Version Rollback

If release has critical issues:

```bash
# 1. Revert tag
git tag -d v1.1.0
git push origin :refs/tags/v1.1.0

# 2. Revert commits
git revert HEAD~5..HEAD

# 3. Push revert
git push origin main

# 4. Create hotfix branch
git checkout -b hotfix/v1.0.1
# Fix issues...
# Tag as v1.0.1
```

---

## Usage Examples

### Checking Component Versions

```bash
# Backend version
grep '"version"' backend/package.json

# Frontend version
grep '"version"' frontend/package.json

# Git tags
git describe --tags --abbrev=0

# Firmware version (in code output)
# "System version: 1.1.0" shown during boot
```

### Setting Version for Build

```bash
# Export version for build scripts
VERSION=$(grep '"version"' backend/package.json | cut -d'"' -f4)
echo "Building version: $VERSION"

# Use in Docker
docker build --build-arg VERSION=$VERSION -t featherstill:$VERSION .
```

---

## Best Practices

✅ **DO:**
- Follow semantic versioning strictly
- Update versions before release
- Create annotated Git tags
- Document all changes in CHANGELOG
- Test version compatibility before release
- Keep version consistent across components
- Use clear, descriptive commit messages

❌ **DON'T:**
- Skip version updates
- Use random versioning schemes
- Forget to tag releases
- Release without changelog updates
- Version individual components separately
- Use vague release notes
- Push to production without testing

---

## References

- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [npm Versioning](https://docs.npmjs.com/cli/v8/commands/npm-version)
- [Git Tagging](https://git-scm.com/book/en/v2/Git-Basics-Tagging)
- [Common Version Mistakes](https://semver.org/#spec-item-7)

---

## Support

For versioning questions:
- Check git log: `git log --oneline | head -20`
- View current tags: `git tag -l`
- Compare versions: `git diff v1.0.0..v1.1.0`

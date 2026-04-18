# User Firmware Update Guide

**Component**: ESP32 BLE Battery Monitor  
**Audience**: End Users

---

## Table of Contents

1. [Before You Update](#before-you-update)
2. [Update Methods](#update-methods)
3. [Mobile App Update](#mobile-app-update)
4. [Troubleshooting](#troubleshooting)
5. [Frequently Asked Questions](#frequently-asked-questions)
6. [Support](#support)

---

## Before You Update

### Pre-Update Checklist

Before starting the firmware update, verify:

- [ ] **Charged Battery**: Device battery should be ≥50% charged
- [ ] **Stable Connection**: Good WiFi/Bluetooth signal (move closer to router if needed)
- [ ] **Time Available**: Update takes 5-10 minutes. Don't interrupt.
- [ ] **Read Release Notes**: Check what's new in the update
- [ ] **Backup Data**: Export battery logs if you need them (optional)
- [ ] **Device Unlocked**: ESP32 device is physically accessible if needed

### System Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Mobile App Version | 1.0.0 | Latest |
| Device Battery | 50% | 75% or higher |
| Bluetooth Signal | -70 dBm | -50 dBm or stronger |
| Update Duration | — | 10 minutes |
| Connection Stability | Good | Excellent |

### What Gets Updated?

The firmware update includes:

✅ **Battery Monitoring Firmware** - Core functionality  
✅ **BLE Communication Stack** - Wireless protocol  
✅ **Sensor Calibration Data** - (Factory defaults applied)  
❌ **Your Custom Settings** - Preserved after update  
❌ **Battery History** - Retained on device  

---

## Update Methods

### Method 1: Mobile App Update (Recommended)

**Easiest method for most users**

#### Step 1: Check for Updates

1. Open **Featherstill mobile app**
2. Navigate to **Settings** → **Device Settings**
3. Tap **Check for Updates**
4. App displays available versions

#### Step 2: Review Update Details

```
┌─────────────────────────────────┐
│  Available Update               │
├─────────────────────────────────┤
│  Current Version: 1.0.0         │
│  Available Version: 1.0.1       │
│  Release Date: 2026-04-25       │
│  Size: 960 KB                   │
│  Features:                      │
│  • Bug fixes                    │
│  • Performance improvements     │
│  • Better temperature accuracy  │
│                                 │
│  [Cancel]  [Download]           │
└─────────────────────────────────┘
```

3. Read the **Release Notes** (scroll down)
4. Check **What's New** section
5. Tap **Download** to proceed

#### Step 3: Download Firmware

```
Downloading Update...
[████████████░░░░░░░░░░] 45%

⏱️  Estimated time: 2-3 minutes
📊 Speed: 128 KB/s
💡 Keep Bluetooth enabled
```

**Wait for download to complete.** Do NOT:
- ❌ Close app
- ❌ Disconnect device
- ❌ Turn off phone

#### Step 4: Confirm Update

When download complete:

```
┌─────────────────────────────────┐
│  Update Ready                   │
├─────────────────────────────────┤
│  Downloaded: 960 KB             │
│  CRC Check: ✓ Verified          │
│                                 │
│  Ready to install?              │
│                                 │
│  [Cancel]  [Install Update]     │
└─────────────────────────────────┘
```

⚠️ **Important**: Ensure device battery ≥50% before proceeding

Tap **Install Update**

#### Step 5: Monitor Installation

```
Installing Update...
[████████████████░░░░░] 85%

⏱️  Time remaining: 1-2 minutes
🔄 Do NOT interrupt
📱 Keep app open
```

**Watch the progress bar.** Update typically takes:
- Download: 2-5 minutes
- Installation: 3-5 minutes
- **Total: 5-10 minutes**

#### Step 6: Verify Completion

When complete, you'll see:

```
┌─────────────────────────────────┐
│  ✓ Update Successful            │
├─────────────────────────────────┤
│  New Version: 1.0.1             │
│  Installation Time: 6 min       │
│                                 │
│  Device rebooting...            │
│  [Close]                        │
└─────────────────────────────────┘
```

3. Device automatically **reboots** (10-15 seconds)
4. Reconnect to device when prompted
5. Verify new version in **Settings** → **About Device**

Expected display after update:
```
Device Information
─────────────────
Name: Featherstill BMS
Model: ESP32-BLE
Version: 1.0.1  ✓ Updated
```

---

## Mobile App Update

### Automatic Update Notifications

The app can notify you of available updates:

1. Open **Settings** → **Notifications**
2. Enable **"Firmware Updates"**
3. Choose notification frequency:
   - Immediate (as soon as available)
   - Daily digest
   - Weekly summary

When enabled, you'll receive notifications like:
```
🔔 Update Available
New firmware v1.0.1 released
→ Tap to install
```

### Manual Update Check

To manually check anytime:

1. **Settings** → **Device Settings**
2. Tap **"Check Update"** button
3. App connects and retrieves version info
4. Shows available versions (if any)

### Update History

View past updates in **Settings** → **Device Settings** → **Update History**:

```
Update History
──────────────
1.0.1 ✓ Installed 2026-04-25 09:15
  🔧 Bug fixes + performance
  Duration: 6 min

1.0.0 ✓ Installed 2026-04-15 14:32
  🎉 Initial release
  Duration: 7 min
```

---

## Manual Update (Advanced)

### For Technical Users Only

If app update fails, you can update via USB:

#### Requirements
- Windows PC / Mac / Linux
- USB cable
- Python 3.7+
- Update script

#### Steps

1. **Download update package**:
   - Visit: [Featherstill Releases](https://github.com/akashduggal/Featherstill-Capstone-Project/releases)
   - Download `.bin` file (e.g., `firmware-1.0.1.bin`)

2. **Connect device**:
   ```bash
   # Plug in USB cable to device
   # File transfer mode, NOT charging mode
   ```

3. **Run update script**:
   ```bash
   python firmware_update.py --file firmware-1.0.1.bin --port COM3
   ```

4. **Wait for completion**:
   ```
   [████████████████████] 100%
   ✓ Update successful
   Device will reboot automatically
   ```

⚠️ **Do NOT unplug** until complete!

---

## Troubleshooting

### Update Hangs at 50%

**Symptom**: Progress stuck at 50% for >2 minutes

**Solutions** (try in order):

1. **Move closer to router**
   - Update over BLE, so distance matters
   - Move device within 1-2 meters of phone

2. **Reduce interference**
   - Turn off WiFi on other devices
   - Move away from microwave/cordless phones
   - Avoid crowded WiFi channels

3. **Restart update**
   - Tap **Cancel** in app
   - Wait 30 seconds
   - Tap **Check for Updates** again
   - Retry installation

### Update Fails with "Connection Lost"

**Symptom**: Error message: "Bluetooth connection lost"

**Solutions**:

1. **Reconnect device**
   - Tap **"Reconnect Device"** in app
   - Wait for BLE connection
   - Retry update

2. **Check device battery**
   - Ensure battery ≥50% charged
   - Charge device if needed
   - Retry after charging

3. **Reset device**
   - Unplug device
   - Wait 10 seconds
   - Replug device
   - Reconnect in app
   - Retry update

### Update Fails with "CRC Error"

**Symptom**: Error: "Firmware integrity check failed"

**Solutions**:

1. **Retry download**
   - Tap **Cancel**
   - Wait 1 minute
   - Tap **Check for Updates**
   - Redownload firmware

2. **Clear app cache** (if persistent)
   - **Android**: Settings → Apps → Featherstill → Storage → Clear Cache
   - **iOS**: Offload app, reinstall from App Store

3. **Contact support**
   - If error persists
   - Provide error code: `CRC-XXXXX`

### Device Won't Connect After Update

**Symptom**: App can't find device after update completes

**Solutions**:

1. **Wait for reboot**
   - Device takes 15-30 seconds to restart
   - Wait before attempting to reconnect

2. **Manually reconnect**
   - Tap **"Rescan Devices"** in app
   - Look for "Featherstill" in device list
   - Tap device name to pair

3. **Force restart device**
   - Hold power button for 10 seconds
   - Device should power cycle
   - Reconnect via Bluetooth

4. **Reset device to factory**
   - Last resort option (see below)

---

## Rollback (Downgrade)

### If New Firmware Has Issues

If update causes problems, you can **downgrade** to previous version:

#### Via Mobile App

1. **Settings** → **Device Settings**
2. Tap **"Downgrade Firmware"**
3. Select **previous version** (e.g., 1.0.0)
4. Tap **"Install Previous Version"**
5. Follow same installation steps

This restores your **previous working version**.

#### Manual Rollback

```bash
# Download previous firmware version
python firmware_update.py --file firmware-1.0.0.bin --port COM3

# Device reboots with old version
```

---

## Factory Reset

### Complete Device Reset

If all else fails, perform factory reset:

⚠️ **WARNING**: Erases all custom settings and battery history!

#### Steps

1. **Hold RESET button** for 10 seconds
   - Button location on device (see diagram)
   - LED will flash red then green
   - Release when green flash starts

2. **Wait for reboot** (15-30 seconds)
   - Blue LED indicates ready
   - Device is now factory reset

3. **Reconfigure device**
   - Reconnect in mobile app
   - Re-enter any custom sensors settings
   - Re-calibrate if needed

#### Alternative (Software)

```bash
# Via USB
python firmware_update.py --action factory-reset --port COM3

# Device erases settings
# Reboots to factory state
```

---

## Frequently Asked Questions

### Q: How often should I update?

**A**: Update when:
- 🔔 You receive update notification
- 🐛 You encounter a bug mentioned in update
- ⚡ New features interest you
- 🔒 Security update is released

**Recommendation**: Check for updates **monthly**

### Q: Will update erase my data?

**A**: Battery history is **preserved**. Update only changes:
- Firmware code
- Bug fixes
- Performance improvements

Your **battery logs** and **past readings** remain unchanged.

### Q: Can I skip an update?

**A**: Yes, updates are optional unless marked "🔒 Security Critical"

**Recommendations**:
- Always install security updates
- Install major version updates (1.0 → 2.0)
- Skip patch updates if not needed

### Q: Update failed. What do I do?

**A**: Try in order:

1. **Retry update** - Often temporary connection issue
2. **Move closer** - Check Bluetooth signal strength
3. **Restart device** - Power off/on firmware
4. **Clear app cache** - Remove temporary files
5. **Contact support** - If still failing

### Q: How long does update take?

**A**: Typical duration:

```
Download:    2-5 minutes
Upload:      3-5 minutes  
Install:     1-2 minutes
Reboot:      0-1 minutes
─────────────────────────
Total:       5-10 minutes
```

Varies by device, connection speed, and firmware size.

### Q: Do I need WiFi for update?

**A**: **No**, but it helps download faster.

- **Bluetooth only**: Updates via device BLE (slower, 10-15 min)
- **WiFi + Bluetooth**: Faster download, then BLE transfer (5-10 min)

### Q: Is it safe to update?

**A**: Yes, very safe. The update process includes:

✅ **Dual-partition system** - Old version preserved if something goes wrong  
✅ **CRC verification** - Every data block checked  
✅ **Signature validation** - Firmware authenticity verified  
✅ **Automatic rollback** - Reverts if boot fails  

**Risk level**: Very Low

### Q: What if power fails during update?

**A**: Device has protection:

1. Update installs to **inactive partition**
2. If power fails: **Old version remains active**
3. Next boot: Old firmware runs
4. You can **retry update** when power restored

**No data loss** in event of power failure

### Q: Can multiple devices update together?

**A**: **Not recommended**. Update one device at a time:

1. Update Device A → Wait for complete
2. Update Device B → Then start
3. Update Device C → etc.

Updating multiple devices simultaneously may cause **Bluetooth interference**.

---

## Preparation Guide

### Before Major Update (v1.0 → v2.0)

1. **Export battery data** (optional backup):
   - Settings → Export Data → Save CSV file
   - Upload to email/cloud for safekeeping

2. **Note custom settings**:
   - Screenshot sensor configuration
   - Note calibration values
   - Record alert thresholds

3. **Charge device**:
   - Plug in overnight
   - Ensure battery >75%

4. **Test connection**:
   - Move device near router
   - Check Bluetooth signal (≥2 bars)
   - Confirm app connects properly

5. **Schedule update**:
   - Pick quiet time (no interruptions)
   - Plan for 10-15 minutes
   - Don't schedule during critical moments

---

## Update Checklist

Use this before each update:

```
Pre-Update Checklist
════════════════════════════════════
☐ Device charged (≥50%)
☐ Bluetooth connection stable
☐ Mobile app latest version
☐ Release notes reviewed
☐ Data backed up (if needed)
☐ Device unlocked/accessible
☐ WiFi available (optional)
☐ 10-15 minutes available
☐ No scheduled tasks running

Installation Checklist
════════════════════════════════════
☐ Download started
☐ Download completed (100%)
☐ CRC check passed
☐ Ready to install prompt shown
☐ Battery sufficient (≥50%)
☐ Installation started
☐ Progress monitored
☐ Installation completed (100%)
☐ Device rebooted successfully
☐ Device reconnected to app

Post-Update Checklist
════════════════════════════════════
☐ New version displayed in settings
☐ All features working normally
☐ Battery readings accurate
☐ Sensor data displaying
☐ No error messages
☐ Bluetooth stable
☐ App responsive
```

---

## Support & Help

### Getting Help

**In-App Help**:
- Tap **Help** → **Firmware Update** → Search topic
- Live chat available during business hours

**Online Resources**:
- [Full Documentation](../docs/)
- [FAQ Page](https://featherstill.com/faq)
- [Video Tutorial](https://youtube.com/watch?v=featherstill-update)

**Report Issues**:
- Email: support@featherstill.com
- Subject: "Firmware Update Issue"
- Include: Device model, update version, error code

### Contact Support

**Email**: support@featherstill.com  
**Phone**: +1-800-XXX-XXXX  
**Hours**: Monday-Friday, 9 AM - 5 PM EST  
**Chat**: [Live Chat](https://featherstill.com/support)

---

## Quick Reference Card

Print and keep handy:

```
┌────────────────────────────────────┐
│   FEATHERSTILL UPDATE GUIDE        │
├────────────────────────────────────┤
│ UPDATE STEPS:                      │
│ 1. Settings → Check for Updates    │
│ 2. Review Release Notes            │
│ 3. Tap Download                    │
│ 4. Tap Install                     │
│ 5. Wait 5-10 minutes               │
│ 6. Device reboots automatically    │
│                                    │
│ TROUBLESHOOTING:                   │
│ • Move closer to router            │
│ • Charge device to 50%+            │
│ • Restart app                      │
│ • Contact support                  │
│                                    │
│ Version: 1.0.0                     │
│ Last Updated: 2026-04-17           │
└────────────────────────────────────┘
```

---

**Last Updated**: April 17, 2026  
**Document Version**: 1.0.0  
**Next Review**: July 2026

# Featherstill Release & Deployment Runbook

This document outlines the standard operating procedure for preparing a new release of the Featherstill app. Because we manage a physical Bluetooth connection to the ESP32 BMS, strict version control is required to track which app versions support which firmware versions.

## 1. Pre-Release Checklist
Before cutting a new release, ensure the following:
- [ ] The current branch is up to date with `main`.
- [ ] ESP32 BLE connection has been tested on a physical device (not just an emulator).
- [ ] All development/debug logs are removed or disabled.

## 2. Bumping the App Version
We use manual semantic versioning. Before initiating a build, you **must** update the version numbers in `app.json`.

Open `app.json` and locate the `expo` object:

1. **`version` (Semantic Versioning):** Update the public-facing version string (`Major.Minor.Patch`).
   * *Major:* Breaking UI changes or new BMS hardware support.
   * *Minor:* New features (e.g., adding a new telemetry graph).
   * *Patch:* Bug fixes and minor tweaks.
   
2. **`ios.buildNumber`:**
   Increment this string by `1` for **every** new build sent to Apple TestFlight/App Store. Apple will reject the binary if this number is not unique.

3. **`android.versionCode`:**
   Increment this integer by `1` for **every** new build sent to the Google Play Console. Google Play will reject the binary if this number is not higher than the previous release.

**Example `app.json` configuration:**
```json
{
  "expo": {
    "version": "1.0.1", 
    "ios": {
      "buildNumber": "2" 
    },
    "android": {
      "versionCode": 2 
    }
  }
}
```

## 3. Building for Production
Once the versions are bumped and committed, generate the production binaries using Expo Application Services (EAS).

To build for Android (AAB for Play Store):
```Bash
eas build --platform android --profile production
```

To build for iOS (IPA for TestFlight/App Store):
```Bash
eas build --platform ios --profile production
```

To build for both platforms simultaneously:
```Bash
eas build --platform all --profile production
```

## 4. Post-Build
Once EAS finishes, download the binaries from your Expo dashboard or follow the CLI prompts to auto-submit to the respective app stores. Verify that the new version number displays correctly in the App Settings screen.
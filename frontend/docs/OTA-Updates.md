# Fetherstill Over-The-Air (OTA) Updates Runbook

This document outlines the infrastructure and commands for managing Over-The-Air (OTA) updates using `expo-updates`. OTA updates allow us to push JavaScript and asset changes directly to our users without going through App Store or Google Play reviews.

**Important:** You cannot update native code (e.g., updating `react-native-ble-plx`, changing app icons, modifying `AndroidManifest.xml`) via EAS Update. If a native change is required, you must bump the native version numbers and submit a new binary.

## 1. Prerequisites & Initialization

Before using OTA updates, the project must be linked to an Expo account and the updates package must be installed.

1. **Install the package:** `npx expo install expo-updates`
2. **Link the project:** `eas init` (This injects a unique `projectId` into `app.json`. Never delete this).
3. **Configure the app:** `eas update:configure`

## 2. Configuration (`app.json`)

When configured, your `app.json` must enforce the `appVersion` policy. This is critical for safety—it ensures an OTA update containing new React Native code isn't applied to an older native binary that doesn't support it.

```json
{
  "expo": {
    "updates": {
      "url": "[https://u.expo.dev/YOUR-PROJECT-ID](https://u.expo.dev/YOUR-PROJECT-ID)"
    },
    "runtimeVersion": {
      "policy": "appVersion"
    }
  }
}
```

## 3. Publishing a Hotfix

Updates are pushed to specific **branches** (e.g., `production`, `preview`), which are linked to **channels** built into the native app.

To push an OTA update:
1. Ensure you are on the correct Git branch.
2. Run the update command:
   ```bash
   eas update --branch production --message "Fix: Corrected voltage chart rendering bug"
   ```

## 4. Expo Cloud Management

All OTA updates and builds should be monitored via the Expo Dashboard at `expo.dev`.

* **Branches vs. Channels:** When you publish an update, you publish to a *Branch*. The Expo dashboard maps that Branch to a *Channel*. The native app binary is hardcoded to listen only to the Channel it was built with.
* **Rollbacks:** If a bad OTA update is pushed, you cannot "delete" it. You must log into the Expo Dashboard, navigate to the **Updates** tab, and re-publish the previous known-good update to the active branch.
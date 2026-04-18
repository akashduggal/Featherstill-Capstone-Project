# Fetherstill Over-The-Air (OTA) Updates Runbook

This document outlines the infrastructure and commands for managing Over-The-Air (OTA) updates using `expo-updates`. OTA updates allow us to push JavaScript and asset changes directly to our users without going through App Store or Google Play reviews.

**Important:** You cannot update native code (e.g., updating `react-native-ble-plx`, changing app icons, modifying `AndroidManifest.xml`) via EAS Update. If a native change is required, you must bump the native version numbers and submit a new binary.

## 1. Prerequisites & Initialization

Before using OTA updates, the project must be linked to an Expo account and the updates package must be installed.

1. **Install the package:** `npx expo install expo-updates`
2. **Link the project:** `eas init` (This injects a unique `projectId` into `app.json`. Never delete this).
3. **Configure the app:** `eas update:configure`

## 2. Versioning Strategy

The versioning strategy is critical for ensuring that Over-the-Air (OTA) updates are delivered to compatible app versions. We follow a strategy that combines semantic versioning (SemVer) with Expo's `runtimeVersion` policy.

### `runtimeVersion`

The `runtimeVersion` is configured in `app.config.js` to use the `appVersion` policy. This means the runtime version is directly tied to the version specified in `package.json`.

```javascript
// app.config.js
{
  // ...
  runtimeVersion: {
    policy: 'appVersion',
  },
  // ...
}
```

This configuration ensures that an OTA update is only compatible with builds that have the exact same version number from `package.json`. When a native dependency changes, the app version in `package.json` must be incremented, which creates a new runtime version. This prevents OTA updates intended for older binaries from being applied to newer binaries with different native code.

### App Versioning (`package.json`)

We use a semantic versioning (SemVer) approach for the `version` field in `package.json`:

- **MAJOR (e.g., 2.0.0)**: Incremented for breaking native changes that are not backward compatible.
- **MINOR (e.g., 1.1.0)**: Incremented for new features, whether they are native or JavaScript-based. This also includes non-breaking changes to native code.
- **PATCH (e.g., 1.0.1)**: Incremented for bug fixes, which can be either native or JavaScript-based.

By following this strategy, we can safely deliver OTA updates to our users while maintaining compatibility with the native code on their devices.

## 3. Publishing a Hotfix

Updates are pushed to specific **branches** (e.g., `production`, `staging`), which are linked to **channels** built into the native app.

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
# Fetherstill Mobile Application - Core Screens & Navigation Structure

## 1. Navigation Overview

The application follows a split navigation pattern consisting of two primary stacks:
1.  **Auth Stack (Guest/Login):** Handles user onboarding and authentication.
2.  **App Stack (Core Application):** The main interface for authenticated users.

### High-Level Flow
* **App Launch** -> Check Authentication State
    * *If Logged Out* -> Navigate to **Login Screen**.
    * *If Logged In* -> Navigate to **Module Select Screen**.

---

## 2. Auth Stack (Guest/Login)

The entry point for users who do not have an active session.

### A. Login Screen
* **Purpose:** Allow users to authenticate via Google or continue as a guest.
* **Key Components:**
    * **Brand Logo:** Fetherstill shield icon centrally placed.
    * **Google Sign-In Button:** Primary action for users with credentials.
    * **Guest Access Button:** Option to "Continue as Guest".
* **Transitions:**
    * *On Success:* Navigate to **Module Select Screen**.

---

## 3. App Stack (Core Application)

The primary interface for interacting with the ESP32 BMS modules.

### A. Module Select Screen (Entry Point)
* **Purpose:** The first screen users see after login. It scans for nearby Bluetooth devices and allows the user to pick which cart/module to connect to.
* **Key Components:**
    * **Scanner:** Continuously scans for BLE devices.
    * **Device List:** Scrollable list of discovered modules (e.g., `mod-s123...`).
    * **Signal Strength:** Visual indicator of connection quality (RSSI).
* **Transitions:**
    * *On Device Tap:* Connect to module and navigate to **Main Tab Navigator**.

### B. Main Tab Navigator (Connected View)
Once a module is selected, this becomes the active view. Users can swipe left/right (Instagram-style) to switch between monitoring and settings.

#### Tab 1: Dashboard (Home)
* **Purpose:** Real-time monitoring of the connected BMS module.
* **Key Components:**
    * **Summary Card:** Displays Min/Max Voltage, Total Voltage, and Current.
    * **State of Charge (SoC):** Visual battery percentage bar.
    * **Voltage Grid:** Scrollable list of V1 - V16 cell voltages.
* **Behavior:**
    * Default view after selecting a module.

#### Tab 2: Settings
* **Purpose:** Device management and application configuration.
* **Key Components:**
    * **User Info:** Displays current user.
    * **Module Info:** Displays currently connected Module ID.
    * **Preferences:** Toggle Temperature Units (C/F), Auto-Refresh interval.
    * **Disconnect/Sign Out:** Options to unpair the device or log out.

---

## 4. Component Hierarchy Reference

### Root
* `App.js` -> `RootNavigator`

### Navigation Structure
* **AuthNavigator (Stack)**
    * `LoginScreen`
* **AppNavigator (Stack)**
    * `ModuleSelectScreen` (Initial App Screen)
    * `MainTabNavigator` (Tab View)
        * `DashboardScreen`
        * `SettingsScreen`

### Shared Components (src/components)
* `BrandLogo`
* `ScreenContainer`
* `DeviceListItem` (For Module Select Screen)
* `DataCard` (For Dashboard)
* `VoltageGrid` (For Dashboard)
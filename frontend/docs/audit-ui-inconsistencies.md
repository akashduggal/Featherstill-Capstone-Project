# Audit: UI Inconsistencies Across Screens

## 1. Status Bar Overlap
All tab screens (Dashboard, Bluetooth, Settings) use hardcoded `paddingTop: 50` instead of system-aware safe area insets. App content renders behind the system status bar (battery icon, clock, signal indicators), making the top of each screen unreadable. This affects both iOS and Android devices with varying notch/status bar heights.

**Affected files:** `dashboard.jsx`, `bluetooth.js`, `settings.jsx`

## 2. Home Screen Displayed After Login
After logging in or continuing as guest, the app lands on the Home screen which is a component showcase with no functional purpose. Users have to manually navigate to Bluetooth or Dashboard.

**Affected files:** `_layout.js`, `(tabs)/_layout.js`, `(tabs)/home.js`

## 3. Home Tab Visible in Tab Bar
The Home tab is still visible in the tab bar despite having no user-facing functionality. The tab bar should only show Bluetooth, Dashboard, and Settings.

**Affected files:** `(tabs)/_layout.js`

## 4. Hardcoded Colors on Home Screen
The Home screen uses hardcoded color values (`#f5f5f5` background, `#007AFF` avatar) instead of the theme system (`Colors[theme]`). It does not support dark mode.

**Affected files:** `(tabs)/home.js`

## 5. Bluetooth Screen Unstyled
The Bluetooth screen uses inline styles and default React Native `<Button>` and `<Text>` components with no theming. It does not match the design system used by Dashboard and Settings.

**Affected files:** `(tabs)/bluetooth.js`

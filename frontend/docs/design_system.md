# Fetherstill Design System

## 1. Design Principles
* **Adaptive Theming:** The interface respects the user's OS preference via dynamic light and dark mode mappings (`useColorScheme`).
* **Data-Centric:** Telemetry data is the hero. It must be legible and high-contrast.
* **Ambient Alerting:** Users should intuitively recognize hardware state via color psychology (Red = Danger, Yellow = Imbalance, Blue = Under-temp).

---

## 2. Color Palette & Dynamic Themes

The app utilizes `React Native`'s `useColorScheme()` to dynamically swap between `light` and `dark` palettes defined in `constants/Colors.js`.

### Primary Global Tokens
* **Brand Tint (Indigo):** `#6366F1` (Light) / `#818CF8` (Dark)
    * *Usage:* Primary Buttons, Active Tab Icons, Links.
* **Background:** `#F8FAFC` (Light) / `#0F172A` (Dark)
    * *Usage:* Main Screen Backgrounds.
* **Surface / Card Node:** `#FFFFFF` (Light) / `#1E293B` (Dark)
    * *Usage:* Data Cards, Modals, Tab Bars.
* **Borders / Separators:** `#E2E8F0` (Light) / `#334155` (Dark)

### Alert Color Palettes (Telemetry Alert Engine)
Warnings have been overhauled into solid, readable blocks matching payload contexts:
* **Critical (Error):** Deep Red (`#7F1D1D`) background with Bright Red (`#EF4444`) boundaries.
    * *Usage:* Overvoltage, Battery Too Hot, Deep Discharge.
* **Warning (Imbalance/Under-Voltage):** Deep Yellow (`#3D3000`) background with Yellow (`#EAB308`) boundaries.
    * *Usage:* High Cell Delta/Imbalance, Cell approaching discharge.
* **Info (Cold):** Deep Blue (`#1E3A5F`) background with Blue (`#3B82F6`) boundaries.
    * *Usage:* Sensor temps below 0°C.

---

## 3. Typography
*System Font Stack (San Francisco on iOS, Roboto on Android)*

| Style | Size (sp) | Weight | Usage |
| :--- | :--- | :--- | :--- |
| **Heading 1** | 24 | Bold | Screen Titles |
| **Heading 2** | 20 | Semi-Bold | Section Headers |
| **Body Large** | 16 | Regular | Input text, List item titles |
| **Body Medium** | 14 | Regular | Labels, Secondary info |
| **Caption** | 12 | Regular | Timestamp, Version info |
| **Data Huge** | 32 | Bold | Main Voltage Display |

---

## 4. Components & Interactive Elements

### A. Action Buttons
**1. Solid Primary Button**
* **Background:** Theme Tint (`#818CF8`)
* **Text:** Always Light (`#FFFFFF`), Bold
* **Radius:** 12px (Premium modern feel)
* **Loading State:** Replaces text with a centered `ActivityIndicator`.

**2. Outline / Secondary Action**
* **Background:** Transparent
* **Border:** 1px Solid Card Border
* **Text:** Theme Tint
* **Usage:** "Disconnect", "Scan"

### B. Hardware Visualization (SVG)
**1. Thermometer SVG Block (`ThermometerIcon.js`)**
* Mathematically rigid boundaries corresponding to `0-60°C` and `32-140°F`.
* Height scales dynamically with fill ratio.
* Mercury color transitions functionally (Blue -> Green -> Orange -> Red) as raw data scales.

**2. State of Charge Matrix**
* Dynamic internal battery sizing based on calculated SoC percentage limits (`d.stateOfCharge`).

### C. Data Container Cards
* **Core Padding:** 16px inset.
* **Radius:** Layouts map exactly to 16px corner limits.
* **Separators:** 1px width, standardizing visual list breaks.

### D. Navigation Nodes (Tabs)
* Uses `expo-router` bottom bars.
* Background dynamically fills surface themes (`#1E293B` or `#ffffff`).
* Top border caps using identical card border tokens to prevent visual bleeding.

---

## 5. Spacing & Grid System
* **Base Unit:** 4px
* **Screen Padding:** 16px horizontally.
* **List Row Gaps:** 12px.
* **Corner Geometry:** 
    * Modular Containers: 16px
    * Active Elements (Buttons): 12px

## 6. Icon Libraries
* *Library:* `Ionicons` (via `@expo/vector-icons`)
* **Dashboard:** `speedometer-outline`
* **Settings:** `settings-outline`
* **Alert States:** `warning`, `alert-circle`, `information-circle`
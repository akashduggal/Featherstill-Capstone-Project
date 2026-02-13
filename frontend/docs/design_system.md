# Fetherstill Design System

## 1. Design Principles
* **Dark-First:** The interface is designed primarily for dark mode to reduce glare in outdoor/golf-cart environments.
* **Data-Centric:** Telemetry data is the hero. It must be legible and high-contrast.
* **Feedback-Oriented:** Users should always know the system status via clear visual indicators.

---

## 2. Color Palette (Updated)

### Primary Colors
* **Brand Tint (Indigo):** **`#6366F1` (Light) / `#818CF8` (Dark)**
    * *Usage:* Primary Buttons, Active Tab Icons, Links, "Active" states.
    * *Note:* Replaces the previous Brand Green.
* **Background Dark:** **`#0F172A`**
    * *Usage:* Main Screen Backgrounds (matches `Colors.dark.background`).
* **Surface / Card:** **`#1E293B`**
    * *Usage:* Cards, List Items, Bottom Navigation Bar (matches `Colors.dark.card`).
* **Card Border:** **`#334155`**
    * *Usage:* Dividers and Card Borders.

### Functional Colors
* **Success:** **`#34D399`**
    * *Usage:* "Connected" status, Full Battery, Safe values.
* **Error / Danger:** **`#F87171`**
    * *Usage:* Sign Out Button, "Disconnect" actions, Critical Alerts.
* **Warning:** **`#FBBF24`**
    * *Usage:* Low Battery Warning, Weak Signal Strength.
* **Info:** **`#60A5FA`**
    * *Usage:* Informational toasts or hints.

### Typography Colors
* **Text Primary:** **`#F1F5F9`**
    * *Usage:* Headings, Primary Data Values (matches `Colors.dark.text`).
* **Text Secondary / Icon:** **`#94A3B8`**
    * *Usage:* Labels, Descriptions, Unfocused inputs (matches `Colors.dark.icon`).

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

## 4. Components & Elements

### A. Buttons
**1. Primary Button**
* **Background:** **Brand Tint (`#818CF8`)**
* **Text:** White (`#FFFFFF`), Bold
* **Radius:** 12px (Updated for modern feel)
* **Usage:** "Sign In", "Connect", "Save Changes"

**2. Secondary / Outline Button**
* **Background:** Transparent
* **Border:** 1px Solid **Card Border (`#334155`)**
* **Text:** **Brand Tint (`#818CF8`)**
* **Usage:** "Scan", "Sign Out"

### B. Cards (Data Containers)
* **Background:** **Surface (`#1E293B`)**
* **Border:** 1px Solid **Card Border (`#334155`)**
* **Border Radius:** 16px
* **Padding:** 16px
* **Shadow:** None (Flat design) or Low elevation
* **Usage:** Summary Card, Individual Device List Items.

### C. Data Visualization
**1. Progress Bar (State of Charge)**
* **Track:** Dark Slate (`#334155`)
* **Indicator:** **Success Green (`#34D399`)**
    * *Note:* While the brand is Indigo, battery status should still utilize Green/Yellow/Red for universal understanding.
* **Height:** 12px (Rounded ends)

**2. Voltage Grid Item**
* **Container:** Small rectangular box, **Surface Elevated (`#334155`)**.
* **Label:** "V1" (Text Secondary).
* **Value:** "3.58 V" (Text Primary).

### D. Navigation
**1. Bottom Tab Bar**
* **Background:** **Surface (`#1E293B`)**
* **Active Tint:** **Brand Tint (`#818CF8`)**
* **Inactive Tint:** **Text Secondary (`#94A3B8`)**
* **Border:** Top border 1px solid **Card Border (`#334155`)**

---

## 5. Spacing & Layout
* **Base Unit:** 4px
* **Screen Padding:** 16px or 24px
* **Component Gap:** 16px
* **Corner Radius:** * Cards: 16px
    * Buttons: 12px

## 6. Icons (Vector)
* *Library:* `Ionicons`
* **Dashboard:** `speedometer-outline`
* **Settings:** `settings-outline`
* **Bluetooth:** `bluetooth` / `bluetooth-outline`
* **Brand Logo:** `flash` (Indigo color)
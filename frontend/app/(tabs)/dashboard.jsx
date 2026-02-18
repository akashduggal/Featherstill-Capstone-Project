import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "../../constants/Colors";

// ---------------------------------------------------------------------------
// Static battery data — will be replaced with live BLE data from ESP32 later
// ---------------------------------------------------------------------------
const BATTERY_DATA = {
  nominalVoltage: 51.2,
  capacityWh: 5222,
  minCellVoltage: 3.57,
  maxCellVoltage: 3.62,
  totalBatteryVoltage: 57.44,
  cellTemperature: 25.0,
  currentAmps: -19.83,
  outputVoltage: 56.87,
  stateOfCharge: 100, // percentage 0-100
  chargingStatus: "INACTIVE",
  cellVoltages: [
    3.58, 3.6, 3.59, 3.59, 3.6, 3.57, 3.62, 3.62, 3.59, 3.58, 3.57, 3.58,
    3.59, 3.58, 3.58, 3.6,
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns a colour on a red → yellow → green gradient for 0 → 100 %. */
function batteryColor(pct) {
  // clamp
  const p = Math.max(0, Math.min(100, pct));
  if (p <= 50) {
    // red (0) → yellow (50)
    const ratio = p / 50;
    const r = 255;
    const g = Math.round(200 * ratio);
    return `rgb(${r},${g},0)`;
  }
  // yellow (50) → green (100)
  const ratio = (p - 50) / 50;
  const r = Math.round(255 * (1 - ratio));
  const g = 200;
  return `rgb(${r},${g},0)`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** A native battery icon whose fill % and colour reflect the charge level. */
function BatteryIcon({ percentage, size = 48 }) {
  const w = size * 2;
  const h = size;
  const borderW = 2;
  const tipW = size * 0.1;
  const tipH = h * 0.4;
  const innerW = w - borderW * 2 - 4;
  const innerH = h - borderW * 2 - 4;
  const fillW = (innerW * Math.min(100, Math.max(0, percentage))) / 100;
  const color = batteryColor(percentage);

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {/* Battery body */}
      <View
        style={{
          width: w,
          height: h,
          borderWidth: borderW,
          borderColor: Colors.dark.text,
          borderRadius: 6,
          justifyContent: "center",
          padding: 2,
        }}
      >
        {/* Fill */}
        <View
          style={{
            width: fillW,
            height: innerH,
            backgroundColor: color,
            borderRadius: 3,
          }}
        />
      </View>
      {/* Positive terminal nub */}
      <View
        style={{
          width: tipW,
          height: tipH,
          backgroundColor: Colors.dark.text,
          borderTopRightRadius: 3,
          borderBottomRightRadius: 3,
        }}
      />
    </View>
  );
}

/** A single stat tile shown in the 2-column grid. */
function StatTile({ label, value, unit, valueColor }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, valueColor && { color: valueColor }]}>
        {value}
        {unit ? ` ${unit}` : ""}
      </Text>
    </View>
  );
}

/** A single cell-voltage entry. */
function CellVoltage({ index, voltage }) {
  return (
    <View style={styles.cellItem}>
      <Text style={styles.cellLabel}>V{index}</Text>
      <Text style={styles.cellValue}>{voltage.toFixed(3)} V</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function Dashboard() {
  const router = useRouter();
  const d = BATTERY_DATA;

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
    >
      {/* ── Title ──────────────────────────────────────────────── */}
      <Text style={styles.title}>Fetherstill Data Console</Text>

      {/* ── Subtitle ───────────────────────────────────────────── */}
      <Text style={styles.subtitle}>
        Battery Data – {d.nominalVoltage}V | {d.capacityWh.toLocaleString()}Wh
      </Text>

      {/* ── Stats Grid ─────────────────────────────────────────── */}
      <View style={styles.statsGrid}>
        <StatTile label="Min Cell Voltage" value={d.minCellVoltage.toFixed(3)} />
        <StatTile label="Max Cell Voltage" value={d.maxCellVoltage.toFixed(3)} />

        <StatTile
          label="Total Battery Voltage"
          value={d.totalBatteryVoltage.toFixed(3)}
        />
        <StatTile
          label="Cell Temperature"
          value={`${d.cellTemperature.toFixed(1)} °C`}
        />

        <StatTile
          label="Current (A)"
          value={d.currentAmps.toFixed(3)}
          valueColor={Colors.dark.error}
        />
        <StatTile label="Output Voltage" value={d.outputVoltage.toFixed(3)} />
      </View>

      {/* ── State of Charge & Charging Status ──────────────────── */}
      <View style={styles.socRow}>
        <View style={styles.socBlock}>
          <Text style={styles.statLabel}>State of Charge</Text>
          <BatteryIcon percentage={d.stateOfCharge} size={36} />
          <Text style={styles.socPct}>{d.stateOfCharge}%</Text>
        </View>

        <View style={styles.socBlock}>
          <Text style={styles.statLabel}>Charging Status</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{d.chargingStatus}</Text>
          </View>
        </View>
      </View>

      {/* ── Cells Voltages ─────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>Cells Voltages</Text>

      <View style={styles.cellsGrid}>
        {d.cellVoltages.map((v, i) => (
          <CellVoltage key={i} index={i + 1} voltage={v} />
        ))}
      </View>

    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  container: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },

  /* Title / Subtitle */
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.dark.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.dark.text,
    marginBottom: 20,
  },

  /* Stats Grid */
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statTile: {
    width: "48%",
    marginBottom: 16,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.dark.icon,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.dark.text,
  },

  /* SOC Row */
  socRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
  },
  socBlock: {
    width: "48%",
    gap: 6,
  },
  socPct: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.dark.text,
    marginTop: 2,
  },

  /* Charging Status Badge */
  badge: {
    alignSelf: "flex-start",
    borderWidth: 1.5,
    borderColor: Colors.dark.text,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.dark.text,
  },

  /* Cells Voltages */
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.dark.text,
    marginBottom: 14,
  },
  cellsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  cellItem: {
    width: "48%",
    marginBottom: 14,
  },
  cellLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.dark.accent,
  },
  cellValue: {
    fontSize: 16,
    color: Colors.dark.text,
  },

});
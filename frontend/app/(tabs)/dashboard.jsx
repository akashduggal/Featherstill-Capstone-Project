import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { Colors } from "../../constants/Colors";
import { BatteryIcon, StatTile, CellVoltage } from "../../components";

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
// Main Component
// ---------------------------------------------------------------------------
export default function Dashboard() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? "dark" : "light";
  const colors = Colors[theme];
  const d = BATTERY_DATA;

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.container}
    >
      {/* ── Title ──────────────────────────────────────────────── */}
      <Text style={[styles.title, { color: colors.text }]}>
        Fetherstill Data Console
      </Text>

      {/* ── Subtitle ───────────────────────────────────────────── */}
      <Text style={[styles.subtitle, { color: colors.text }]}>
        Battery Data – {d.nominalVoltage}V | {d.capacityWh.toLocaleString()}Wh
      </Text>

      {/* ── Stats Grid ─────────────────────────────────────────── */}
      <View style={styles.statsGrid}>
        <StatTile label="Min Cell Voltage" value={d.minCellVoltage.toFixed(3)} colors={colors} />
        <StatTile label="Max Cell Voltage" value={d.maxCellVoltage.toFixed(3)} colors={colors} />

        <StatTile
          label="Total Battery Voltage"
          value={d.totalBatteryVoltage.toFixed(3)}
          colors={colors}
        />
        <StatTile
          label="Cell Temperature"
          value={`${d.cellTemperature.toFixed(1)} °C`}
          colors={colors}
        />

        <StatTile
          label="Current (A)"
          value={d.currentAmps.toFixed(3)}
          valueColor={colors.error}
          colors={colors}
        />
        <StatTile label="Output Voltage" value={d.outputVoltage.toFixed(3)} colors={colors} />
      </View>

      {/* ── State of Charge & Charging Status ──────────────────── */}
      <View style={styles.socRow}>
        <View style={styles.socBlock}>
          <Text style={[styles.statLabel, { color: colors.icon }]}>
            State of Charge
          </Text>
          <BatteryIcon percentage={d.stateOfCharge} size={36} colors={colors} />
          <Text style={[styles.socPct, { color: colors.text }]}>
            {d.stateOfCharge}%
          </Text>
        </View>

        <View style={styles.socBlock}>
          <Text style={[styles.statLabel, { color: colors.icon }]}>
            Charging Status
          </Text>
          <View style={[styles.badge, { borderColor: colors.text }]}>
            <Text style={[styles.badgeText, { color: colors.text }]}>
              {d.chargingStatus}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Cells Voltages ─────────────────────────────────────── */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Cells Voltages
      </Text>

      <View style={styles.cellsGrid}>
        {d.cellVoltages.map((v, i) => (
          <CellVoltage key={i} index={i + 1} voltage={v} colors={colors} />
        ))}
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles (theme-independent layout only)
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
  },

  /* Stats Grid */
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
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
    marginTop: 2,
  },

  /* Charging Status Badge */
  badge: {
    alignSelf: "flex-start",
    borderWidth: 1.5,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "700",
  },

  /* Cells Voltages */
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 14,
  },
  cellsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
});
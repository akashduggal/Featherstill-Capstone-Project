import React, { useContext } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { Colors } from "../../constants/Colors";
import {
  BatteryIcon,
  StatTile,
  CellVoltage,
  ThermometerIcon,
  CellImbalanceWarning,
} from "../../components";
import { BLEContext } from "../../context/BLEContext";

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function Dashboard() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? "dark" : "light";
  const colors = Colors[theme];
  const { telemetryData } = useContext(BLEContext);

  if (!telemetryData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <Text style={[styles.title, { color: colors.text }]}>Waiting for Telemetry Data...</Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>Connect to a device from the Bluetooth screen.</Text>
      </View>
    );
  }

  const d = {
    nominalVoltage: 51.2, // This can be a constant or derived if needed
    capacityWh: 5222, // This can be a constant or derived if needed
    minCellVoltage: Math.min(...telemetryData.cell_mv) / 1000,
    maxCellVoltage: Math.max(...telemetryData.cell_mv) / 1000,
    totalBatteryVoltage: telemetryData.pack_total_mv / 1000,
    cellTemperature: telemetryData.temp_ts1_c_x100 / 100,
    currentAmps: telemetryData.current_ma / 1000,
    outputVoltage: telemetryData.pack_ld_mv / 1000,
    stateOfCharge: telemetryData.soc,
    chargingStatus: telemetryData.current_ma > 0 ? "CHARGING" : "INACTIVE",
    cellVoltages: telemetryData.cell_mv.map(v => v / 1000),
  };

  // Compute cell voltage stats for highlighting min/max & imbalance
  const minV = Math.min(...d.cellVoltages);
  const maxV = Math.max(...d.cellVoltages);
  const voltageDelta = maxV - minV;

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
          label="Current (A)"
          value={d.currentAmps.toFixed(3)}
          valueColor={d.currentAmps > 0 ? colors.success : colors.error}
          colors={colors}
        />

        <StatTile label="Output Voltage" value={d.outputVoltage.toFixed(3)} colors={colors} />

        {/* Cell Temperature with thermometer */}
        <View style={styles.tempTile}>
          <Text style={[styles.statLabel, { color: colors.icon }]}>
            Cell Temperature
          </Text>
          <View style={styles.tempValueRow}>
            <Text style={[styles.tempValue, { color: colors.text }]}>
              {d.cellTemperature.toFixed(1)} °C
            </Text>
            <ThermometerIcon
              temperature={d.cellTemperature}
              colors={colors}
            />
          </View>
        </View>
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

      {/* ── Cell Imbalance Warning ──────────────────────────────── */}
      <CellImbalanceWarning delta={voltageDelta} threshold={0.2} colors={colors} />

      {/* ── Cells Voltages ─────────────────────────────────────── */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Cells Voltages
      </Text>

      <View style={styles.cellsGrid}>
        {d.cellVoltages.map((v, i) => (
          <CellVoltage
            key={i}
            index={i + 1}
            voltage={v}
            isMin={v === minV}
            isMax={v === maxV}
            colors={colors}
          />
        ))}
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles (theme-independent layout only — center-aligned for mobile)
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40,
    alignItems: "center",
  },

  /* Title / Subtitle */
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
  },

  /* Stats Grid */
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
    width: "100%",
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    textAlign: "center",
  },

  /* Temperature tile in stats grid */
  tempTile: {
    width: "48%",
    marginBottom: 16,
    alignItems: "center",
  },
  tempValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tempValue: {
    fontSize: 18,
    fontWeight: "700",
  },

  /* SOC Row */
  socRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-start",
    marginBottom: 28,
    width: "100%",
  },
  socBlock: {
    width: "48%",
    alignItems: "center",
    gap: 6,
  },
  socPct: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 2,
    textAlign: "center",
  },

  /* Charging Status Badge */
  badge: {
    borderWidth: 1.5,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },

  /* Cells Voltages */
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 14,
    textAlign: "center",
  },
  cellsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
    width: "100%",
  },
});
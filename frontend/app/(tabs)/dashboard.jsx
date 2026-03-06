import React, { useContext, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useColorScheme,
  RefreshControl,
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
import { useSettings } from "../../context/SettingsContext";

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function Dashboard() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? "dark" : "light";
  const colors = Colors[theme];
  const { telemetryData } = useContext(BLEContext);
  const { autoRefresh } = useSettings();

  // ── Manual refresh state ──────────────────────────────────────
  const [refreshing, setRefreshing] = useState(false);
  const [snapshot, setSnapshot] = useState(null);

  // When autoRefresh is OFF, display the snapshot; when ON, display live data
  const displayData = autoRefresh ? telemetryData : (snapshot || telemetryData);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Grab the latest telemetry as a snapshot
    if (telemetryData) {
      setSnapshot({ ...telemetryData });
    }
    // Brief animation delay to feel natural
    setTimeout(() => setRefreshing(false), 800);
  }, [telemetryData]);

  if (!displayData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <Text style={[styles.title, { color: colors.text }]}>Waiting for Telemetry Data...</Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>Connect to a device from the Bluetooth screen.</Text>
      </View>
    );
  }

  const d = {
    nominalVoltage: 51.2,
    capacityWh: 5222,
    minCellVoltage: Math.min(...displayData.cell_mv) / 1000,
    maxCellVoltage: Math.max(...displayData.cell_mv) / 1000,
    totalBatteryVoltage: displayData.pack_total_mv / 1000,
    cellTemperature: displayData.temp_ts1_c_x100 / 100,
    currentAmps: displayData.current_ma / 1000,
    outputVoltage: displayData.pack_ld_mv / 1000,
    stateOfCharge: displayData.soc,
    chargingStatus: displayData.current_ma > 0 ? "CHARGING" : "INACTIVE",
    cellVoltages: displayData.cell_mv.map(v => v / 1000),
  };

  // Compute cell voltage stats for highlighting min/max & imbalance
  const minV = Math.min(...d.cellVoltages);
  const maxV = Math.max(...d.cellVoltages);
  const voltageDelta = maxV - minV;

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.container}
      refreshControl={
        !autoRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.tint}
            colors={[colors.tint]}
            title="Pull to refresh"
            titleColor={colors.icon}
          />
        ) : undefined
      }
    >
      {/* ── Title ──────────────────────────────────────────────── */}
      <Text style={[styles.title, { color: colors.text }]}>
        Fetherstill Data Console
      </Text>

      {/* ── Subtitle ───────────────────────────────────────────── */}
      <Text style={[styles.subtitle, { color: colors.text }]}>
        Battery Data – {d.nominalVoltage}V | {d.capacityWh.toLocaleString()}Wh
      </Text>

      {/* ── Mode indicator ─────────────────────────────────────── */}
      {!autoRefresh && (
        <Text style={[styles.modeHint, { color: colors.icon }]}>
          Auto-refresh off · Pull down to refresh
        </Text>
      )}

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
          valueColor={colors.error}
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

  /* Mode hint */
  modeHint: {
    fontSize: 13,
    fontWeight: "500",
    fontStyle: "italic",
    marginBottom: 16,
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
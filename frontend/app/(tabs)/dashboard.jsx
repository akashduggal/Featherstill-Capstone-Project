import React, { useContext, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useColorScheme,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from "../../constants/Colors";
import {
  BatteryIcon,
  StatTile,
  CellVoltage,
  ThermometerIcon,
  CellImbalanceWarning,
  Button, // use existing UI Button component
} from "../../components";
import { BLEContext } from "../../context/BLEContext";
import { useSettings } from "../../context/SettingsContext";
import { postBatteryReading, testConnectivity } from "../../services/batteryApi";

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function Dashboard() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? "dark" : "light";
  const colors = Colors[theme];

  // BLEContext may be present but its value can be undefined; guard access
  const bleCtx = useContext(BLEContext) || {};
  const telemetryData = bleCtx.telemetryData || null;

  const { autoRefresh } = useSettings();

  // ── Manual refresh state ──────────────────────────────────────
  const [refreshing, setRefreshing] = useState(false);
  const [snapshot, setSnapshot] = useState(null);

  // Posting state
  const [isPosting, setIsPosting] = useState(false);
  const [postStatus, setPostStatus] = useState("idle");
  const [lastPostTime, setLastPostTime] = useState(null);
  const [lastResponse, setLastResponse] = useState(null);

  // When autoRefresh is OFF, display the snapshot; when ON, display live data
  const displayData = autoRefresh ? telemetryData : (snapshot || telemetryData);

  // Hardcoded battery id for testing
  const batteryId = "primary-battery";

  // Post battery data to backend
  const handlePostBatteryData = async () => {
    if (!displayData) {
      Alert.alert("No data", "No telemetry available to post.");
      return;
    }
    if (isPosting) return;
    setIsPosting(true);
    setPostStatus("posting");

    // NEW: quick connectivity check
    const conn = await testConnectivity();
    console.log('[Dashboard] Connectivity check:', conn);
    if (!conn.success) {
      setIsPosting(false);
      const msg = conn.error ? `${conn.error}` : `HTTP ${conn.status || 'unknown'}`;
      Alert.alert("Connection Error", `Cannot reach API: ${msg}`);
      return;
    }

    try {
      const cell_mv = Array.isArray(displayData.cell_mv) ? displayData.cell_mv : [];
      const cellVoltages = cell_mv.map((v) => v / 1000);
      const minCellVoltage = cellVoltages.length ? Math.min(...cellVoltages) : 0;
      const maxCellVoltage = cellVoltages.length ? Math.max(...cellVoltages) : 0;

      const payload = {
        nominalVoltage: 51.2,
        capacityWh: 5222,
        minCellVoltage,
        maxCellVoltage,
        totalBatteryVoltage: (displayData.pack_total_mv || 0) / 1000,
        cellTemperature: (displayData.temp_ts1_c_x100 || 0) / 100,
        currentAmps: (displayData.current_ma || 0) / 1000,
        outputVoltage: (displayData.pack_ld_mv || 0) / 1000,
        stateOfCharge: displayData.soc || 0,
        chargingStatus: (displayData.current_ma || 0) > 0 ? "CHARGING" : "INACTIVE",
        cellVoltages,
      };

      const email = "test@example.com"; // hardcoded for backend validation

      const result = await postBatteryReading(payload, email, batteryId);
      // store raw result for quick debugging in UI (truncated display below)
      try { setLastResponse(JSON.stringify(result)); } catch (e) { setLastResponse(String(result)); }

      if (result.success) {
        setLastPostTime(new Date().toLocaleTimeString());
        setPostStatus("success");
        console.log("✓ Battery data posted successfully");
        Alert.alert("Success", "Battery data posted successfully");
      } else {
        setPostStatus("error");
        console.error("✗ Failed to post battery data:", result.error);
        Alert.alert("Post Failed", `Could not post battery data: ${result.error}`);
      }
    } catch (err) {
      setPostStatus("error");
      console.error("✗ Unexpected error posting battery data:", err);
      Alert.alert("Error", "Unexpected error posting battery data");
    } finally {
      setIsPosting(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (telemetryData) setSnapshot({ ...telemetryData });
    setTimeout(() => setRefreshing(false), 800);
  }, [telemetryData]);

  if (!displayData) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={[styles.container, { justifyContent: 'center' }]}>
          <Text style={[styles.title, { color: colors.text }]}>Waiting for Telemetry Data...</Text>
          <Text style={[styles.subtitle, { color: colors.text }]}>Connect to a device from the Bluetooth screen.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const d = {
    nominalVoltage: 51.2,
    capacityWh: 5222,
    minCellVoltage: Math.min(...(displayData.cell_mv || [0])) / 1000,
    maxCellVoltage: Math.max(...(displayData.cell_mv || [0])) / 1000,
    totalBatteryVoltage: (displayData.pack_total_mv || 0) / 1000,
    cellTemperature: (displayData.temp_ts1_c_x100 || 0) / 100,
    currentAmps: (displayData.current_ma || 0) / 1000,
    outputVoltage: (displayData.pack_ld_mv || 0) / 1000,
    stateOfCharge: displayData.soc || 0,
    chargingStatus: (displayData.current_ma || 0) > 0 ? "CHARGING" : "INACTIVE",
    cellVoltages: (displayData.cell_mv || []).map(v => v / 1000),
  };

  const minV = Math.min(...d.cellVoltages);
  const maxV = Math.max(...d.cellVoltages);
  const voltageDelta = maxV - minV;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
    <ScrollView
      style={styles.scrollView}
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
      <Text style={[styles.title, { color: colors.text }]}>Fetherstill Data Console</Text>

      <Button title={isPosting ? 'Sending...' : 'Send Test Reading'} onPress={handlePostBatteryData} disabled={isPosting} />

      {/* Post status / diagnostics */}
      <View style={{ marginTop: 8, marginBottom: 12, alignItems: "center" }}>
        <Text style={[styles.small, { color: colors.icon }]}>Post status: {postStatus}</Text>
        {lastPostTime && <Text style={[styles.small, { color: colors.text }]}>Last posted: {lastPostTime}</Text>}
        {lastResponse ? (
          <Text numberOfLines={3} ellipsizeMode="tail" style={[styles.small, { color: colors.icon }]}>
            Response: {lastResponse.length > 200 ? `${lastResponse.slice(0,200)}…` : lastResponse}
          </Text>
        ) : null}
      </View>

      <Text style={[styles.subtitle, { color: colors.text }]}>
        Battery Data – {d.nominalVoltage}V | {d.capacityWh.toLocaleString()}Wh
      </Text>

      {!autoRefresh && (
        <Text style={[styles.modeHint, { color: colors.icon }]}>Auto-refresh off · Pull down to refresh</Text>
      )}

      <View style={styles.statsGrid}>
        <StatTile label="Min Cell Voltage" value={d.minCellVoltage.toFixed(3)} colors={colors} />
        <StatTile label="Max Cell Voltage" value={d.maxCellVoltage.toFixed(3)} colors={colors} />
        <StatTile label="Total Battery Voltage" value={d.totalBatteryVoltage.toFixed(3)} colors={colors} />
        <StatTile label="Current (A)" value={d.currentAmps.toFixed(3)} valueColor={colors.error} colors={colors} />
        <StatTile label="Output Voltage" value={d.outputVoltage.toFixed(3)} colors={colors} />

        <View style={styles.tempTile}>
          <Text style={[styles.statLabel, { color: colors.icon }]}>Cell Temperature</Text>
          <View style={styles.tempValueRow}>
            <Text style={[styles.tempValue, { color: colors.text }]}>{d.cellTemperature.toFixed(1)} °C</Text>
            <ThermometerIcon temperature={d.cellTemperature} colors={colors} />
          </View>
        </View>
      </View>

      <View style={styles.socRow}>
        <View style={styles.socBlock}>
          <Text style={[styles.statLabel, { color: colors.icon }]}>State of Charge</Text>
          <BatteryIcon percentage={d.stateOfCharge} size={36} colors={colors} />
          <Text style={[styles.socPct, { color: colors.text }]}>{d.stateOfCharge}%</Text>
        </View>

        <View style={styles.socBlock}>
          <Text style={[styles.statLabel, { color: colors.icon }]}>Charging Status</Text>
          <View style={[styles.badge, { borderColor: colors.text }]}>
            <Text style={[styles.badgeText, { color: colors.text }]}>{d.chargingStatus}</Text>
          </View>
        </View>
      </View>

      <CellImbalanceWarning delta={voltageDelta} threshold={0.2} colors={colors} />

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Cells Voltages</Text>

      <View style={styles.cellsGrid}>
        {d.cellVoltages.map((v, i) => (
          <CellVoltage key={i} index={i + 1} voltage={v} isMin={v === minV} isMax={v === maxV} colors={colors} />
        ))}
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles (theme-independent layout only — center-aligned for mobile)
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 40,
    alignItems: "center",
  },
  small: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
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
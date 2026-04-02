import React, { useContext, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
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
  TelemetryAlertBanner,
  Button,
} from "../../components";
import { BluetoothConnectionUI } from "../../components/BluetoothConnectionUI";
import { BLEContext } from "../../context/BLEContext";
import { useSettings } from "../../context/SettingsContext";
import { postBatteryReading, testConnectivity } from "../../services/batteryApi";

/* ============================================================
   TELEMETRY VALIDATION THRESHOLDS (PLACEHOLDERS)
   These values determine when to show warning/error banners 
   on the dashboard. Adjust these limits as hardware testing 
   progresses.
============================================================ */
const THRESHOLDS = {
  // Temperature (°C)
  TEMP_MAX: 45, // Show error if cell temperature exceeds 45°C
  TEMP_MIN: 0,  // Show warning if cell temperature drops below 0°C
  
  // State of Charge (%)
  SOC_WARNING_MIN: 15, // Show warning if battery level drops below 15%
  
  // Cell Voltage (V)
  CELL_V_MAX: 4.2, // Overvoltage error threshold
  CELL_V_MIN: 3.0, // Deep discharge warning threshold
  
  // Cell Imbalance (V)
  IMBALANCE_MAX: 0.2, // Show warning if (max cell V - min cell V) > 0.2V
};

export default function Dashboard() {
  const theme = "dark";
  const colors = Colors[theme];

  const bleCtx = useContext(BLEContext) || {};
  const telemetryData = bleCtx.telemetryData || null;
  const connectedDevice = bleCtx.connectedDevice || null;

  const { autoRefresh, temperatureUnit } = useSettings();

  const [refreshing, setRefreshing] = useState(false);
  const [snapshot, setSnapshot] = useState(null);

  const [isPosting, setIsPosting] = useState(false);
  const [postStatus, setPostStatus] = useState("idle");
  const [lastPostTime, setLastPostTime] = useState(null);
  const [lastResponse, setLastResponse] = useState(null);

  const displayData = autoRefresh ? telemetryData : (snapshot || telemetryData);
  const batteryId = "primary-battery";

  const handlePostBatteryData = async () => {
    if (!displayData) {
      Alert.alert("No data", "No telemetry available to post.");
      return;
    }
    if (isPosting) return;
    setIsPosting(true);
    setPostStatus("posting");

    const conn = await testConnectivity();
    if (!conn.success) {
      setIsPosting(false);
      Alert.alert("Connection Error", `Cannot reach API`);
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

      const email = "test@example.com";
      const result = await postBatteryReading(payload, email, batteryId);
      try { setLastResponse(JSON.stringify(result)); } catch (e) { setLastResponse(String(result)); }

      if (result.success) {
        setLastPostTime(new Date().toLocaleTimeString());
        setPostStatus("success");
        Alert.alert("Success", "Battery data posted successfully");
      } else {
        setPostStatus("error");
        Alert.alert("Post Failed", `Could not post battery data: ${result.error}`);
      }
    } catch (err) {
      setPostStatus("error");
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

  if (!connectedDevice) {
    return (
      <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
        <View style={styles.notConnectedContainer}>
          <Text style={[styles.title, { color: colors.text, marginBottom: 30 }]}>Connect Module</Text>
        </View>
        <BluetoothConnectionUI />
      </SafeAreaView>
    );
  }

  if (!displayData) {
    return (
      <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
        <View style={[styles.container, { justifyContent: 'center', flex: 1 }]}>
          <Text style={[styles.title, { color: colors.text }]}>Waiting for Telemetry...</Text>
          <Text style={[styles.subtitle, { color: colors.icon }]}>Receiving packets from ESP32</Text>
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

  const displayTemp = temperatureUnit === 'F' ? (d.cellTemperature * 9 / 5) + 32 : d.cellTemperature;
  const tempString = temperatureUnit === 'F' ? `${displayTemp.toFixed(1)} °F` : `${displayTemp.toFixed(1)} °C`;

  // === DYNAMIC VALIDATION & ALERT GENERATION ===
  const activeAlerts = [];

  if (d.cellTemperature > THRESHOLDS.TEMP_MAX) {
    activeAlerts.push({
      id: 'temp-high',
      level: 'error',
      title: 'Temperature Too High',
      detail: `Battery is too hot (${tempString}). Please cool down immediately.`
    });
  } else if (d.cellTemperature < THRESHOLDS.TEMP_MIN) {
    activeAlerts.push({
      id: 'temp-low',
      level: 'warning',
      title: 'Temperature Too Low',
      detail: `Battery is too cold (${tempString}). Warming up recommended.`
    });
  }

  if (d.stateOfCharge <= THRESHOLDS.SOC_WARNING_MIN) {
     activeAlerts.push({
        id: 'soc-low',
        level: 'warning',
        title: 'Low Battery',
        detail: `State of Charge is at ${d.stateOfCharge}%. Please recharge soon.`
     });
  }

  if (maxV > THRESHOLDS.CELL_V_MAX) {
     activeAlerts.push({
        id: 'cell-overvoltage',
        level: 'error',
        title: 'Cell Overvoltage Detected',
        detail: `A cell reached ${maxV.toFixed(3)} V (Limit: ${THRESHOLDS.CELL_V_MAX} V).`
     });
  }
  
  if (minV < THRESHOLDS.CELL_V_MIN) {
     activeAlerts.push({
        id: 'cell-undervoltage',
        level: 'warning',
        title: 'Cell Undervoltage Detected',
        detail: `A cell dropped to ${minV.toFixed(3)} V (Limit: ${THRESHOLDS.CELL_V_MIN} V).`
     });
  }

  if (voltageDelta > THRESHOLDS.IMBALANCE_MAX) {
      activeAlerts.push({
          id: 'imbalance',
          level: 'warning',
          title: 'Cell Imbalance Detected',
          detail: `Voltage difference: ${voltageDelta.toFixed(3)} V (Threshold: ${THRESHOLDS.IMBALANCE_MAX} V).`
      });
  }

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
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
        <Text style={[styles.title, { color: colors.text }]}>Dashboard</Text>

        {/* <Button title={isPosting ? 'Sending...' : 'Send Test Reading'} onPress={handlePostBatteryData} disabled={isPosting} />

        <View style={{ marginTop: 8, marginBottom: 12, alignItems: "center" }}>
          <Text style={[styles.small, { color: colors.icon }]}>Post status: {postStatus}</Text>
          {lastPostTime && <Text style={[styles.small, { color: colors.text }]}>Last posted: {lastPostTime}</Text>}
        </View> */}

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
              <Text style={[styles.tempValue, { color: colors.text }]}>{tempString}</Text>
              <ThermometerIcon temperature={displayTemp} isFahrenheit={temperatureUnit === 'F'} colors={colors} />
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

        {/* --- Dynamic Validation Alerts Section --- */}
        {activeAlerts.length > 0 && (
          <View style={{ width: '100%', marginBottom: 16 }}>
            {activeAlerts.map(alert => (
              <TelemetryAlertBanner 
                key={alert.id}
                title={alert.title}
                detail={alert.detail}
                level={alert.level}
                colors={colors}
              />
            ))}
          </View>
        )}

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

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  container: { padding: 20, paddingTop: 10, paddingBottom: 40, alignItems: "center" },
  notConnectedContainer: { paddingTop: 30, alignItems: "center" },
  small: { fontSize: 13, fontWeight: "600", textAlign: "center" },
  title: { fontSize: 28, fontWeight: "800", marginBottom: 12, textAlign: "center" },
  subtitle: { fontSize: 18, fontWeight: "700", marginBottom: 24, textAlign: "center" },
  modeHint: { fontSize: 13, fontWeight: "500", fontStyle: "italic", marginBottom: 16, textAlign: "center" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 20, width: "100%" },
  statLabel: { fontSize: 13, fontWeight: "600", marginBottom: 6, textAlign: "center" },
  tempTile: { width: "48%", marginBottom: 16, alignItems: "center" },
  tempValueRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  tempValue: { fontSize: 18, fontWeight: "700" },
  socRow: { flexDirection: "row", justifyContent: "space-around", alignItems: "flex-start", marginBottom: 28, width: "100%" },
  socBlock: { width: "48%", alignItems: "center", gap: 6 },
  socPct: { fontSize: 16, fontWeight: "700", marginTop: 2, textAlign: "center" },
  badge: { borderWidth: 1.5, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 6, marginTop: 4 },
  badgeText: { fontSize: 14, fontWeight: "700", textAlign: "center" },
  sectionTitle: { fontSize: 22, fontWeight: "800", marginBottom: 14, textAlign: "center" },
  cellsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 24, width: "100%" },
});
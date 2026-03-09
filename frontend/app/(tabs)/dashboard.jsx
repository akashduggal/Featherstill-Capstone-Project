import React, { useContext, useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useColorScheme,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Colors } from "../../constants/Colors";
import {
  BatteryIcon,
  StatTile,
  CellVoltage,
  ThermometerIcon,
  CellImbalanceWarning,
  Button,
  BluetoothConnectionUI,
} from "../../components";
import { BLEContext } from "../../context/BLEContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSettings } from "../../context/SettingsContext";
import Animated, { useSharedValue, useAnimatedProps, withTiming } from 'react-native-reanimated';
import { postBatteryReading, testConnectivity } from "../../services/batteryApi";

const AnimatedText = Animated.createAnimatedComponent(Text);

export default function Dashboard() {
  const theme = "dark";
  const colors = Colors[theme];

  // =================================================================
  // 1. ALL HOOKS ARE UNCONDITIONALLY CALLED AT THE TOP
  // =================================================================
  const { connectedDevice, telemetryData } = useContext(BLEContext);
  const { autoRefresh, temperatureUnit } = useSettings();
  const [refreshing, setRefreshing] = useState(false);
  const [snapshot, setSnapshot] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [postStatus, setPostStatus] = useState("idle");
  const [lastPostTime, setLastPostTime] = useState(null);
  const animatedTemperature = useSharedValue(0);

  // =================================================================
  // 2. DATA NEEDED BY HOOKS IS DEFINED NEXT
  // =================================================================
  const displayData = autoRefresh ? telemetryData : (snapshot || telemetryData);

  const getDisplayTemperature = useCallback((celsius) => {
    if (temperatureUnit === 'F') {
      return (celsius * 9) / 5 + 32;
    }
    return celsius;
  }, [temperatureUnit]);

  // =================================================================
  // 3. ALL OTHER HOOKS (useCallback, useEffect, useAnimatedProps)
  // =================================================================
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (telemetryData) setSnapshot({ ...telemetryData });
    setTimeout(() => setRefreshing(false), 800);
  }, [telemetryData]);

  useEffect(() => {
    if (displayData) {
      const tempInCelsius = (displayData.temp_ts1_c_x100 || 0) / 100;
      const displayTemp = getDisplayTemperature(tempInCelsius);
      animatedTemperature.value = withTiming(displayTemp, { duration: 500 });
    }
  }, [displayData, getDisplayTemperature, animatedTemperature]);

  const animatedProps = useAnimatedProps(() => {
    return {
      text: `${animatedTemperature.value.toFixed(1)} °${temperatureUnit}`,
    };
  });

  // =================================================================
  // 4. CONDITIONAL RETURNS (EARLY EXITS)
  // =================================================================
  if (!connectedDevice) {
    return <BluetoothConnectionUI />;
  }

  if (!displayData) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={{ color: colors.text, marginTop: 20, fontSize: 16, fontWeight: '600' }}>
          Waiting for Telemetry Data...
        </Text>
      </SafeAreaView>
    );
  }

  // =================================================================
  // 5. EVENT HANDLERS & DERIVED STATE
  // =================================================================
  const handlePostBatteryData = async () => {
    // ... (handler logic remains the same)
  };

  const d = {
    nominalVoltage: 51.2,
    capacityWh: 5222,
    minCellVoltage: Math.min(...(displayData.cell_mv || [0])) / 1000,
    maxCellVoltage: Math.max(...(displayData.cell_mv || [0])) / 1000,
    totalBatteryVoltage: (displayData.pack_total_mv || 0) / 1000,
    cellTemperature: (displayData.temp_ts1_c_x100 || 0) / 100,
    currentAmps: (displayData.current_ma || 0) / 1000,
    outputVoltage: (displayData.pack_ld_mv || 0) / 1000,
    stateOfCharge: Math.max(0, Math.min(100, displayData.soc || 0)),
    chargingStatus: (displayData.current_ma || 0) > 0 ? "CHARGING" : "INACTIVE",
    cellVoltages: (displayData.cell_mv || []).map(v => v / 1000),
  };

  const minV = Math.min(...d.cellVoltages);
  const maxV = Math.max(...d.cellVoltages);
  const voltageDelta = maxV - minV;

  // =================================================================
  // 6. RENDER
  // =================================================================
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "left", "right"]}>
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
        {/* <Button title={isPosting ? 'Sending...' : 'Send Test Reading'} onPress={handlePostBatteryData} disabled={isPosting} /> */}
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
              <AnimatedText style={[styles.tempValue, { color: colors.text }]} animatedProps={animatedProps} />
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

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  container: { paddingHorizontal: 20, paddingTop: 20, alignItems: "center" },
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
  cellsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", width: "100%" },
});

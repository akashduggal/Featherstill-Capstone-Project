import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth, useSettings } from "../../context";
import { BLEContext } from "../../context/BLEContext";
import { Colors } from "../../constants/Colors";
import VersionDisplay from "../../components/VersionDisplay";
import {
  SettingsDropdown,
  SettingsCheckbox,
  ActionButton,
} from "../../components";

import * as DocumentPicker from 'expo-document-picker';
import { Buffer } from 'buffer';

export default function Settings() {
  const theme = "dark";
  const colors = Colors[theme];
  const router = useRouter();
  const { user, logout, isGuest } = useAuth();
  
  // Settings & BLE
  const { autoRefresh, setAutoRefresh, temperatureUnit, setTemperatureUnit } = useSettings();
  const { 
    previouslyConnectedDevices, 
    disconnectFromDevice, 
    connectedDevice,
    startOta,
    otaStatus,
    otaProgress,
    isOtaSupported
  } = React.useContext(BLEContext);

  const [selectedModuleIndex, setSelectedModuleIndex] = useState(0);
  const [selectedTempUnitIndex, setSelectedTempUnitIndex] = useState(temperatureUnit === 'C' ? 0 : 1);

  const handleTempUnitChange = (index) => {
    setSelectedTempUnitIndex(index);
    setTemperatureUnit(index === 0 ? 'C' : 'F');
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleDisconnect = () => {
    disconnectFromDevice();
  };

  const handleOtaUpdate = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/octet-stream',
      });

      if (result.type === 'success') {
        const response = await fetch(result.uri);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onload = () => {
          const firmware = Buffer.from(reader.result);
          startOta(firmware);
        };
        reader.readAsArrayBuffer(blob);
      }
    } catch (err) {
      console.log('Error picking document: ', err);
    }
  };

  const moduleOptions = previouslyConnectedDevices.length > 0 
    ? previouslyConnectedDevices.map(d => d.name)
    : ["No modules paired"];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
        <View style={[styles.logoContainer, { borderColor: colors.cardBorder, backgroundColor: colors.surface }]}>
          <Ionicons name="shield-checkmark" size={48} color={colors.tint} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <Text style={[styles.userText, { color: colors.icon }]}>
          User: {isGuest ? "Guest User" : user?.displayName || user?.email || "Unknown"}
        </Text>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.icon }]}>DEVICE CONFIGURATION</Text>

          <SettingsDropdown
            label="Module ID"
            options={moduleOptions}
            selectedIndex={selectedModuleIndex}
            onSelect={setSelectedModuleIndex}
            subText={previouslyConnectedDevices.length > 0 ? `Module Type: ESP32` : `No Module Available`}
            colors={colors}
          />

          <SettingsDropdown
            label="Temperature Unit"
            options={["Celsius (°C)", "Fahrenheit (°F)"]}
            selectedIndex={selectedTempUnitIndex}
            onSelect={handleTempUnitChange}
            colors={colors}
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.icon }]}>SYSTEM</Text>
          <SettingsCheckbox
            checked={autoRefresh}
            onToggle={() => setAutoRefresh(!autoRefresh)}
            label="Auto-refresh"
            subText={autoRefresh ? `Refreshing every 2.0 s` : null}
            colors={colors}
          />
        </View>

        {connectedDevice && isOtaSupported && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.cardTitle, { color: colors.icon }]}>FIRMWARE UPDATE</Text>
            <ActionButton
              title="Start OTA Update"
              icon="cloud-upload-outline"
              onPress={handleOtaUpdate}
              colors={colors}
              disabled={otaStatus === 'starting' || otaStatus === 'in_progress'}
            />
            {(otaStatus === 'starting' || otaStatus === 'in_progress') && (
              <View style={styles.progressContainer}>
                <Text style={{ color: colors.text }}>{`Status: ${otaStatus}`}</Text>
                <View style={[styles.progressBar, { backgroundColor: colors.icon }]}>
                  <View style={[styles.progressFill, { width: `${otaProgress}%`, backgroundColor: colors.tint }]} />
                </View>
                <Text style={{ color: colors.text }}>{`${otaProgress}%`}</Text>
              </View>
            )}
            {otaStatus === 'success' && <Text style={{ color: colors.success, marginTop: 10 }}>Update successful!</Text>}
            {otaStatus === 'error' && <Text style={{ color: colors.danger, marginTop: 10 }}>Update failed. Please try again.</Text>}
          </View>
        )}

        <View style={styles.actions}>
          <ActionButton
            title="Bluetooth Settings"
            icon="bluetooth-outline"
            onPress={() => router.push("/bluetooth")}
            colors={colors}
          />
          {connectedDevice && (
            <ActionButton
              title="Disconnect Module"
              icon="swap-horizontal-outline"
              variant="outline"
              onPress={handleDisconnect}
              colors={colors}
            />
          )}
          <ActionButton
            title="Sign out"
            icon="log-out-outline"
            variant="danger"
            onPress={handleLogout}
            colors={colors}
          />
        </View>

        <View style={styles.versionContainer}>
          <VersionDisplay />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  safeArea: { flex: 1 },
  container: { padding: 20, paddingTop: 10, paddingBottom: 40, alignItems: "center" },
  logoContainer: { width: 80, height: 80, borderRadius: 20, borderWidth: 1, justifyContent: "center", alignItems: "center", marginBottom: 24 },
  title: { fontSize: 28, fontWeight: "800", marginBottom: 6, alignSelf: "flex-start" },
  userText: { fontSize: 15, fontWeight: "500", marginBottom: 20, alignSelf: "flex-start" },
  card: { width: "100%", borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 12, fontWeight: "700", letterSpacing: 1, marginBottom: 14 },
  actions: { width: "100%", gap: 12 },
  versionContainer: { marginTop: 20, alignItems: "center" },
  progressContainer: { marginTop: 16, alignItems: 'center' },
  progressBar: { height: 10, width: '100%', borderRadius: 5, marginTop: 8, marginBottom: 4 },
  progressFill: { height: '100%', borderRadius: 5 },
});

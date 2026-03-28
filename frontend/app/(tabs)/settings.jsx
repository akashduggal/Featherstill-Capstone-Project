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
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { Buffer } from 'buffer';
import { useAuth, useSettings } from "../../context";
import { BLEContext } from "../../context/BLEContext";
import { Colors } from "../../constants/Colors";
import VersionDisplay from "../../components/VersionDisplay";
import {
  SettingsDropdown,
  SettingsCheckbox,
  ActionButton,
  OtaUpdateModal,
} from "../../components";

export default function Settings() {
  const theme = "dark";
  const colors = Colors[theme];
  const router = useRouter();
  const { user, logout, isGuest } = useAuth();
  
  // Settings & BLE
  const { autoRefresh, setAutoRefresh, temperatureUnit, setTemperatureUnit } = useSettings();
  const { previouslyConnectedDevices, disconnectFromDevice, connectedDevice } = React.useContext(BLEContext);

  const [selectedModuleIndex, setSelectedModuleIndex] = useState(0);
  const [selectedTempUnitIndex, setSelectedTempUnitIndex] = useState(temperatureUnit === 'C' ? 0 : 1);

  const handleTempUnitChange = (index) => {
    setSelectedTempUnitIndex(index);
    setTemperatureUnit(index === 0 ? 'C' : 'F');
  };

  const {
    isOtaSupported,
    startOta,
    otaStatus,
    otaProgress,
    abortOta,
  } = React.useContext(BLEContext);
  const [isOtaModalVisible, setIsOtaModalVisible] = useState(false);

  const handleOtaUpdate = async () => {
    if (!isOtaSupported) {
      console.log('OTA is not supported on this device.');
      return;
    }

    setIsOtaModalVisible(true);
    console.log('Starting OTA update process...');
    // return
    try {
      console.log('Loading firmware asset...');
      const asset = Asset.fromModule(require('../../assets/BLE_Step1.bin'));
      await asset.downloadAsync();
      console.log('Firmware asset downloaded to:', asset.localUri);

      console.log('Reading firmware file using the new File API...');
      const file = new File(asset.localUri);
      const fileContent = await file.arrayBuffer();
      const firmware = Buffer.from(fileContent);
      console.log(`Firmware loaded. Size: ${firmware.length} bytes.`);

      await startOta(firmware);
    } catch (error) {
      console.error('OTA update failed:', error);
    }
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
        {__DEV__ && (
          <View style={{ width: '100%', marginBottom: 16 }}>
            <ActionButton
              title="Debug"
              icon="bug"
              onPress={() => router.push('/debug')}
              colors={colors}
            />
          </View>
      )}

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

        <View style={styles.actions}>
          <ActionButton
            title="Bluetooth Settings"
            icon="bluetooth-outline"
            onPress={() => router.push("/bluetooth")}
            colors={colors}
          />
          {isOtaSupported && (
            <ActionButton
              title="Start OTA Update"
              icon="cloud-upload-outline"
              onPress={handleOtaUpdate}
              colors={colors}
            />
          )}
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
      <OtaUpdateModal
        visible={isOtaModalVisible}
        status={otaStatus}
        progress={otaProgress}
        onClose={() => setIsOtaModalVisible(false)}
        onAbort={abortOta}
        colors={colors}
      />
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
});

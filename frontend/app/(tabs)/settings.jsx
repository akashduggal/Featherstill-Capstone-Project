import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { Buffer } from 'buffer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useAuth, useSettings, useFirmwareUpdate } from "../../context";
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
  const { latestFirmwareVersion, updateCheckStatus, checkForUpdates } = useFirmwareUpdate();
  
  // Settings & BLE
  const { autoRefresh, setAutoRefresh, temperatureUnit, setTemperatureUnit } = useSettings();
  const { 
    previouslyConnectedDevices, 
    disconnectFromDevice, 
    connectedDevice,
    isOtaSupported,
    startOta,
    otaStatus,
    otaProgress,
    abortOta,
  } = React.useContext(BLEContext);

  const [selectedModuleIndex, setSelectedModuleIndex] = useState(0);
  const [selectedTempUnitIndex, setSelectedTempUnitIndex] = useState(temperatureUnit === 'C' ? 0 : 1);

  const handleTempUnitChange = (index) => {
    setSelectedTempUnitIndex(index);
    setTemperatureUnit(index === 0 ? 'C' : 'F');
  };

  const [isOtaModalVisible, setIsOtaModalVisible] = useState(false);
  const [currentFirmwareVersion, setCurrentFirmwareVersion] = useState(null);

  useEffect(() => {
    const loadCurrentVersion = async () => {
      const storedVersion = await AsyncStorage.getItem('firmwareVersion');
      if (storedVersion) {
        setCurrentFirmwareVersion(storedVersion);
      }
    };
    loadCurrentVersion();
    checkForUpdates();
  }, []);

  const handleClearFirmwareVersion = async () => {
    try {
      await AsyncStorage.removeItem('firmwareVersion');
      setCurrentFirmwareVersion(null);
      Toast.show({
        type: 'success',
        text1: 'Firmware Version Cleared',
        text2: 'The stored firmware version has been reset.',
      });
    } catch (error) {
      console.error('Failed to clear firmware version:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Could not clear firmware version.' });
    }
  };

  useEffect(() => {
    if (otaStatus === 'success') {
      setIsOtaModalVisible(false);
      Toast.show({
        type: 'success',
        text1: 'Firmware Update Successful',
        text2: 'Please connect the module again.',
        visibilityTime: 10000,
      });
    }
  }, [otaStatus]);

  const handleOtaUpdate = async () => {
    if (!isOtaSupported) {
      Toast.show({ type: 'error', text1: 'OTA not supported on this device.' });
      return;
    }

    // Re-check on button press to ensure we have the absolute latest version info
    await checkForUpdates();

    if (latestFirmwareVersion && latestFirmwareVersion === currentFirmwareVersion) {
      Toast.show({
        type: 'info',
        text1: 'No Update Available',
        text2: 'You already have the latest firmware version.',
      });
      return;
    }

    setIsOtaModalVisible(true);
    console.log('Starting OTA update process...');

    try {
      console.log(`Downloading firmware version ${latestFirmwareVersion}...`);
      const firmwareResponse = await fetch(`http://192.168.0.168:3000/api/firmware/${latestFirmwareVersion}/download`);
      if (!firmwareResponse.ok) {
        throw new Error(`Failed to download firmware: ${firmwareResponse.statusText}`);
      }
      
      const fileContent = await firmwareResponse.arrayBuffer();
      const firmware = Buffer.from(fileContent);
      console.log(`Firmware loaded. Size: ${firmware.length} bytes.`);

      await startOta(firmware, latestFirmwareVersion);
      setCurrentFirmwareVersion(latestFirmwareVersion);
    } catch (error) {
      console.error('OTA update failed:', error);
      // The modal will show a generic error, but we can also toast
      Toast.show({ type: 'error', text1: 'OTA Failed', text2: error.message });
      // Close the modal on failure
      setIsOtaModalVisible(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleAbortOta = () => {
    abortOta();
    setIsOtaModalVisible(false);
    Toast.show({
      type: 'error',
      text1: 'Firmware Update Aborted',
      text2: 'The firmware update process has been stopped.'
    });
  };

  const handleDisconnect = () => {
    disconnectFromDevice();
  };

  const moduleOptions = previouslyConnectedDevices.length > 0 
    ? previouslyConnectedDevices.map(d => d.name)
    : ["No modules paired"];

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
          <Image 
            source={require('../../assets/fetherstill_official_logo.png')} 
            style={{width: 125, height: 142, objectFit: "cover", borderRadius: 20, backgroundColor: "transparent"}} 
          />

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
          {/* <ActionButton
            title="Bluetooth Settings"
            icon="bluetooth-outline"
            onPress={() => router.push("/bluetooth")}
            colors={colors}
          /> */}
          {isOtaSupported && (
            <>
              <View style={{alignItems: 'center', width: '100%'}}>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '500' }}>
                  Current Version: {currentFirmwareVersion || 'N/A'}
                </Text>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '500' }}>
                  Latest Version: {updateCheckStatus === 'checking' ? 'Checking...' : latestFirmwareVersion || 'N/A'}
                </Text>
              </View>
              <ActionButton
                title="Update Firmware"
                icon="cloud-upload-outline"
                onPress={handleOtaUpdate}
                colors={colors}
                disabled={!latestFirmwareVersion || latestFirmwareVersion === currentFirmwareVersion}
              />
                <ActionButton
                  title="Clear Firmware Version"
                  icon="trash-outline"
                  onPress={handleClearFirmwareVersion}
                  colors={colors}
                />
              </>
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
        onAbort={handleAbortOta}
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

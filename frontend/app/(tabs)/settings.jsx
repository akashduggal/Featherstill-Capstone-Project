import React, { useState, useContext } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth, useSettings, BLEContext } from "../../context";
import { Colors } from "../../constants/Colors";
import VersionDisplay from "../../components/VersionDisplay";
import {
  SettingsDropdown,
  SettingsCheckbox,
  NotificationBadge,
  ActionButton,
} from "../../components";


export default function Settings() {
  const theme = "dark";
  const colors = Colors[theme];
  const router = useRouter();
  const { user, logout, isGuest } = useAuth();
  const { previouslyConnectedDevices, connectedDevice, disconnectFromDevice } = useContext(BLEContext);
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState(0);

  const { autoRefresh, setAutoRefresh, temperatureUnit, setTemperatureUnit } = useSettings();

  

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.container}
    >
      {/* ── Logo ───────────────────────────────────────────────── */}
      <View
        style={[
          styles.logoContainer,
          { borderColor: colors.cardBorder, backgroundColor: colors.surface },
        ]}
      >
        <Ionicons name="shield-checkmark" size={48} color={colors.tint} />
      </View>

      {/* ── Title & User ───────────────────────────────────────── */}
      <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      <Text style={[styles.userText, { color: colors.icon }]}>
        User: {isGuest ? "Guest User" : user?.displayName || user?.email || "Unknown"}
      </Text>

      {/* ═══════════════════════════════════════════════════════════
          CARD 1 — Device Configuration
          ═══════════════════════════════════════════════════════════ */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
        ]}
      >
        <Text style={[styles.cardTitle, { color: colors.icon }]}>
          DEVICE CONFIGURATION
        </Text>

        <SettingsDropdown
          label="Module ID"
          options={previouslyConnectedDevices.map((d) => d.name)}
          selectedIndex={selectedDeviceIndex}
          onSelect={setSelectedDeviceIndex}
          colors={colors}
        />

        <SettingsDropdown
          label="Temperature Unit"
          options={["Celsius", "Fahrenheit"]}
          selectedIndex={temperatureUnit === 'C' ? 0 : 1}
          onSelect={(index) => setTemperatureUnit(index === 0 ? 'C' : 'F')}
          colors={colors}
        />
      </View>

      {/* ═══════════════════════════════════════════════════════════
          CARD 2 — System
          ═══════════════════════════════════════════════════════════ */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
        ]}
      >
        <Text style={[styles.cardTitle, { color: colors.icon }]}>SYSTEM</Text>



        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

        {/* Auto-refresh */}
        <SettingsCheckbox
          checked={autoRefresh}
          onToggle={() => setAutoRefresh(!autoRefresh)}
          label="Auto-refresh"
          colors={colors}
        />
      </View>

      {/* ═══════════════════════════════════════════════════════════
          ACTION BUTTONS
          ═══════════════════════════════════════════════════════════ */}
      <View style={styles.actions}>
        <ActionButton
          title="Bluetooth Settings"
          icon="bluetooth"
          onPress={() => router.push("/bluetooth")}
          colors={colors}
        />
        {connectedDevice && (
          <ActionButton
            title="Disconnect Module"
            icon="close-circle-outline"
            variant="danger"
            onPress={disconnectFromDevice}
            colors={colors}
          />
        )}
        <ActionButton
          title="Battery Data"
          icon="battery-charging-outline"
          onPress={() => router.push("/(tabs)/dashboard")}
          colors={colors}
        />
        <ActionButton
          title="Sign out"
          icon="log-out-outline"
          variant="danger"
          onPress={handleLogout}
          colors={colors}
        />
      </View>

      {/* ── Version Display ────────────────────────────────────── */}
      <View style={styles.versionContainer}>
        <VersionDisplay />
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
  },
  container: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40,
    alignItems: "center",
  },

  /* Logo */
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },

  /* Title & User */
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 6,
    alignSelf: "flex-start",
  },
  userText: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 20,
    alignSelf: "flex-start",
  },

  /* Cards */
  card: {
    width: "100%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 14,
  },

  /* BMS Version */
  bmsSection: {
    marginBottom: 16,
  },
  bmsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  versionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  updateBtn: {
    flexDirection: "row",
    alignSelf: "flex-start",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 4,
  },
  updateBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  /* Divider */
  divider: {
    height: StyleSheet.hairlineWidth,
    width: "100%",
    marginBottom: 16,
  },

  /* Action buttons */
  actions: {
    width: "100%",
    gap: 12,
  },

  /* Version display */
  versionContainer: {
    marginTop: 20,
    alignItems: "center",
  },
});

import React, { useState } from "react";
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
import { useAuth } from "../../context";
import { Colors } from "../../constants/Colors";
import VersionDisplay from "../../components/VersionDisplay";
import {
  SettingsDropdown,
  SettingsCheckbox,
  NotificationBadge,
  ActionButton,
} from "../../components";

// ---------------------------------------------------------------------------
// Static settings data — will be replaced with live data from ESP32 later
// ---------------------------------------------------------------------------
const SETTINGS_DATA = {
  modules: [
    { id: "mod-s123456789", type: "HVAC" },
    { id: "mod-s987654321", type: "Industrial" },
  ],
  temperatureUnits: ["Celsius (°C)", "Fahrenheit (°F)"],
  currentBmsVersion: "1.2.1",
  newBmsVersion: "1.2.3",
  refreshInterval: 2.0,
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function Settings() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? "dark" : "light";
  const colors = Colors[theme];
  const router = useRouter();
  const { user, logout, isGuest } = useAuth();
  const s = SETTINGS_DATA;

  // ── Interactive state ────────────────────────────────────────
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(0);
  const [selectedTempUnit, setSelectedTempUnit] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const selectedModule = s.modules[selectedModuleIndex];
  const hasUpdate = s.currentBmsVersion !== s.newBmsVersion;

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

      {/* ── Module ID ──────────────────────────────────────────── */}
      <SettingsDropdown
        label="Module ID"
        options={s.modules.map((m) => m.id)}
        selectedIndex={selectedModuleIndex}
        onSelect={setSelectedModuleIndex}
        subText={`Module Type: ${selectedModule.type}`}
        colors={colors}
        labelRight={<NotificationBadge count={1} />}
      />

      {/* ── Temperature Unit ───────────────────────────────────── */}
      <SettingsDropdown
        label="Temperature Unit"
        options={s.temperatureUnits}
        selectedIndex={selectedTempUnit}
        onSelect={setSelectedTempUnit}
        colors={colors}
      />

      {/* ── BMS Version ────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={[styles.versionText, { color: colors.text }]}>
          Current BMS version: {s.currentBmsVersion}
        </Text>

        {hasUpdate && (
          <>
            <Text style={[styles.versionText, { color: colors.text }]}>
              New BMS version: {s.newBmsVersion}
            </Text>
            <TouchableOpacity
              style={[styles.updateBtn, { backgroundColor: colors.success }]}
              activeOpacity={0.8}
            >
              <Text style={styles.updateBtnText}>Update</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* ── Auto-refresh ───────────────────────────────────────── */}
      <SettingsCheckbox
        checked={autoRefresh}
        onToggle={() => setAutoRefresh(!autoRefresh)}
        label="Auto-refresh"
        subText={autoRefresh ? `Refreshing every ${s.refreshInterval.toFixed(1)} s` : null}
        colors={colors}
      />

      {/* ── Action Buttons ─────────────────────────────────────── */}
      <View style={styles.actions}>
        <ActionButton
          title="Battery Data"
          onPress={() => router.push("/(tabs)/dashboard")}
          colors={colors}
        />
        <ActionButton
          title="Sign out"
          onPress={handleLogout}
          colors={colors}
        />
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
    padding: 24,
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
    marginBottom: 24,
    alignSelf: "flex-start",
  },

  /* Sections */
  section: {
    width: "100%",
    marginBottom: 20,
  },

  /* BMS Version */
  versionText: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  updateBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 6,
  },
  updateBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  /* Action buttons */
  actions: {
    width: "100%",
    marginTop: 16,
    gap: 12,
  },
});

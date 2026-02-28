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
          options={s.modules.map((m) => m.id)}
          selectedIndex={selectedModuleIndex}
          onSelect={setSelectedModuleIndex}
          subText={`Module Type: ${selectedModule.type}`}
          colors={colors}
          labelRight={<NotificationBadge count={1} />}
        />

        <SettingsDropdown
          label="Temperature Unit"
          options={s.temperatureUnits}
          selectedIndex={selectedTempUnit}
          onSelect={setSelectedTempUnit}
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

        {/* BMS Version */}
        <View style={styles.bmsSection}>
          <View style={styles.bmsRow}>
            <Ionicons name="hardware-chip-outline" size={18} color={colors.icon} />
            <Text style={[styles.versionText, { color: colors.text }]}>
              Current BMS version: {s.currentBmsVersion}
            </Text>
          </View>

          {hasUpdate && (
            <>
              <View style={styles.bmsRow}>
                <Ionicons name="arrow-up-circle-outline" size={18} color={colors.success} />
                <Text style={[styles.versionText, { color: colors.success }]}>
                  New BMS version: {s.newBmsVersion}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.updateBtn, { backgroundColor: colors.success }]}
                activeOpacity={0.8}
              >
                <Ionicons name="download-outline" size={16} color="#fff" />
                <Text style={styles.updateBtnText}>Update</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

        {/* Auto-refresh */}
        <SettingsCheckbox
          checked={autoRefresh}
          onToggle={() => setAutoRefresh(!autoRefresh)}
          label="Auto-refresh"
          subText={autoRefresh ? `Refreshing every ${s.refreshInterval.toFixed(1)} s` : null}
          colors={colors}
        />
      </View>

      {/* ═══════════════════════════════════════════════════════════
          ACTION BUTTONS
          ═══════════════════════════════════════════════════════════ */}
      <View style={styles.actions}>
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

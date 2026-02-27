import React from "react";
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

// ---------------------------------------------------------------------------
// Static settings data — will be replaced with live data from ESP32 later
// ---------------------------------------------------------------------------
const SETTINGS_DATA = {
  modules: [
    { id: "mod-s123456789", type: "HVAC" },
    { id: "mod-s987654321", type: "Industrial" },
  ],
  selectedModuleIndex: 0,
  temperatureUnits: ["Celsius (°C)", "Fahrenheit (°F)"],
  selectedTempUnit: 0,
  currentBmsVersion: "1.2.1",
  newBmsVersion: "1.2.3",
  autoRefresh: true,
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

  const selectedModule = s.modules[s.selectedModuleIndex];
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
      <View style={styles.section}>
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: colors.text }]}>Module ID</Text>
          {/* Red notification badge */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>1</Text>
          </View>
        </View>

        {/* Dropdown (static) */}
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: colors.surface,
              borderColor: colors.success,
            },
          ]}
        >
          <Text style={[styles.dropdownText, { color: colors.text }]}>
            {selectedModule.id}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.icon} />
        </View>

        <Text style={[styles.subInfo, { color: colors.icon }]}>
          Module Type: {selectedModule.type}
        </Text>
      </View>

      {/* ── Temperature Unit ───────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>
          Temperature Unit
        </Text>

        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: colors.surface,
              borderColor: colors.success,
            },
          ]}
        >
          <Text style={[styles.dropdownText, { color: colors.text }]}>
            {s.temperatureUnits[s.selectedTempUnit]}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.icon} />
        </View>
      </View>

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
      <View style={styles.section}>
        <View style={styles.checkboxRow}>
          <View
            style={[
              styles.checkbox,
              {
                backgroundColor: s.autoRefresh ? colors.success : "transparent",
                borderColor: s.autoRefresh ? colors.success : colors.icon,
              },
            ]}
          >
            {s.autoRefresh && (
              <Ionicons name="checkmark" size={14} color="#fff" />
            )}
          </View>
          <Text style={[styles.checkboxLabel, { color: colors.text }]}>
            Auto-refresh
          </Text>
        </View>
        {s.autoRefresh && (
          <Text style={[styles.subInfo, { color: colors.icon, marginLeft: 30 }]}>
            Refreshing every {s.refreshInterval.toFixed(1)} s
          </Text>
        )}
      </View>

      {/* ── Action Buttons ─────────────────────────────────────── */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            { borderColor: colors.cardBorder, backgroundColor: colors.surface },
          ]}
          onPress={() => router.push("/(tabs)/dashboard")}
          activeOpacity={0.8}
        >
          <Text style={[styles.actionBtnText, { color: colors.text }]}>
            Battery Data
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionBtn,
            { borderColor: colors.cardBorder, backgroundColor: colors.surface },
          ]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={[styles.actionBtnText, { color: colors.text }]}>
            Sign out
          </Text>
        </TouchableOpacity>
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

  /* Labels */
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 6,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
  },

  /* Red badge */
  badge: {
    backgroundColor: "#EF4444",
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },

  /* Dropdown (visual only) */
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1.5,
    marginBottom: 6,
  },
  dropdownText: {
    fontSize: 15,
    fontWeight: "500",
  },

  /* Sub info */
  subInfo: {
    fontSize: 13,
    fontWeight: "500",
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

  /* Auto-refresh */
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: "600",
  },

  /* Action buttons */
  actions: {
    width: "100%",
    marginTop: 16,
    gap: 12,
  },
  actionBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
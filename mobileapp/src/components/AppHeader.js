import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, spacing, shadow, typeScale } from "../theme";

export default function AppHeader({
  title = "FIXKART",
  role,
  subtitle,
  onLogout,
  showLogout = false,
}) {
  return (
    <View style={[styles.wrap, shadow.soft]}>
      <View style={styles.left}>
        <Text style={styles.brand}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.right}>
        {role ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{role}</Text>
          </View>
        ) : null}
        {showLogout ? (
          <TouchableOpacity style={styles.logout} onPress={onLogout}>
            <Feather name="log-out" size={16} color={colors.text} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 14,
    backgroundColor: colors.panelAlt,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: { flex: 1 },
  brand: {
    ...typeScale.title,
    letterSpacing: 1.5,
  },
  subtitle: { color: colors.muted, fontSize: 11, marginTop: 4 },
  right: { flexDirection: "row", alignItems: "center", gap: 10 },
  badge: {
    backgroundColor: colors.chip,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
  },
  badgeText: { color: colors.muted, fontSize: 10, fontWeight: "700", letterSpacing: 0.8 },
  logout: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    alignItems: "center",
    justifyContent: "center",
  },
});

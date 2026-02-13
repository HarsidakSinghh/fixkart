import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing } from "../theme";

export default function MiniBarChart({ data = [] }) {
  const normalized = data.map((item, index) => ({
    key: item.key || item.day || item.name || `point-${index}`,
    label: item.label || item.day || item.name || "-",
    value: Number(item.value ?? item.total ?? 0),
  }));
  const max = Math.max(...normalized.map((item) => item.value), 1);

  return (
    <View style={styles.wrap}>
      {normalized.map((item) => {
        const height = Math.round((item.value / max) * 80) + 10;
        return (
          <View key={item.key} style={styles.col}>
            <Text numberOfLines={1} style={styles.value}>
              ₹{Math.round(item.value)}
            </Text>
            <View style={styles.barTrack}>
              <View style={[styles.bar, { height }]} />
            </View>
            <Text style={styles.label}>{item.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 6,
    paddingVertical: spacing.sm,
  },
  col: { alignItems: "center", flex: 1 },
  value: {
    color: colors.muted,
    fontSize: 9,
    marginBottom: 4,
  },
  barTrack: {
    width: 14,
    height: 94,
    borderRadius: 8,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  bar: {
    width: 14,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  label: { color: colors.muted, fontSize: 9, marginTop: 6 },
});

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing } from "../theme";

export default function StatusPill({ label, tone }) {
  return (
    <View style={[styles.pill, toneStyle(tone)]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

function toneStyle(tone) {
  switch (tone) {
    case "success":
      return { backgroundColor: colors.success };
    case "warning":
      return { backgroundColor: colors.warning };
    case "danger":
      return { backgroundColor: colors.danger };
    case "info":
      return { backgroundColor: colors.info };
    default:
      return { backgroundColor: colors.muted };
  }
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  text: { color: "#FFFFFF", fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
});

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing } from "../theme";

export default function MiniBarChart({ data }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <View style={styles.wrap}>
      {data.map((item) => {
        const height = Math.round((item.value / max) * 80) + 10;
        return (
          <View key={item.day} style={styles.col}>
            <View style={[styles.bar, { height }]} />
            <Text style={styles.label}>{item.day}</Text>
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
    paddingVertical: spacing.md,
  },
  col: { alignItems: "center", flex: 1 },
  bar: {
    width: 10,
    borderRadius: 6,
    backgroundColor: colors.info,
  },
  label: { color: colors.muted, fontSize: 10, marginTop: 6 },
});

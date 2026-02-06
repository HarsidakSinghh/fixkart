import React from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import { colors, spacing, shadow } from "../theme";

export default function BottomNav({ tabs, activeKey, onChange }) {
  return (
    <View style={[styles.wrap, shadow.soft]}>
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <Pressable key={tab.key} onPress={() => onChange(tab.key)} style={styles.item}>
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
            {active ? <View style={styles.dot} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: colors.panelAlt,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    paddingVertical: spacing.md,
    paddingBottom: spacing.lg,
  },
  item: { alignItems: "center", flex: 1 },
  label: { color: colors.muted, fontSize: 13, fontWeight: "700", letterSpacing: 0.3 },
  labelActive: { color: colors.text },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.primary,
    marginTop: 8,
  },
});

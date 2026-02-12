import React from "react";
import { Feather } from "@expo/vector-icons";
import { View, Text, StyleSheet, Pressable } from "react-native";
import AdminScreenLayout from "../components/AdminScreenLayout";
import { ScreenTitle } from "../components/Ui";
import { colors, spacing, shadow } from "../theme";

const SUPPORT_ROUTES = [
  {
    key: "complaints",
    title: "Complaints",
    subtitle: "Handle escalations and issue notes",
    icon: "alert-triangle",
  },
  {
    key: "refunds",
    title: "Refunds",
    subtitle: "Review and approve refund cases",
    icon: "rotate-ccw",
  },
];

export default function SupportScreen({ onNavigate }) {
  return (
    <AdminScreenLayout>
      <ScreenTitle title="Support Desk" subtitle="Complaints and refund workflows" />
      <View style={styles.listWrap}>
        {SUPPORT_ROUTES.map((route) => (
          <Pressable key={route.key} style={[styles.card, shadow.soft]} onPress={() => onNavigate?.(route.key)}>
            <View style={styles.iconWrap}>
              <Feather name={route.icon} size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{route.title}</Text>
              <Text style={styles.subtitle}>{route.subtitle}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.muted} />
          </Pressable>
        ))}
      </View>
    </AdminScreenLayout>
  );
}

const styles = StyleSheet.create({
  listWrap: { gap: spacing.sm, marginTop: spacing.sm },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panelAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: colors.text, fontWeight: "700", fontSize: 14 },
  subtitle: { color: colors.muted, marginTop: 4, fontSize: 12 },
});

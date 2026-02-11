import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { colors, spacing, font, shadow } from "../theme";

export function ScreenTitle({ title, subtitle }) {
  return (
    <View style={styles.titleWrap}>
      <Text style={font.subtitle}>FIXKART ADMIN</Text>
      <Text style={font.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.titleRule} />
    </View>
  );
}

export function SectionHeader({ title, actionLabel, onPress }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleWrap}>
        <View style={styles.sectionDot} />
        <Text style={font.section}>{title}</Text>
      </View>
      {actionLabel ? (
        <Pressable onPress={onPress} style={styles.sectionAction}>
          <Text style={styles.sectionActionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function StatCard({ label, value, color }) {
  return (
    <View style={[styles.statCard, shadow.card]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: color || colors.text }]}>{value}</Text>
      <View style={styles.statGlow} />
    </View>
  );
}

export function Badge({ text, tone }) {
  return (
    <View style={[styles.badge, { backgroundColor: toneBg(tone) }]}>
      <Text style={[styles.badgeText, { color: toneText(tone) }]}>{text}</Text>
    </View>
  );
}

export function RowCard({ title, subtitle, right, meta }) {
  return (
    <View style={[styles.rowCard, shadow.soft]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
        {meta ? (
          typeof meta === "string" ? (
            <Text style={styles.rowMeta}>{meta}</Text>
          ) : (
            <View style={styles.rowMetaWrap}>{meta}</View>
          )
        ) : null}
      </View>
      {right ? <View style={styles.rowRight}>{right}</View> : null}
    </View>
  );
}

export function ActionRow({ primaryLabel, secondaryLabel, onPrimary, onSecondary }) {
  return (
    <View style={styles.actionRow}>
      {secondaryLabel ? (
        <Pressable onPress={onSecondary} style={[styles.button, styles.buttonGhost]}>
          <Text style={styles.buttonGhostText}>{secondaryLabel}</Text>
        </Pressable>
      ) : null}
      {primaryLabel ? (
        <Pressable onPress={onPrimary} style={[styles.button, styles.buttonPrimary]}>
          <Text style={styles.buttonPrimaryText}>{primaryLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ListItem({ title, subtitle, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.listItem}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      <Text style={styles.listArrow}>›</Text>
    </Pressable>
  );
}

export function Pill({ text, tone }) {
  return (
    <View style={[styles.pill, { borderColor: toneText(tone) }]}>
      <Text style={[styles.pillText, { color: toneText(tone) }]}>{text}</Text>
    </View>
  );
}

function toneText(tone) {
  switch (tone) {
    case "success":
      return colors.success;
    case "warning":
      return colors.warning;
    case "danger":
      return colors.danger;
    case "info":
      return colors.info;
    default:
      return colors.muted;
  }
}

function toneBg(tone) {
  switch (tone) {
    case "success":
      return "#0F2C1D";
    case "warning":
      return "#3A2B17";
    case "danger":
      return "#3A1B1B";
    case "info":
      return "#16263F";
    default:
      return colors.panelAlt;
  }
}

const styles = StyleSheet.create({
  titleWrap: { marginBottom: spacing.lg },
  subtitle: { marginTop: 6, color: colors.muted, fontSize: 13 },
  titleRule: {
    marginTop: spacing.sm,
    height: 2,
    width: 48,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  sectionHeader: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  sectionAction: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.panelAlt,
    borderWidth: 1,
    borderColor: colors.line,
  },
  sectionActionText: { color: colors.info, fontSize: 12, fontWeight: "600" },
  statCard: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: 18,
    flex: 1,
    minWidth: 150,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.line,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  statValue: { fontSize: 22, fontWeight: "700", marginTop: 8 },
  statGlow: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 999,
    right: -50,
    top: -60,
    backgroundColor: colors.highlight,
    opacity: 0.6,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
  rowCard: {
    backgroundColor: colors.card,
    padding: spacing.sm,
    borderRadius: 16,
    marginBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.line,
  },
  rowTitle: { color: colors.text, fontWeight: "700", fontSize: 13 },
  rowSubtitle: { color: colors.muted, fontSize: 11, marginTop: 2 },
  rowMeta: { color: colors.muted, fontSize: 10, marginTop: 6 },
  rowMetaWrap: { marginTop: 8 },
  rowRight: { marginLeft: spacing.sm, alignItems: "flex-end" },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonPrimaryText: { color: "#FFFFFF", fontWeight: "700", fontSize: 12 },
  buttonGhost: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panelAlt,
  },
  buttonGhostText: { color: colors.text, fontWeight: "600", fontSize: 12 },
  listItem: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: 18,
    marginBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.line,
  },
  listArrow: { color: colors.muted, fontSize: 18, marginLeft: spacing.sm },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: { fontSize: 11, fontWeight: "700" },
});

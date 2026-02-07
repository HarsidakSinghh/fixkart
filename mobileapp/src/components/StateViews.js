import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors, spacing } from "../theme";

export function ErrorState({ title, message, onRetry }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title || "Something went wrong"}</Text>
      <Text style={styles.message}>{message || "Please try again."}</Text>
      {onRetry ? (
        <TouchableOpacity style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function SkeletonList({ count = 4 }) {
  return (
    <View style={styles.skeletonWrap}>
      {Array.from({ length: count }).map((_, idx) => (
        <View key={idx} style={styles.skeletonCard}>
          <View style={styles.skeletonLine} />
          <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
    marginVertical: spacing.md,
  },
  title: { color: colors.text, fontSize: 15, fontWeight: "700" },
  message: { color: colors.muted, fontSize: 12, marginTop: 6 },
  button: {
    marginTop: spacing.md,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  buttonText: { color: "#0B1020", fontWeight: "700", fontSize: 12 },
  skeletonWrap: { marginVertical: spacing.md },
  skeletonCard: {
    backgroundColor: colors.panelAlt,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.sm,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: colors.surface,
    borderRadius: 999,
    marginBottom: 10,
  },
  skeletonLineShort: { width: "60%" },
});

import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { colors, spacing } from "../theme";

export default function ScreenLayout({ children, noScroll }) {
  if (noScroll) {
    return (
      <View style={styles.safe}>
        <View style={styles.container}>{children}</View>
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: {
    padding: spacing.lg,
    paddingBottom: 140,
    backgroundColor: colors.bg,
  },
});

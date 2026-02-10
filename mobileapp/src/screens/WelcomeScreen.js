import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { colors } from "../theme";

export default function WelcomeScreen({ onLogin, onContinue }) {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Image source={require("../../assets/logo1.png")} style={styles.brandImage} />
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>
          B2B procurement and operations in one place.
        </Text>
      </View>

      <View style={styles.ctaGroup}>
        <TouchableOpacity style={styles.primaryBtn} onPress={onLogin}>
          <Text style={styles.primaryText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onContinue}>
          <Text style={styles.secondaryText}>Continue without login</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footerNote}>
        You can browse as guest. Login is required to place orders.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 24,
    paddingTop: 60,
    justifyContent: "space-between",
    paddingBottom: 40,
  },
  hero: {
    marginTop: 20,
  },
  brand: {
    color: colors.primary,
    fontWeight: "800",
    letterSpacing: 2,
    fontSize: 18,
  },
  brandImage: {
    width: 130,
    height: 32,
    resizeMode: "contain",
  },
  title: {
    marginTop: 20,
    fontSize: 32,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    marginTop: 12,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  ctaGroup: {
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryText: { color: "#FFFFFF", fontWeight: "700" },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  secondaryText: { color: colors.text, fontWeight: "700" },
  footerNote: {
    color: colors.muted,
    fontSize: 12,
    textAlign: "center",
  },
});

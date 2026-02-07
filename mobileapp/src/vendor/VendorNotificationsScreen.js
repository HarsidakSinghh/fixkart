import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { vendorColors, vendorSpacing } from './VendorTheme';

export default function VendorNotificationsScreen({ onBack }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const raw = await SecureStore.getItemAsync('vendor_notifications');
      if (raw) setNotifications(JSON.parse(raw));
    } catch (_) {
      // ignore
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.subtitle}>Latest order updates</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {notifications.length === 0 ? (
          <Text style={styles.emptyText}>No notifications yet.</Text>
        ) : (
          notifications.map((n) => (
            <View key={n.id} style={styles.card}>
              <Text style={styles.cardTitle}>{n.title}</Text>
              <Text style={styles.cardMeta}>{n.message}</Text>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: vendorColors.bg, paddingHorizontal: vendorSpacing.lg },
  heroCard: {
    marginTop: vendorSpacing.md,
    padding: vendorSpacing.lg,
    borderRadius: 20,
    backgroundColor: vendorColors.card,
    borderWidth: 1,
    borderColor: vendorColors.border,
  },
  title: { fontSize: 20, fontWeight: '800', color: vendorColors.text },
  subtitle: { color: vendorColors.muted, marginTop: 6, fontSize: 12 },
  list: { paddingVertical: vendorSpacing.md, paddingBottom: 120 },
  card: {
    backgroundColor: vendorColors.card,
    borderRadius: 16,
    padding: vendorSpacing.md,
    borderWidth: 1,
    borderColor: vendorColors.border,
    marginBottom: vendorSpacing.md,
  },
  cardTitle: { color: vendorColors.text, fontWeight: '700' },
  cardMeta: { color: vendorColors.muted, marginTop: 6, fontSize: 12 },
  emptyText: { color: vendorColors.muted, textAlign: 'center', marginTop: 24 },
  backBtn: {
    marginBottom: vendorSpacing.md,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: vendorColors.border,
    alignItems: 'center',
    backgroundColor: vendorColors.card,
  },
  backText: { color: vendorColors.muted, fontWeight: '700' },
});

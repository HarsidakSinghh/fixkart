import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { customerColors, customerSpacing } from './CustomerTheme';

export default function CustomerNotificationsScreen({ onBack }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const raw = await SecureStore.getItemAsync('customer_notifications');
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
  container: { flex: 1, backgroundColor: customerColors.bg, paddingHorizontal: customerSpacing.lg },
  heroCard: {
    marginTop: customerSpacing.md,
    padding: customerSpacing.lg,
    borderRadius: 20,
    backgroundColor: customerColors.card,
    borderWidth: 1,
    borderColor: customerColors.border,
  },
  title: { fontSize: 20, fontWeight: '800', color: customerColors.text },
  subtitle: { color: customerColors.muted, marginTop: 6, fontSize: 12 },
  list: { paddingVertical: customerSpacing.md, paddingBottom: 120 },
  card: {
    backgroundColor: customerColors.card,
    borderRadius: 16,
    padding: customerSpacing.md,
    borderWidth: 1,
    borderColor: customerColors.border,
    marginBottom: customerSpacing.md,
  },
  cardTitle: { color: customerColors.text, fontWeight: '700' },
  cardMeta: { color: customerColors.muted, marginTop: 6, fontSize: 12 },
  emptyText: { color: customerColors.muted, textAlign: 'center', marginTop: 24 },
  backBtn: {
    marginBottom: customerSpacing.md,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: customerColors.border,
    alignItems: 'center',
    backgroundColor: customerColors.card,
  },
  backText: { color: customerColors.muted, fontWeight: '700' },
});

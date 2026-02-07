import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { customerColors, customerSpacing } from '../customer/CustomerTheme';

export default function NotificationDebugScreen({ onBack }) {
  const [permission, setPermission] = useState('unknown');
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const perm = await Notifications.getPermissionsAsync();
      setPermission(perm.status || 'unknown');
    } catch (_) {
      setPermission('unknown');
    }
    try {
      const saved = await SecureStore.getItemAsync('expo_push_token');
      if (saved) setToken(saved);
    } catch (_) {
      // ignore
    }
    try {
      const savedStatus = await SecureStore.getItemAsync('expo_push_status');
      if (savedStatus) setStatus(savedStatus);
    } catch (_) {
      // ignore
    }
    try {
      const savedError = await SecureStore.getItemAsync('expo_push_error');
      if (savedError) setError(savedError);
    } catch (_) {
      // ignore
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Push Debug</Text>
        <Text style={styles.label}>Permission</Text>
        <Text style={styles.value}>{permission}</Text>
        <Text style={styles.label}>Registration</Text>
        <Text style={styles.value}>{status || 'unknown'}</Text>
        <Text style={styles.label}>Expo Token</Text>
        <Text style={styles.token}>{token || 'Not found'}</Text>
        {error ? (
          <>
            <Text style={styles.label}>Error</Text>
            <Text style={styles.errorText}>{error}</Text>
          </>
        ) : null}
      </View>

      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: customerColors.bg, padding: customerSpacing.lg },
  card: {
    backgroundColor: customerColors.card,
    borderRadius: 18,
    padding: customerSpacing.lg,
    borderWidth: 1,
    borderColor: customerColors.border,
  },
  title: { fontSize: 20, fontWeight: '800', color: customerColors.text },
  label: { marginTop: customerSpacing.md, color: customerColors.muted, fontSize: 12 },
  value: { color: customerColors.text, fontWeight: '700', marginTop: 4 },
  token: { color: customerColors.text, fontSize: 11, marginTop: 6 },
  errorText: { color: customerColors.danger, fontSize: 11, marginTop: 6 },
  backBtn: {
    marginTop: customerSpacing.lg,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: customerColors.border,
    alignItems: 'center',
    backgroundColor: customerColors.card,
  },
  backText: { color: customerColors.muted, fontWeight: '700' },
});

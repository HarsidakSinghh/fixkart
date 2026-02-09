import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Alert } from 'react-native';
import { vendorColors, vendorSpacing } from './VendorTheme';
import { createVendorSalesman, getVendorSalesmen } from './vendorApi';

export default function VendorSalesmenScreen({ onBack }) {
  const [salesmen, setSalesmen] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', code: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadSalesmen = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getVendorSalesmen();
      setSalesmen(data || []);
    } catch (error) {
      console.error('Failed to load salesmen', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSalesmen();
  }, [loadSalesmen]);

  const handleCreate = async () => {
    if (!form.phone || !form.code) {
      Alert.alert('Missing info', 'Phone and 4-digit code are required.');
      return;
    }
    if (String(form.code).length !== 4) {
      Alert.alert('Invalid code', 'Code must be 4 digits.');
      return;
    }
    setSubmitting(true);
    try {
      await createVendorSalesman({
        name: form.name,
        phone: form.phone,
        code: String(form.code),
      });
      setForm({ name: '', phone: '', code: '' });
      await loadSalesmen();
      Alert.alert('Salesman added', 'The salesman can now log in.');
    } catch (error) {
      Alert.alert('Failed', 'Unable to add salesman.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        {onBack ? (
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        ) : null}
        <Text style={styles.title}>Salesmen</Text>
        <Text style={styles.subtitle}>Create and manage your field team</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Add Salesman</Text>
        <TextInput
          style={styles.input}
          placeholder="Full name (optional)"
          placeholderTextColor={vendorColors.muted}
          value={form.name}
          onChangeText={(v) => setForm((prev) => ({ ...prev, name: v }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone number"
          placeholderTextColor={vendorColors.muted}
          keyboardType="phone-pad"
          value={form.phone}
          onChangeText={(v) => setForm((prev) => ({ ...prev, phone: v }))}
        />
        <TextInput
          style={styles.input}
          placeholder="4-digit code"
          placeholderTextColor={vendorColors.muted}
          keyboardType="number-pad"
          value={form.code}
          onChangeText={(v) => setForm((prev) => ({ ...prev, code: v }))}
          maxLength={4}
        />
        <TouchableOpacity style={styles.primaryBtn} onPress={handleCreate} disabled={submitting}>
          <Text style={styles.primaryText}>{submitting ? 'Saving…' : 'Add Salesman'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.listTitle}>Registered Salesmen</Text>
      <FlatList
        data={salesmen}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={loadSalesmen}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.listCard}>
            <View>
              <Text style={styles.name}>{item.name || 'Unnamed'}</Text>
              <Text style={styles.meta}>{item.phone}</Text>
            </View>
            <View style={styles.codePill}>
              <Text style={styles.codeText}>{item.code}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          !loading ? <Text style={styles.emptyText}>No salesmen yet.</Text> : null
        }
      />
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
  backText: { color: vendorColors.primary, fontWeight: '700', marginBottom: vendorSpacing.sm },
  card: {
    marginTop: vendorSpacing.md,
    backgroundColor: vendorColors.card,
    borderRadius: 18,
    padding: vendorSpacing.md,
    borderWidth: 1,
    borderColor: vendorColors.border,
  },
  sectionTitle: { color: vendorColors.text, fontWeight: '700', marginBottom: vendorSpacing.sm },
  input: {
    borderWidth: 1,
    borderColor: vendorColors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: vendorColors.text,
    backgroundColor: vendorColors.card,
    marginBottom: vendorSpacing.sm,
  },
  primaryBtn: {
    backgroundColor: vendorColors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryText: { color: '#FFFFFF', fontWeight: '700' },
  listTitle: { marginTop: vendorSpacing.md, color: vendorColors.text, fontWeight: '700' },
  list: { paddingVertical: vendorSpacing.sm, paddingBottom: 120 },
  listCard: {
    backgroundColor: vendorColors.card,
    borderRadius: 16,
    padding: vendorSpacing.md,
    borderWidth: 1,
    borderColor: vendorColors.border,
    marginBottom: vendorSpacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: { color: vendorColors.text, fontWeight: '700' },
  meta: { color: vendorColors.muted, fontSize: 12, marginTop: 4 },
  codePill: {
    backgroundColor: vendorColors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: vendorColors.border,
  },
  codeText: { color: vendorColors.primary, fontWeight: '700' },
  emptyText: { color: vendorColors.muted, textAlign: 'center', marginTop: vendorSpacing.md },
});

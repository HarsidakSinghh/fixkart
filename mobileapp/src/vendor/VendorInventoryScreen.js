import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView, TextInput } from 'react-native';
import { vendorColors, vendorSpacing } from './VendorTheme';
import { getVendorListings, updateVendorListing } from './vendorApi';

const STATUS_FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'LIVE', label: 'Live' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'ACTION', label: 'Needs Action' },
];

export default function VendorInventoryScreen() {
  const [listings, setListings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [editingId, setEditingId] = useState(null);
  const [drafts, setDrafts] = useState({});

  const loadListings = useCallback(async () => {
    try {
      const data = await getVendorListings();
      setListings(data.products || []);
    } catch (error) {
      console.error('Failed to load listings', error);
    }
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const filteredListings = useMemo(() => {
    if (statusFilter === 'ALL') return listings;
    if (statusFilter === 'LIVE') return listings.filter((p) => p.status === 'APPROVED' && p.isPublished);
    if (statusFilter === 'PENDING') return listings.filter((p) => p.status === 'PENDING');
    return listings.filter((p) => p.status === 'REJECTED');
  }, [listings, statusFilter]);

  const renderListing = ({ item }) => (
    <View style={styles.listingCard}>
      <Image source={{ uri: item.image }} style={styles.listingImage} />
      <View style={{ flex: 1 }}>
        <Text style={styles.productName}>{item.title || item.name}</Text>
        <Text style={styles.productMeta}>{item.subCategory || item.category}</Text>
        <Text style={styles.productSku}>SKU: {item.sku || 'N/A'}</Text>
        <View style={styles.metricsRow}>
          {editingId === item.id ? (
            <>
              <MetricInput
                label="Stock"
                value={drafts[item.id]?.quantity ?? item.quantity ?? 0}
                onChange={(value) => setDrafts((prev) => ({
                  ...prev,
                  [item.id]: { ...prev[item.id], quantity: value },
                }))}
              />
              <MetricInput
                label="Price"
                value={drafts[item.id]?.price ?? item.price ?? 0}
                onChange={(value) => setDrafts((prev) => ({
                  ...prev,
                  [item.id]: { ...prev[item.id], price: value },
                }))}
              />
            </>
          ) : (
            <>
              <Metric label="Stock" value={item.quantity ?? '—'} />
              <Metric label="Sold" value={item.sold ?? 0} />
              <Metric label="Price" value={item.price ? `₹${item.price}` : '—'} />
            </>
          )}
        </View>
        <View style={[styles.statusPill, statusStyle(item)]}>
          <Text style={styles.statusText}>{statusLabel(item)}</Text>
        </View>
        <View style={styles.editRow}>
          {editingId === item.id ? (
            <>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={async () => {
                  const payload = {
                    quantity: Number(drafts[item.id]?.quantity ?? item.quantity ?? 0),
                    price: Number(drafts[item.id]?.price ?? item.price ?? 0),
                  };
                  const res = await updateVendorListing(item.id, payload);
                  setListings((prev) =>
                    prev.map((p) => (p.id === item.id ? { ...p, ...res.product } : p))
                  );
                  setEditingId(null);
                }}
              >
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingId(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => {
                setDrafts((prev) => ({
                  ...prev,
                  [item.id]: { price: item.price ?? 0, quantity: item.quantity ?? 0 },
                }));
                setEditingId(item.id);
              }}
            >
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredListings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.productList}
        renderItem={renderListing}
        ListHeaderComponent={
          <View>
            <View style={styles.heroCard}>
              <Text style={styles.title}>Inventory</Text>
              <Text style={styles.subtitle}>Track listings and manage stock</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
              {STATUS_FILTERS.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.categoryPill, statusFilter === item.key && styles.categoryPillActive]}
                  onPress={() => setStatusFilter(item.key)}
                >
                  <Text style={[styles.categoryText, statusFilter === item.key && styles.categoryTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        }
      />
    </View>
  );

  function statusLabel(item) {
    if (item.status === 'APPROVED' && item.isPublished) return 'LIVE';
    if (item.status === 'PENDING') return 'PENDING';
    if (item.status === 'REJECTED') return 'ACTION REQUIRED';
    return item.status || 'PENDING';
  }

  function statusStyle(item) {
    if (item.status === 'APPROVED' && item.isPublished) return styles.statusLive;
    if (item.status === 'PENDING') return styles.statusPending;
    if (item.status === 'REJECTED') return styles.statusAction;
    return styles.statusPending;
  }
}

function Metric({ label, value }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function MetricInput({ label, value, onChange }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <TextInput
        style={styles.metricInput}
        value={String(value ?? '')}
        onChangeText={onChange}
        keyboardType="numeric"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: vendorColors.bg },
  heroCard: {
    marginHorizontal: vendorSpacing.lg,
    marginTop: vendorSpacing.md,
    padding: vendorSpacing.lg,
    borderRadius: 20,
    backgroundColor: vendorColors.card,
    borderWidth: 1,
    borderColor: vendorColors.border,
    shadowColor: vendorColors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  title: { fontSize: 20, fontWeight: '800', color: vendorColors.text },
  subtitle: { color: vendorColors.muted, marginTop: 6, fontSize: 12 },
  categoryRow: { paddingHorizontal: vendorSpacing.lg, paddingBottom: vendorSpacing.sm, paddingTop: vendorSpacing.md },
  categoryPill: {
    paddingHorizontal: vendorSpacing.md,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: vendorColors.border,
    marginRight: vendorSpacing.sm,
    backgroundColor: vendorColors.card,
  },
  categoryPillActive: { backgroundColor: vendorColors.primary, borderColor: vendorColors.primary },
  categoryText: { color: vendorColors.muted, fontWeight: '600', fontSize: 12 },
  categoryTextActive: { color: '#FFFFFF' },
  productList: { padding: vendorSpacing.lg, paddingBottom: 120, paddingTop: 0 },
  listingCard: {
    backgroundColor: vendorColors.card,
    borderRadius: 16,
    padding: vendorSpacing.md,
    borderWidth: 1,
    borderColor: vendorColors.border,
    marginBottom: vendorSpacing.md,
    flexDirection: 'row',
    gap: vendorSpacing.md,
  },
  listingImage: { width: 70, height: 70, borderRadius: 12, backgroundColor: vendorColors.surface },
  productName: { color: vendorColors.text, fontWeight: '700' },
  productMeta: { color: vendorColors.muted, marginTop: 4, fontSize: 12 },
  productSku: { color: vendorColors.muted, marginTop: 4, fontSize: 11 },
  metricsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  metricCard: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: vendorColors.surface,
  },
  metricLabel: { color: vendorColors.muted, fontSize: 10, fontWeight: '600' },
  metricValue: { color: vendorColors.text, fontSize: 12, fontWeight: '700' },
  metricInput: {
    color: vendorColors.text,
    fontSize: 12,
    fontWeight: '700',
    padding: 0,
  },
  statusPill: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: { color: '#FFFFFF', fontWeight: '700', fontSize: 10 },
  statusLive: { backgroundColor: vendorColors.primary },
  statusPending: { backgroundColor: vendorColors.accent },
  statusAction: { backgroundColor: '#D9534F' },
  editRow: { flexDirection: 'row', gap: vendorSpacing.sm, marginTop: vendorSpacing.sm },
  editBtn: {
    alignSelf: 'flex-start',
    backgroundColor: vendorColors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: vendorColors.border,
  },
  editText: { color: vendorColors.primary, fontWeight: '700', fontSize: 11 },
  saveBtn: {
    alignSelf: 'flex-start',
    backgroundColor: vendorColors.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveText: { color: '#FFFFFF', fontWeight: '700', fontSize: 11 },
  cancelBtn: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: vendorColors.border,
  },
  cancelText: { color: vendorColors.muted, fontWeight: '700', fontSize: 11 },
});

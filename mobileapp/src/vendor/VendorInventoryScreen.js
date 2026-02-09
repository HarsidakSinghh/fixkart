import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView, TextInput, ActivityIndicator, Modal } from 'react-native';
import { vendorColors, vendorSpacing } from './VendorTheme';
import { getVendorListings, updateVendorListing } from './vendorApi';
import StatusPill from '../components/StatusPill';

const STATUS_FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'LIVE', label: 'Live' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'ACTION', label: 'Needs Action' },
];

export default function VendorInventoryScreen() {
  const [listings, setListings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [detailModal, setDetailModal] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [detailForm, setDetailForm] = useState({});

  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getVendorListings();
      setListings(data.products || []);
    } catch (error) {
      console.error('Failed to load listings', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const filteredListings = useMemo(() => {
    let filtered = listings;
    if (statusFilter === 'LIVE') filtered = filtered.filter((p) => p.status === 'APPROVED' && p.isPublished);
    if (statusFilter === 'PENDING') filtered = filtered.filter((p) => p.status === 'PENDING');
    if (statusFilter === 'ACTION') filtered = filtered.filter((p) => p.status === 'REJECTED');
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((p) => {
        const name = `${p.title || p.name || ''}`.toLowerCase();
        const sku = `${p.sku || ''}`.toLowerCase();
        return name.includes(q) || sku.includes(q);
      });
    }
    return filtered;
  }, [listings, statusFilter, search]);

  const renderListing = ({ item }) => (
    <View style={styles.listingCard}>
      <Image source={{ uri: item.image }} style={styles.listingImage} />
      <View style={{ flex: 1 }}>
        <Text style={styles.productName}>{item.title || item.name}</Text>
        <Text style={styles.productMeta}>{item.subCategory || item.category}</Text>
        <Text style={styles.productSku}>SKU: {item.sku || 'N/A'}</Text>
        {typeof item.quantity === 'number' && item.quantity > 0 && item.quantity <= 5 ? (
          <View style={styles.lowStockPill}>
            <Text style={styles.lowStockText}>Only {item.quantity} left</Text>
          </View>
        ) : null}
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
        <StatusPill label={statusLabel(item)} tone={statusTone(item)} />
        <View style={styles.actionRow}>
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
            <>
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
                <Text style={styles.editText}>Quick Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.detailsBtn}
                onPress={() => {
                  setDetailItem(item);
                  setDetailForm({
                    title: item.title || item.name || '',
                    description: item.description || '',
                    brand: item.brand || '',
                    model: item.specs?.model || '',
                    color: item.specs?.color || '',
                    material: item.specs?.material || '',
                    size: item.specs?.size || '',
                    weight: item.specs?.weight || '',
                    certifications: item.specs?.certifications || '',
                    mrp: item.specs?.mrp || '',
                    discountedPrice: item.specs?.discountedPrice || '',
                    tieredPricing: item.specs?.tieredPricing || '',
                    hsnCode: item.specs?.hsnCode || '',
                    returnsPolicy: item.specs?.returnsPolicy || '',
                    warrantyPolicy: item.specs?.warrantyPolicy || '',
                    features: item.specs?.features || '',
                  });
                  setDetailModal(true);
                }}
              >
                <Text style={styles.detailsText}>Edit Details</Text>
              </TouchableOpacity>
            </>
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
        ListFooterComponent={
          loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={vendorColors.primary} />
              <Text style={styles.loadingText}>Loading inventory…</Text>
            </View>
          ) : null
        }
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
            <View style={styles.searchWrap}>
              <TextInput
                placeholder="Search by SKU or name"
                placeholderTextColor={vendorColors.muted}
                value={search}
                onChangeText={setSearch}
                style={styles.searchInput}
              />
            </View>
          </View>
        }
      />
      <Modal visible={detailModal} animationType="slide" transparent onRequestClose={() => setDetailModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Listing Details</Text>
            <Text style={styles.modalSubtitle}>{detailItem?.title || detailItem?.name}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {renderInput('Title', 'title')}
              {renderInput('Description', 'description', true)}
              {renderInput('Brand', 'brand')}
              {renderInput('Model', 'model')}
              {renderInput('Color', 'color')}
              {renderInput('Material', 'material')}
              {renderInput('Size', 'size')}
              {renderInput('Weight', 'weight')}
              {renderInput('Certifications', 'certifications')}
              {renderInput('MRP', 'mrp', false, 'numeric')}
              {renderInput('Discounted Price', 'discountedPrice', false, 'numeric')}
              {renderInput('Tiered Pricing', 'tieredPricing')}
              {renderInput('HSN / SAC', 'hsnCode')}
              {renderInput('Returns Policy', 'returnsPolicy', true)}
              {renderInput('Warranty Policy', 'warrantyPolicy', true)}
              {renderInput('Features', 'features', true)}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setDetailModal(false)}>
                <Text style={styles.cancelText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={async () => {
                  if (!detailItem?.id) return;
                  const payload = {
                    title: detailForm.title,
                    description: detailForm.description,
                    brand: detailForm.brand,
                    model: detailForm.model,
                    color: detailForm.color,
                    material: detailForm.material,
                    size: detailForm.size,
                    weight: detailForm.weight,
                    certifications: detailForm.certifications,
                    mrp: detailForm.mrp ? Number(detailForm.mrp) : undefined,
                    discountedPrice: detailForm.discountedPrice ? Number(detailForm.discountedPrice) : undefined,
                    tieredPricing: detailForm.tieredPricing,
                    hsnCode: detailForm.hsnCode,
                    returnsPolicy: detailForm.returnsPolicy,
                    warrantyPolicy: detailForm.warrantyPolicy,
                    features: detailForm.features,
                  };
                  const res = await updateVendorListing(detailItem.id, payload);
                  setListings((prev) =>
                    prev.map((p) => (p.id === detailItem.id ? { ...p, ...res.product } : p))
                  );
                  setDetailModal(false);
                }}
              >
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  function statusLabel(item) {
    if (item.status === 'APPROVED' && item.isPublished) return 'LIVE';
    if (item.status === 'PENDING') return 'PENDING';
    if (item.status === 'REJECTED') return 'ACTION REQUIRED';
    return item.status || 'PENDING';
  }

  function statusTone(item) {
    if (item.status === 'APPROVED' && item.isPublished) return 'success';
    if (item.status === 'PENDING') return 'warning';
    if (item.status === 'REJECTED') return 'danger';
    return 'warning';
  }

  function renderInput(label, key, multiline = false, keyboardType = 'default') {
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TextInput
          value={detailForm[key] ?? ''}
          onChangeText={(value) => setDetailForm((prev) => ({ ...prev, [key]: value }))}
          style={[styles.input, multiline && styles.inputMultiline]}
          multiline={multiline}
          keyboardType={keyboardType}
          placeholderTextColor={vendorColors.muted}
        />
      </View>
    );
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
  searchWrap: {
    marginTop: vendorSpacing.sm,
    marginHorizontal: vendorSpacing.lg,
    borderWidth: 1,
    borderColor: vendorColors.border,
    borderRadius: 12,
    backgroundColor: vendorColors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  searchInput: { color: vendorColors.text, fontSize: 12, paddingVertical: 6 },
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
  lowStockPill: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#2C1B0D',
    borderWidth: 1,
    borderColor: '#8C5B2D',
  },
  lowStockText: { color: '#F5C391', fontSize: 10, fontWeight: '700' },
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
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: vendorSpacing.sm, marginTop: vendorSpacing.sm },
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
  detailsBtn: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: vendorColors.primary,
    backgroundColor: 'rgba(26, 102, 73, 0.08)',
  },
  detailsText: { color: vendorColors.primary, fontWeight: '700', fontSize: 11 },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: vendorColors.card,
    padding: vendorSpacing.lg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: vendorColors.text },
  modalSubtitle: { color: vendorColors.muted, marginBottom: vendorSpacing.md },
  inputGroup: { marginBottom: vendorSpacing.sm },
  inputLabel: { color: vendorColors.muted, fontSize: 11, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: vendorColors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: vendorColors.text,
    backgroundColor: vendorColors.surface,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: vendorSpacing.md,
  },
});

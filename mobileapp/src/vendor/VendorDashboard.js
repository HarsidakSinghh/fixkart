import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Modal, ActivityIndicator, Image, ScrollView } from 'react-native';
import { vendorColors, vendorSpacing } from './VendorTheme';
import { getVendorCategories, getVendorProducts, getVendorListings, submitVendorProduct } from './vendorApi';
import UserHeader from '../components/UserHeader';

const STATUS_FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'LIVE', label: 'Live' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'ACTION', label: 'Needs Action' },
];

export default function VendorDashboard() {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [catalog, setCatalog] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('CATALOG');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [form, setForm] = useState({
    name: '',
    category: '',
    subCategory: '',
    sku: '',
    brand: '',
    model: '',
    description: '',
    features: '',
    weight: '',
    color: '',
    material: '',
    size: '',
    certifications: '',
    price: '',
    mrp: '',
    discountedPrice: '',
    tieredPricing: '',
    hsnCode: '',
    stock: '',
    returnsPolicy: '',
    warrantyPolicy: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const loadCategories = useCallback(async () => {
    try {
      const data = await getVendorCategories();
      const list = data.categories || [];
      setCategories(list);
      if (!activeCategory && list.length > 0) {
        setActiveCategory(list[0]);
      }
    } catch (error) {
      console.error('Failed to load categories', error);
    }
  }, [activeCategory]);

  const loadCatalog = useCallback(async () => {
    if (!activeCategory) return;
    setLoading(true);
    try {
      const data = await getVendorProducts(activeCategory);
      setCatalog(data.products || []);
    } catch (error) {
      console.error('Failed to load products', error);
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  const loadListings = useCallback(async () => {
    try {
      const data = await getVendorListings();
      setListings(data.products || []);
    } catch (error) {
      console.error('Failed to load listings', error);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const filteredListings = useMemo(() => {
    if (statusFilter === 'ALL') return listings;
    if (statusFilter === 'LIVE') return listings.filter((p) => p.status === 'APPROVED' && p.isPublished);
    if (statusFilter === 'PENDING') return listings.filter((p) => p.status === 'PENDING');
    return listings.filter((p) => p.status === 'REJECTED');
  }, [listings, statusFilter]);

  const openModal = (product) => {
    const autoSku = product.sku || `${product.name || 'sku'}-${Date.now()}`;
    setSelectedProduct(product);
    setForm({
      name: product.title || product.name,
      category: product.category,
      subCategory: product.subCategory || '',
      sku: autoSku,
      brand: '',
      model: '',
      description: '',
      features: '',
      weight: '',
      color: '',
      material: '',
      size: '',
      certifications: '',
      price: '',
      mrp: '',
      discountedPrice: '',
      tieredPricing: '',
      hsnCode: '',
      stock: '',
      returnsPolicy: '',
      warrantyPolicy: '',
    });
    setMessage('');
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.category || !form.price) {
      setMessage('Name, category, and price are required.');
      return;
    }
    setSubmitting(true);
    try {
      await submitVendorProduct({
        baseProductId: selectedProduct.id,
        name: form.name,
        category: form.category,
        subCategory: form.subCategory,
        sku: form.sku,
        brand: form.brand,
        model: form.model,
        description: form.description,
        features: form.features,
        specs: {
          weight: form.weight,
          color: form.color,
          material: form.material,
          size: form.size,
          certifications: form.certifications,
        },
        price: Number(form.price),
        mrp: form.mrp,
        discountedPrice: form.discountedPrice,
        tieredPricing: form.tieredPricing,
        hsnCode: form.hsnCode,
        stock: form.stock,
        returnsPolicy: form.returnsPolicy,
        warrantyPolicy: form.warrantyPolicy,
      });
      setMessage('Submitted for approval.');
      await loadListings();
    } catch (error) {
      setMessage('Failed to submit product.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderCatalogItem = ({ item }) => (
    <View style={styles.productCard}>
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <View style={{ flex: 1 }}>
        <Text style={styles.productName}>{item.title || item.name}</Text>
        <Text style={styles.productMeta}>{item.subCategory || item.category}</Text>
        <Text style={styles.productSku}>SKU: {item.sku || 'Auto'}</Text>
      </View>
      <TouchableOpacity style={styles.addButton} onPress={() => openModal(item)}>
        <Text style={styles.addText}>Add</Text>
      </TouchableOpacity>
    </View>
  );

  const renderListing = ({ item }) => (
    <View style={styles.listingCard}>
      <Image source={{ uri: item.image }} style={styles.listingImage} />
      <View style={{ flex: 1 }}>
        <Text style={styles.productName}>{item.title || item.name}</Text>
        <Text style={styles.productMeta}>{item.subCategory || item.category}</Text>
        <Text style={styles.productSku}>SKU: {item.sku || 'N/A'}</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusPill, statusStyle(item)]}>
            <Text style={styles.statusText}>{statusLabel(item)}</Text>
          </View>
          <Text style={styles.metric}>Views: 0</Text>
          <Text style={styles.metric}>Sales: 0</Text>
          <Text style={styles.metric}>CR: 0%</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <UserHeader showLogout />
      <View style={styles.header}>
        <Text style={styles.title}>Vendor Dashboard</Text>
        <Text style={styles.subtitle}>Manage catalog & approvals</Text>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'CATALOG' && styles.tabActive]}
          onPress={() => setActiveTab('CATALOG')}
        >
          <Text style={[styles.tabText, activeTab === 'CATALOG' && styles.tabTextActive]}>Catalog</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'LISTINGS' && styles.tabActive]}
          onPress={() => setActiveTab('LISTINGS')}
        >
          <Text style={[styles.tabText, activeTab === 'LISTINGS' && styles.tabTextActive]}>My Listings</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'CATALOG' ? (
        <>
          <FlatList
            data={categories}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.categoryPill, item === activeCategory && styles.categoryPillActive]}
                onPress={() => setActiveCategory(item)}
              >
                <Text style={[styles.categoryText, item === activeCategory && styles.categoryTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={vendorColors.primary} />
              <Text style={styles.loadingText}>Loading products…</Text>
            </View>
          ) : (
            <FlatList
              data={catalog}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.productList}
              renderItem={renderCatalogItem}
            />
          )}
        </>
      ) : (
        <>
          <FlatList
            data={STATUS_FILTERS}
            keyExtractor={(item) => item.key}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.categoryPill, statusFilter === item.key && styles.categoryPillActive]}
                onPress={() => setStatusFilter(item.key)}
              >
                <Text style={[styles.categoryText, statusFilter === item.key && styles.categoryTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
          <FlatList
            data={filteredListings}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.productList}
            renderItem={renderListing}
          />
        </>
      )}

      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Add Product</Text>
              <Text style={styles.modalSubtitle}>{selectedProduct?.title || selectedProduct?.name}</Text>

              {renderInput('Name', 'name')}
              {renderInput('Category', 'category', true)}
              {renderInput('Subcategory', 'subCategory', true)}
              {renderInput('SKU / Part Number', 'sku', true)}
              {renderInput('Brand', 'brand')}
              {renderInput('Model', 'model')}
              {renderInput('Description', 'description', false, true)}
              {renderInput('Features (comma separated)', 'features')}
              {renderInput('Weight', 'weight')}
              {renderInput('Color', 'color')}
              {renderInput('Material', 'material')}
              {renderInput('Size', 'size')}
              {renderInput('Certifications', 'certifications')}
              {renderInput('Base Price', 'price')}
              {renderInput('MRP', 'mrp')}
              {renderInput('Discounted Price', 'discountedPrice')}
              {renderInput('Tiered Pricing', 'tieredPricing')}
              {renderInput('HSN/SAC Code', 'hsnCode')}
              {renderInput('Stock / Availability', 'stock')}
              {renderInput('Return Policy', 'returnsPolicy', false, true)}
              {renderInput('Warranty Info', 'warrantyPolicy', false, true)}

              {!!message && <Text style={styles.message}>{message}</Text>}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalOpen(false)}>
                <Text style={styles.cancelText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
                <Text style={styles.submitText}>{submitting ? 'Submitting…' : 'Submit'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  function renderInput(label, key, disabled = false, multiline = false) {
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TextInput
          style={[styles.input, disabled && styles.inputDisabled, multiline && styles.inputMultiline]}
          value={form[key]}
          onChangeText={(value) => setForm((prev) => ({ ...prev, [key]: value }))}
          editable={!disabled}
          multiline={multiline}
          placeholderTextColor={vendorColors.muted}
        />
      </View>
    );
  }

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: vendorColors.bg },
  header: { padding: vendorSpacing.lg },
  title: { fontSize: 20, fontWeight: '800', color: vendorColors.text },
  subtitle: { color: vendorColors.muted, marginTop: 4 },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: vendorSpacing.lg,
    backgroundColor: vendorColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: vendorColors.border,
    overflow: 'hidden',
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabActive: { backgroundColor: vendorColors.primary },
  tabText: { fontWeight: '700', color: vendorColors.muted, fontSize: 12 },
  tabTextActive: { color: '#FFFFFF' },
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
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 8, color: vendorColors.muted },
  productList: { padding: vendorSpacing.lg, paddingBottom: 120 },
  productCard: {
    backgroundColor: vendorColors.card,
    borderRadius: 16,
    padding: vendorSpacing.md,
    borderWidth: 1,
    borderColor: vendorColors.border,
    marginBottom: vendorSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: vendorSpacing.md,
  },
  productImage: { width: 56, height: 56, borderRadius: 10, backgroundColor: vendorColors.surface },
  productName: { color: vendorColors.text, fontWeight: '700' },
  productMeta: { color: vendorColors.muted, marginTop: 4, fontSize: 12 },
  productSku: { color: vendorColors.muted, marginTop: 4, fontSize: 11 },
  addButton: {
    backgroundColor: vendorColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addText: { color: '#FFFFFF', fontWeight: '700', fontSize: 11 },
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
  listingImage: { width: 64, height: 64, borderRadius: 10, backgroundColor: vendorColors.surface },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6, alignItems: 'center' },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: { color: '#FFFFFF', fontWeight: '700', fontSize: 10 },
  statusLive: { backgroundColor: vendorColors.primary },
  statusPending: { backgroundColor: vendorColors.warning },
  statusAction: { backgroundColor: '#D9534F' },
  metric: { color: vendorColors.muted, fontSize: 11 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: vendorSpacing.lg,
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: vendorColors.card,
    borderRadius: 18,
    padding: vendorSpacing.lg,
    borderWidth: 1,
    borderColor: vendorColors.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: vendorColors.text },
  modalSubtitle: { color: vendorColors.muted, marginTop: 4, marginBottom: vendorSpacing.md },
  inputGroup: { marginBottom: vendorSpacing.md },
  inputLabel: { color: vendorColors.muted, fontSize: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: vendorColors.border,
    borderRadius: 12,
    paddingHorizontal: vendorSpacing.md,
    paddingVertical: 10,
    color: vendorColors.text,
    backgroundColor: vendorColors.card,
  },
  inputDisabled: { backgroundColor: vendorColors.surface },
  inputMultiline: { minHeight: 90, textAlignVertical: 'top' },
  message: { marginTop: vendorSpacing.sm, color: vendorColors.primary, fontWeight: '600' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: vendorSpacing.sm },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: vendorColors.border,
  },
  cancelText: { color: vendorColors.muted, fontWeight: '600' },
  submitBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: vendorColors.primary,
  },
  submitText: { color: '#FFFFFF', fontWeight: '700' },
});

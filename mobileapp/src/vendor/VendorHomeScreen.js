import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { vendorColors, vendorSpacing } from './VendorTheme';
import { submitVendorProduct, uploadVendorListingImage } from './vendorApi';
import { VENDOR_INVENTORY } from '../data/vendorInventory';

export default function VendorHomeScreen({ canAdd, status }) {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [types, setTypes] = useState([]);
  const [activeType, setActiveType] = useState('');
  const [loading, setLoading] = useState(false);
  const [typesLoading, setTypesLoading] = useState(true);
  const [search, setSearch] = useState('');
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
    commissionPercent: '',
    stock: '',
    returnsPolicy: '',
    warrantyPolicy: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [customImagePreview, setCustomImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadCategories = useCallback(() => {
    const titles = VENDOR_INVENTORY.map((cat) => cat.title);
    const merged = ['All', ...titles];
    setCategories(merged);
    if (!activeCategory && merged.length > 0) {
      setActiveCategory('All');
    }
    setTypesLoading(false);
  }, [activeCategory]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

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
    setShowAdvanced(false);
    setCustomImageUrl('');
    setCustomImagePreview('');
    setModalOpen(true);
  };

  const handlePickCustomImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setMessage('Gallery permission is required to upload image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.75,
      allowsEditing: true,
      base64: true,
    });
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    if (!asset.base64) {
      setMessage('Could not read image. Please choose another image.');
      return;
    }

    setUploadingImage(true);
    setMessage('');
    setCustomImagePreview(asset.uri || '');
    try {
      const uploadRes = await uploadVendorListingImage(asset.base64, `vendor-listing-${Date.now()}`);
      setCustomImageUrl(uploadRes?.url || '');
      if (!uploadRes?.url) {
        setMessage('Image upload failed. Please try again.');
      }
    } catch (error) {
      setMessage('Image upload failed. Please try again.');
      setCustomImagePreview('');
      setCustomImageUrl('');
    } finally {
      setUploadingImage(false);
    }
  };

  const openType = (item) => {
    setSearch('');
    setActiveType(item.label);
    openModal({
      id: null,
      name: item.label,
      title: item.label,
      category: item.category,
      subCategory: item.label,
      image: item.image,
    });
  };

  const resetTypes = () => {
    setActiveType('');
    setSearch('');
  };

  const handleSubmit = async () => {
    const commissionValue = Number(form.commissionPercent);
    if (!form.name || !form.category || !form.price || !form.commissionPercent) {
      setMessage('Name, category, and price are required.');
      return;
    }
    if (Number.isNaN(commissionValue) || commissionValue < 5) {
      setMessage('Commission must be at least 5%.');
      return;
    }
    setSubmitting(true);
    try {
      await submitVendorProduct({
        baseProductId: selectedProduct.id || null,
        imageUrl: customImageUrl || selectedProduct.image || '',
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
          commissionPercent: commissionValue,
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
        <Text style={styles.productName} numberOfLines={2}>
          {item.title || item.name}
        </Text>
        <Text style={styles.productMeta} numberOfLines={1}>
          {item.subCategory || item.category}
        </Text>
        <Text style={styles.productSku} numberOfLines={1}>
          SKU: {item.sku || 'Auto'}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.addButton, !canAdd && styles.addButtonDisabled]}
        onPress={() => canAdd && openModal(item)}
        disabled={!canAdd}
      >
        <Text style={styles.addText}>{canAdd ? 'Add' : 'Locked'}</Text>
      </TouchableOpacity>
    </View>
  );

  const showProducts = search.trim() || activeType;
  const inventoryTypes = useMemo(() => {
    const baseUrl = process.env.EXPO_PUBLIC_VENDOR_CATALOG_BASE_URL || 'https://fixkart-main.vercel.app';
    const normalizePath = (path) => {
      if (!path) return '';
      const cleaned = path.replace(/\\\\/g, '/').replace(/\\/g, '/');
      const normalized = cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
      return encodeURI(normalized);
    };
    const selectedCategories =
      activeCategory && activeCategory !== 'All'
        ? VENDOR_INVENTORY.filter((cat) => cat.title === activeCategory)
        : VENDOR_INVENTORY;
    const types = [];
    selectedCategories.forEach((cat) => {
      cat.items.forEach((item) => {
        types.push({
          id: `${cat.title}-${item.name}`,
          label: item.name,
          category: cat.title,
          image: item.imagePath ? `${baseUrl}${normalizePath(item.imagePath)}` : '',
        });
      });
    });
    return types;
  }, [activeCategory]);
  const filteredTypes = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return inventoryTypes;
    return inventoryTypes.filter((item) => item.label.toLowerCase().includes(term));
  }, [inventoryTypes, search]);
  const gridData = useMemo(() => {
    const base = filteredTypes;
    if (!base || base.length === 0) return [];
    if (base.length % 2 === 0) return base;
    return [...base, { id: '__spacer__', spacer: true }];
  }, [filteredTypes]);

  return (
    <View style={styles.container}>
      <FlatList
        data={gridData}
        keyExtractor={(item, index) => item.id || item.label || `spacer-${index}`}
        numColumns={2}
        columnWrapperStyle={styles.typeRow}
        contentContainerStyle={styles.productList}
        renderItem={({ item }) =>
          item.spacer ? (
            <View style={[styles.typeCard, styles.typeCardSpacer]} />
          ) : (
            <TouchableOpacity style={styles.typeCard} onPress={() => openType(item)}>
              <View style={styles.typeImage}>
                {item.image ? <Image source={{ uri: item.image }} style={styles.typeImage} /> : null}
                <View style={styles.typeImageOverlay} />
              </View>
              <Text style={styles.typeLabel} numberOfLines={2}>{item.label}</Text>
              <TouchableOpacity style={styles.typeAction} onPress={() => openType(item)}>
                <Text style={styles.typeActionText}>Add listing</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )
        }
        ListEmptyComponent={
          !typesLoading ? (
            <View style={styles.loadingWrap}>
              <Text style={styles.loadingText}>No items found.</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          typesLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={vendorColors.primary} />
              <Text style={styles.loadingText}>Loading types…</Text>
            </View>
          ) : null
        }
        ListHeaderComponent={
          <View>
            <View style={styles.heroCard}>
              <Text style={styles.heroTitle}>Catalog</Text>
              <Text style={styles.heroSubtitle}>
                {'Pick a product type to add your inventory.'}
              </Text>
              <View style={[styles.heroBadge, styles.heroBadgeSingle]}>
                <Text style={styles.heroBadgeText}>Status</Text>
                <Text style={styles.heroBadgeValue}>{status}</Text>
              </View>
            </View>

            {!canAdd ? (
              <View style={styles.banner}>
                <Text style={styles.bannerTitle}>Approval Pending</Text>
                <Text style={styles.bannerText}>You can add products after admin approval.</Text>
              </View>
            ) : null}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRow}
            >
              {categories.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.categoryPill, item === activeCategory && styles.categoryPillActive]}
                  onPress={() => {
                    setActiveCategory(item);
                    resetTypes();
                  }}
                >
                  <Text style={[styles.categoryText, item === activeCategory && styles.categoryTextActive]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.searchWrap}>
              <TextInput
                placeholder="Search products to add listing"
                placeholderTextColor={vendorColors.muted}
                value={search}
                onChangeText={(value) => {
                  setSearch(value);
                  if (value.trim()) {
                    setActiveType('');
                  }
                }}
                style={styles.searchInput}
              />
              {search.trim() ? (
                <TouchableOpacity style={styles.clearBtn} onPress={resetTypes}>
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              ) : null}
            </View>

          </View>
        }
      />

      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Add Product</Text>
              <Text style={styles.modalSubtitle}>{selectedProduct?.title || selectedProduct?.name}</Text>

              <Text style={styles.inputLabel}>Product Image</Text>
              <View style={styles.imagePickerRow}>
                <View style={styles.selectedImageWrap}>
                  {customImagePreview ? (
                    <Image source={{ uri: customImagePreview }} style={styles.selectedImage} />
                  ) : selectedProduct?.image ? (
                    <Image source={{ uri: selectedProduct.image }} style={styles.selectedImage} />
                  ) : (
                    <View style={[styles.selectedImage, styles.selectedImagePlaceholder]}>
                      <Text style={styles.selectedImagePlaceholderText}>No image</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity style={styles.uploadImageBtn} onPress={handlePickCustomImage} disabled={uploadingImage}>
                  <Text style={styles.uploadImageBtnText}>{uploadingImage ? 'Uploading…' : 'Upload custom image'}</Text>
                </TouchableOpacity>
              </View>

              {renderInput('Name', 'name')}
              {renderInput('Category', 'category', true)}
              {renderInput('Subcategory', 'subCategory', true)}
              {renderInput('SKU / Part Number', 'sku', true)}
              {renderInput('Base Price', 'price')}
              {renderInput('Platform Commission (%)', 'commissionPercent')}
              {renderInput('Stock / Availability', 'stock')}

              <TouchableOpacity
                style={styles.advancedToggle}
                onPress={() => setShowAdvanced((prev) => !prev)}
              >
                <Text style={styles.advancedText}>{showAdvanced ? 'Hide advanced fields' : 'Show advanced fields'}</Text>
              </TouchableOpacity>

              {showAdvanced ? (
                <>
                  {renderInput('Brand', 'brand')}
                  {renderInput('Model', 'model')}
                  {renderInput('Description', 'description', false, true)}
                  {renderInput('Features (comma separated)', 'features')}
                  {renderInput('Weight', 'weight')}
                  {renderInput('Color', 'color')}
                  {renderInput('Material', 'material')}
                  {renderInput('Size', 'size')}
                  {renderInput('Certifications', 'certifications')}
                  {renderInput('MRP', 'mrp')}
                  {renderInput('Discounted Price', 'discountedPrice')}
                  {renderInput('Tiered Pricing', 'tieredPricing')}
                  {renderInput('HSN/SAC Code', 'hsnCode')}
                  {renderInput('Return Policy', 'returnsPolicy', false, true)}
                  {renderInput('Warranty Info', 'warrantyPolicy', false, true)}
                </>
              ) : null}

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
  heroTitle: { fontSize: 20, fontWeight: '800', color: vendorColors.text },
  heroSubtitle: { color: vendorColors.muted, marginTop: 6, fontSize: 12 },
  heroBadge: {
    flex: 1,
    padding: vendorSpacing.sm,
    borderRadius: 14,
    backgroundColor: vendorColors.surface,
    marginTop: vendorSpacing.md,
  },
  heroBadgeSingle: { maxWidth: 160 },
  heroBadgeText: { color: vendorColors.muted, fontSize: 11, fontWeight: '600' },
  heroBadgeValue: { marginTop: 4, color: vendorColors.text, fontWeight: '700', fontSize: 12 },
  banner: {
    marginHorizontal: vendorSpacing.lg,
    marginTop: vendorSpacing.md,
    backgroundColor: vendorColors.surface,
    borderRadius: 14,
    padding: vendorSpacing.md,
    borderWidth: 1,
    borderColor: vendorColors.border,
  },
  bannerTitle: { color: vendorColors.text, fontWeight: '700' },
  bannerText: { color: vendorColors.muted, marginTop: 4, fontSize: 12 },
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
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: vendorSpacing.lg,
    marginTop: vendorSpacing.sm,
    backgroundColor: vendorColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: vendorColors.border,
    paddingHorizontal: vendorSpacing.md,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    color: vendorColors.text,
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: vendorColors.surface,
    borderWidth: 1,
    borderColor: vendorColors.border,
  },
  clearText: { color: vendorColors.primary, fontWeight: '700', fontSize: 11 },
  activeTypeRow: {
    marginHorizontal: vendorSpacing.lg,
    marginTop: vendorSpacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backText: { color: vendorColors.primary, fontWeight: '700' },
  activeTypeLabel: { color: vendorColors.text, fontWeight: '700' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 8, color: vendorColors.muted },
  productList: { padding: vendorSpacing.lg, paddingBottom: 120, paddingTop: 0 },
  typeRow: { justifyContent: 'space-between', gap: 12 },
  typeCard: {
    flex: 1,
    backgroundColor: vendorColors.card,
    borderRadius: 16,
    padding: vendorSpacing.sm,
    borderWidth: 1,
    borderColor: vendorColors.border,
    marginBottom: vendorSpacing.sm,
    minHeight: 170,
    justifyContent: 'space-between',
  },
  typeCardSpacer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  typeImage: {
    width: '100%',
    height: 90,
    borderRadius: 12,
    backgroundColor: vendorColors.surface,
    position: 'relative',
    overflow: 'hidden',
  },
  typeImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.08)',
    borderRadius: 12,
  },
  typeLabel: { color: vendorColors.text, fontWeight: '700', marginTop: 8, fontSize: 12 },
  typeAction: {
    marginTop: 8,
    backgroundColor: vendorColors.primary,
    borderRadius: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  typeActionText: { color: '#fff', fontWeight: '700', fontSize: 11 },
  productGridCard: {
    flex: 1,
    backgroundColor: vendorColors.card,
    borderRadius: 16,
    padding: vendorSpacing.sm,
    borderWidth: 1,
    borderColor: vendorColors.border,
    marginBottom: vendorSpacing.sm,
  },
  productGridImage: { width: '100%', height: 90, borderRadius: 12, backgroundColor: vendorColors.surface },
  productGridTitle: { color: vendorColors.text, fontWeight: '700', marginTop: 8, fontSize: 12 },
  productGridMeta: { color: vendorColors.muted, marginTop: 4, fontSize: 11 },
  productGridButton: {
    marginTop: 8,
    backgroundColor: vendorColors.primary,
    borderRadius: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  productGridText: { color: '#fff', fontWeight: '700', fontSize: 11 },
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
  addButtonDisabled: { backgroundColor: vendorColors.muted },
  addText: { color: '#FFFFFF', fontWeight: '700', fontSize: 11 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
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
  advancedToggle: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: vendorColors.border,
    backgroundColor: vendorColors.surface,
    marginBottom: vendorSpacing.md,
  },
  advancedText: { color: vendorColors.primary, fontWeight: '700', fontSize: 12 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: vendorColors.text },
  modalSubtitle: { color: vendorColors.muted, marginTop: 4, marginBottom: vendorSpacing.md },
  imagePickerRow: {
    marginBottom: vendorSpacing.md,
  },
  selectedImageWrap: {
    width: 120,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: vendorColors.border,
    backgroundColor: vendorColors.surface,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  selectedImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedImagePlaceholderText: {
    color: vendorColors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  uploadImageBtn: {
    marginTop: vendorSpacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: vendorColors.border,
    backgroundColor: vendorColors.surface,
  },
  uploadImageBtnText: {
    color: vendorColors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
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

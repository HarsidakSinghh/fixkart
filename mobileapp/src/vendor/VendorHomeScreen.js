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
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { vendorColors, vendorSpacing } from './VendorTheme';
import {
  submitVendorProduct,
  uploadVendorListingImage,
  generateBulkVendorListings,
  submitBulkVendorListings,
} from './vendorApi';
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
    cartonPieces: '',
    returnsPolicy: '',
    warrantyPolicy: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customImageUrls, setCustomImageUrls] = useState([]);
  const [customImagePreviews, setCustomImagePreviews] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkPreviewOpen, setBulkPreviewOpen] = useState(false);
  const [bulkDrafts, setBulkDrafts] = useState([]);
  const [bulkParsedPages, setBulkParsedPages] = useState(0);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [editingDraft, setEditingDraft] = useState(null);
  const [bulkCategoryPickerOpen, setBulkCategoryPickerOpen] = useState(false);
  const [pendingBulkType, setPendingBulkType] = useState('');
  const [bulkGrade, setBulkGrade] = useState('');
  const [bulkCustomType, setBulkCustomType] = useState('');

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
      commissionPercent: '',
      stock: '',
      cartonPieces: '',
      returnsPolicy: '',
      warrantyPolicy: '',
    });
    setMessage('');
    setShowAdvanced(false);
    setCustomImageUrls([]);
    setCustomImagePreviews([]);
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
      allowsEditing: false,
      allowsMultipleSelection: true,
      base64: true,
      selectionLimit: 8,
    });
    if (result.canceled || !result.assets?.length) return;

    const assets = result.assets || [];
    if (!assets.length) return;
    if (assets.some((asset) => !asset.base64)) {
      setMessage('Could not read image. Please choose another image.');
      return;
    }

    setUploadingImage(true);
    setMessage('');
    setCustomImagePreviews(assets.map((asset) => asset.uri).filter(Boolean));
    try {
      const uploads = await Promise.all(
        assets.map((asset, index) =>
          uploadVendorListingImage(asset.base64, `vendor-listing-${Date.now()}-${index}`)
        )
      );
      const urls = uploads.map((u) => u?.url).filter(Boolean);
      setCustomImageUrls(urls);
      if (!urls.length) {
        setMessage('Image upload failed. Please try again.');
      }
    } catch (error) {
      setMessage('Image upload failed. Please try again.');
      setCustomImagePreviews([]);
      setCustomImageUrls([]);
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

  const uriToDataUrl = useCallback(async (uri, mimeType = 'application/octet-stream') => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Unable to read file'));
      reader.readAsDataURL(blob);
    });
    if (!String(dataUrl).startsWith('data:')) {
      throw new Error('Invalid file format');
    }
    return String(dataUrl).replace(/^data:[^;]+/, `data:${mimeType}`);
  }, []);

  const pickBulkUploadFile = useCallback(async () => {
    if (!canAdd) {
      Alert.alert('Unavailable', 'You can upload listings after admin approval.');
      return;
    }
    try {
      setBulkParsedPages(0);
      const picked = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (picked.canceled) return;
      const asset = picked.assets?.[0];
      if (!asset?.uri) return;
      if (asset.size && asset.size > 3 * 1024 * 1024) {
        Alert.alert('File too large', 'Please upload a file smaller than 3MB for bulk generation.');
        return;
      }

      setBulkGenerating(true);
      setBulkProgress(0.08);
      const progressTicker = setInterval(() => {
        setBulkProgress((prev) => (prev >= 0.9 ? 0.9 : prev + 0.06));
      }, 350);

      try {
        const mime = asset.mimeType || (asset.name?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
        const dataUrl = await uriToDataUrl(asset.uri, mime);
        setBulkProgress(0.45);
        const response = await generateBulkVendorListings({
          fileDataUrl: dataUrl,
          fileName: asset.name || `bulk-${Date.now()}`,
          mimeType: mime,
        });
        setBulkParsedPages(Number(response?.parsedPages || 0));
        const drafts = Array.isArray(response?.drafts) ? response.drafts : [];
        setBulkDrafts(
          drafts.map((item, idx) => ({
            ...item,
            tempId: item.tempId || `${Date.now()}-${idx}`,
            price: String(item.price ?? ''),
            stock: String(item.stock ?? '100'),
            cartonPieces: String(item.cartonPieces ?? '100'),
            customType: String(item.customType || item.type || '').trim(),
          }))
        );
        setBulkProgress(1);
        if (!drafts.length) {
          Alert.alert('No listings found', 'Could not detect listings from this file. Try a clearer file or edit manually.');
        } else if (response?.requiresCategorySelection) {
          setPendingBulkType(String(response?.suggestedType || '').trim());
          setBulkCategoryPickerOpen(true);
        } else {
          setBulkPreviewOpen(true);
        }
      } catch (error) {
        const message = String(error?.message || '');
        let display = 'Could not generate listings from this file.';
        try {
          const parsed = JSON.parse(message);
          display = parsed?.error || display;
        } catch (_) {
          if (message) display = message;
        }
        Alert.alert('Generation failed', display);
      } finally {
        clearInterval(progressTicker);
        setTimeout(() => {
          setBulkGenerating(false);
          setBulkProgress(0);
        }, 300);
      }
    } catch (error) {
      Alert.alert('Upload failed', 'Unable to read selected file.');
    }
  }, [canAdd, uriToDataUrl]);

  const applyBulkCategory = useCallback((categoryName) => {
    const normalizedType = pendingBulkType || 'New Product Type';
    const normalizedGrade = String(bulkGrade || '').trim();
    const normalizedCustomType = String(bulkCustomType || '').trim();
    const applyGradeInDescription = (description) => {
      if (!normalizedGrade) return description || '';
      const base = String(description || '').trim();
      if (/\bgrade\s*:/i.test(base)) return base;
      return `${base}${base ? ' ' : ''}Grade: ${normalizedGrade}`.trim();
    };
    setBulkDrafts((prev) =>
      prev.map((item) => ({
        ...item,
        category: categoryName,
        subCategory: item.subCategory || normalizedType,
        grade: item.grade || normalizedGrade,
        customType: item.customType || normalizedCustomType,
        description: applyGradeInDescription(item.description),
        name:
          item.name && item.name.toLowerCase().includes((normalizedType || '').toLowerCase())
            ? item.name
            : `${normalizedType.toLowerCase()} ${item.size || ''}`.trim(),
      }))
    );
    setBulkCategoryPickerOpen(false);
    setBulkGrade('');
    setBulkCustomType('');
    setBulkPreviewOpen(true);
  }, [bulkCustomType, bulkGrade, pendingBulkType]);

  const removeDraft = useCallback((tempId) => {
    setBulkDrafts((prev) => prev.filter((item) => item.tempId !== tempId));
  }, []);

  const rejectAllDrafts = useCallback(() => {
    Alert.alert('Reject all', 'Remove all generated listings?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject all',
        style: 'destructive',
        onPress: () => {
          setBulkDrafts([]);
          setBulkParsedPages(0);
          setBulkPreviewOpen(false);
        },
      },
    ]);
  }, []);

  const submitAllDrafts = useCallback(async () => {
    if (!bulkDrafts.length) {
      Alert.alert('No listings', 'Nothing to submit.');
      return;
    }
    setBulkSubmitting(true);
    try {
      const payload = bulkDrafts.map((item) => {
        const grade = String(item.grade || bulkGrade || '').trim();
        const customType = String(item.customType || bulkCustomType || '').trim();
        const baseDescription = String(item.description || '').trim();
        const mergedDescription =
          grade && !/\bgrade\s*:/i.test(baseDescription)
            ? `${baseDescription}${baseDescription ? ' ' : ''}Grade: ${grade}`.trim()
            : baseDescription;
        return {
          ...item,
          price: Number(item.price || 0),
          stock: Number(item.stock || 0),
          cartonPieces: Number(item.cartonPieces || 0),
          description: mergedDescription,
          grade,
          customType,
        };
      });
      const response = await submitBulkVendorListings(payload);
      Alert.alert(
        'Submitted',
        `${response?.createdCount || 0} listings submitted for approval${response?.failedCount ? `, ${response.failedCount} failed` : ''}.`
      );
      setBulkPreviewOpen(false);
      setBulkDrafts([]);
      setBulkParsedPages(0);
    } catch (error) {
      Alert.alert('Submit failed', 'Could not submit generated listings.');
    } finally {
      setBulkSubmitting(false);
    }
  }, [bulkCustomType, bulkDrafts, bulkGrade]);

  const handleSubmit = async () => {
    const commissionValue = Number(form.commissionPercent);
    const cartonPiecesValue = form.cartonPieces ? Number(form.cartonPieces) : null;
    if (!form.name || !form.category || !form.price || !form.commissionPercent) {
      setMessage('Name, category, and price are required.');
      return;
    }
    if (Number.isNaN(commissionValue) || commissionValue < 5) {
      setMessage('Commission must be at least 5%.');
      return;
    }
    if (cartonPiecesValue !== null && (!Number.isFinite(cartonPiecesValue) || cartonPiecesValue <= 0)) {
      setMessage('Carton (pieces) must be a positive number.');
      return;
    }
    setSubmitting(true);
    try {
      await submitVendorProduct({
        baseProductId: selectedProduct.id || null,
        imageUrl: customImageUrls[0] || selectedProduct.image || '',
        imageUrls: customImageUrls,
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
          cartonPieces: cartonPiecesValue,
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
      Alert.alert('Submitted', 'Submitted for approval', [
        {
          text: 'OK',
          onPress: () => {
            setModalOpen(false);
            setSelectedProduct(null);
            setSearch('');
            setActiveType('');
          },
        },
      ]);
    } catch (error) {
      setMessage('Failed to submit product.');
      Alert.alert('Failed', 'Failed to submit product.');
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
            <TouchableOpacity
              style={[styles.bulkUploadBtn, !canAdd ? styles.bulkUploadBtnDisabled : null]}
              onPress={pickBulkUploadFile}
              disabled={!canAdd}
            >
              <Text style={styles.bulkUploadText}>Bulk Upload (PDF/Image)</Text>
            </TouchableOpacity>

          </View>
        }
      />

      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Add Product</Text>
              <Text style={styles.modalSubtitle}>{selectedProduct?.title || selectedProduct?.name}</Text>

              <Text style={styles.inputLabel}>Product Images</Text>
              <View style={styles.imagePickerRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewRow}>
                  {customImagePreviews.length ? (
                    customImagePreviews.map((uri, idx) => (
                      <View key={`${uri}-${idx}`} style={styles.selectedImageWrap}>
                        <Image source={{ uri }} style={styles.selectedImage} />
                      </View>
                    ))
                  ) : selectedProduct?.image ? (
                    <View style={styles.selectedImageWrap}>
                      <Image source={{ uri: selectedProduct.image }} style={styles.selectedImage} />
                    </View>
                  ) : (
                    <View style={[styles.selectedImage, styles.selectedImagePlaceholder]}>
                      <Text style={styles.selectedImagePlaceholderText}>No image</Text>
                    </View>
                  )}
                </ScrollView>
                <TouchableOpacity style={styles.uploadImageBtn} onPress={handlePickCustomImage} disabled={uploadingImage}>
                  <Text style={styles.uploadImageBtnText}>{uploadingImage ? 'Uploading…' : 'Upload images'}</Text>
                </TouchableOpacity>
              </View>

              {renderInput('Name', 'name')}
              {renderInput('Category', 'category', true)}
              {renderInput('Subcategory', 'subCategory', true)}
              {renderInput('SKU / Part Number', 'sku', true)}
              {renderInput('Base Price', 'price')}
              {renderInput('Platform Commission (%)', 'commissionPercent')}
              {renderInput('Stock / Availability', 'stock')}
              {renderInput('Carton (pieces)', 'cartonPieces')}

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

      <Modal visible={bulkPreviewOpen} transparent animationType="slide" onRequestClose={() => setBulkPreviewOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.bulkModalCard}>
            <Text style={styles.modalTitle}>Generated Listings Preview</Text>
            <Text style={styles.modalSubtitle}>
              {bulkDrafts.length} listings ready{bulkParsedPages ? ` • ${bulkParsedPages} page(s) parsed` : ''}
            </Text>
            <View style={styles.bulkMetaInputRow}>
              <View style={[styles.inputGroup, styles.bulkMetaInput]}>
                <Text style={styles.inputLabel}>Grade (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={bulkGrade}
                  onChangeText={setBulkGrade}
                  placeholder="Apply to all listings"
                  placeholderTextColor={vendorColors.muted}
                />
              </View>
              <View style={[styles.inputGroup, styles.bulkMetaInput]}>
                <Text style={styles.inputLabel}>Type (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={bulkCustomType}
                  onChangeText={setBulkCustomType}
                  placeholder="Shown on product page"
                  placeholderTextColor={vendorColors.muted}
                />
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
              {bulkDrafts.map((item) => (
                <View key={item.tempId} style={styles.previewCard}>
                  <Image source={{ uri: item.image }} style={styles.previewImage} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.previewTitle} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.previewMeta}>Size: {item.size || '-'}</Text>
                    <Text style={styles.previewMeta}>Price: ₹{item.price || 0}</Text>
                    <Text style={styles.previewMeta}>Pieces/Carton: {item.cartonPieces || '-'}</Text>
                    <Text style={styles.previewMeta}>Grade: {item.grade || bulkGrade || '-'}</Text>
                    <Text style={styles.previewMeta}>Type: {item.customType || bulkCustomType || '-'}</Text>
                  </View>
                  <View style={styles.previewActions}>
                    <TouchableOpacity style={styles.previewEditBtn} onPress={() => setEditingDraft(item)}>
                      <Text style={styles.previewEditText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.previewRemoveBtn} onPress={() => removeDraft(item.tempId)}>
                      <Text style={styles.previewRemoveText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.bulkActionRow}>
              <TouchableOpacity style={styles.rejectAllBtn} onPress={rejectAllDrafts}>
                <Text style={styles.rejectAllText}>Reject All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, bulkSubmitting ? { opacity: 0.7 } : null]}
                onPress={submitAllDrafts}
                disabled={bulkSubmitting}
              >
                <Text style={styles.submitText}>{bulkSubmitting ? 'Submitting…' : 'Submit All'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={bulkCategoryPickerOpen} transparent animationType="fade" onRequestClose={() => setBulkCategoryPickerOpen(false)}>
        <View style={styles.processingBackdrop}>
          <View style={styles.categoryPickerCard}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <Text style={styles.modalSubtitle}>
              {`Type "${pendingBulkType || 'new product'}" was not found. Choose category for generated listings.`}
            </Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Grade (optional)</Text>
              <TextInput
                style={styles.input}
                value={bulkGrade}
                onChangeText={setBulkGrade}
                placeholder="e.g. A2-70 / 8.8"
                placeholderTextColor={vendorColors.muted}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Type (optional)</Text>
              <TextInput
                style={styles.input}
                value={bulkCustomType}
                onChangeText={setBulkCustomType}
                placeholder="Shown on product page only"
                placeholderTextColor={vendorColors.muted}
              />
            </View>
            <ScrollView style={styles.categoryPickerScroll} contentContainerStyle={styles.categoryPickerGrid} showsVerticalScrollIndicator={false}>
              {categories
                .filter((cat) => cat && cat !== 'All')
                .map((cat) => (
                  <TouchableOpacity key={`bulk-cat-${cat}`} style={styles.categoryChoice} onPress={() => applyBulkCategory(cat)}>
                    <Text style={styles.categoryChoiceText}>{cat}</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setBulkCategoryPickerOpen(false)}>
                <Text style={styles.cancelText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!editingDraft} transparent animationType="slide" onRequestClose={() => setEditingDraft(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Generated Listing</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {renderDraftInput('Name', 'name')}
              {renderDraftInput('Category', 'category')}
              {renderDraftInput('Subcategory', 'subCategory')}
              {renderDraftInput('Size', 'size')}
              {renderDraftInput('Price', 'price', 'numeric')}
              {renderDraftInput('Stock', 'stock', 'numeric')}
              {renderDraftInput('Carton (pieces)', 'cartonPieces', 'numeric')}
              {renderDraftInput('Grade (optional)', 'grade')}
              {renderDraftInput('Type (optional)', 'customType')}
              {renderDraftInput('Brand', 'brand')}
              {renderDraftInput('Description', 'description', 'default', true)}
              {renderDraftInput('Image URL', 'image')}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingDraft(null)}>
                <Text style={styles.cancelText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={() => {
                  if (!editingDraft?.tempId) return;
                  setBulkDrafts((prev) =>
                    prev.map((item) => (item.tempId === editingDraft.tempId ? editingDraft : item))
                  );
                  setEditingDraft(null);
                }}
              >
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={bulkGenerating} transparent animationType="fade">
        <View style={styles.processingBackdrop}>
          <View style={styles.processingCard}>
            <ActivityIndicator color={vendorColors.primary} size="large" />
            <Text style={styles.processingTitle}>Generating listings...</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.max(6, Math.round(bulkProgress * 100))}%` }]} />
            </View>
            <Text style={styles.processingSub}>{Math.round(bulkProgress * 100)}%</Text>
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

  function renderDraftInput(label, key, keyboardType = 'default', multiline = false) {
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TextInput
          style={[styles.input, multiline && styles.inputMultiline]}
          value={editingDraft?.[key] == null ? '' : String(editingDraft[key])}
          onChangeText={(value) => setEditingDraft((prev) => ({ ...(prev || {}), [key]: value }))}
          keyboardType={keyboardType}
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
  bulkUploadBtn: {
    marginHorizontal: vendorSpacing.lg,
    marginTop: vendorSpacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: vendorColors.primary,
    backgroundColor: 'rgba(26, 102, 73, 0.08)',
    paddingVertical: 10,
    alignItems: 'center',
  },
  bulkUploadBtnDisabled: { opacity: 0.5 },
  bulkUploadText: { color: vendorColors.primary, fontWeight: '800', fontSize: 12 },
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
  bulkModalCard: {
    width: '100%',
    minHeight: '68%',
    maxHeight: '92%',
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
  previewCard: {
    flexDirection: 'row',
    gap: vendorSpacing.sm,
    borderWidth: 1,
    borderColor: vendorColors.border,
    borderRadius: 12,
    backgroundColor: vendorColors.surface,
    padding: vendorSpacing.sm,
    marginBottom: vendorSpacing.sm,
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: vendorColors.card,
  },
  previewTitle: { color: vendorColors.text, fontWeight: '700', fontSize: 12 },
  previewMeta: { color: vendorColors.muted, marginTop: 2, fontSize: 11 },
  bulkMetaInputRow: {
    flexDirection: 'row',
    gap: vendorSpacing.sm,
  },
  bulkMetaInput: {
    flex: 1,
    marginBottom: vendorSpacing.sm,
  },
  previewActions: { justifyContent: 'space-between' },
  previewEditBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: vendorColors.primary,
    backgroundColor: 'rgba(26, 102, 73, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  previewEditText: { color: vendorColors.primary, fontWeight: '700', fontSize: 11 },
  previewRemoveBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E05252',
    backgroundColor: 'rgba(224, 82, 82, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    marginTop: 6,
  },
  previewRemoveText: { color: '#E05252', fontWeight: '700', fontSize: 11 },
  bulkActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: vendorSpacing.sm,
    marginTop: vendorSpacing.sm,
  },
  rejectAllBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E05252',
    backgroundColor: 'rgba(224, 82, 82, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  rejectAllText: { color: '#E05252', fontWeight: '800', fontSize: 12 },
  imagePickerRow: {
    marginBottom: vendorSpacing.md,
  },
  previewRow: {
    gap: 8,
    paddingRight: 6,
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
  processingBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: vendorSpacing.lg,
  },
  processingCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: vendorColors.border,
    backgroundColor: vendorColors.card,
    padding: vendorSpacing.lg,
    alignItems: 'center',
  },
  processingTitle: { marginTop: 10, color: vendorColors.text, fontWeight: '800', fontSize: 16 },
  processingSub: { marginTop: 8, color: vendorColors.muted, fontWeight: '700' },
  progressTrack: {
    width: '100%',
    marginTop: 12,
    height: 8,
    borderRadius: 999,
    backgroundColor: vendorColors.surface,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: vendorColors.primary,
  },
  categoryPickerCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '82%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: vendorColors.border,
    backgroundColor: vendorColors.card,
    padding: vendorSpacing.lg,
  },
  categoryPickerScroll: {
    marginTop: 6,
    maxHeight: 420,
  },
  categoryPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
    marginBottom: 12,
  },
  categoryChoice: {
    borderWidth: 1,
    borderColor: vendorColors.border,
    backgroundColor: vendorColors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryChoiceText: { color: vendorColors.text, fontWeight: '700', fontSize: 12 },
});

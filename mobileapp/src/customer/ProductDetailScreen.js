import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { customerColors, customerSpacing } from './CustomerTheme';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getStoreProduct } from './storeApi';

export default function ProductDetailScreen({ product, onBack, onLogin }) {
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const [detail, setDetail] = useState(product);
  const [loading, setLoading] = useState(false);

  const handleAdd = () => {
    if (!isAuthenticated) {
      onLogin();
      return;
    }
    addItem(detail || product);
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!product?.id) return;
      if (product?.description) {
        setDetail(product);
        return;
      }
      try {
        setLoading(true);
        const data = await getStoreProduct(product.id);
        if (mounted) setDetail(data.product || product);
      } catch (_) {
        if (mounted) setDetail(product);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [product]);

  if (!product) return null;
  const view = detail || product;
  const imageWidth = Dimensions.get('window').width - customerSpacing.lg * 2 - customerSpacing.md * 2;
  const photos = [view.image, ...(Array.isArray(view.gallery) ? view.gallery : [])]
    .filter(Boolean)
    .filter((uri, index, arr) => arr.indexOf(uri) === index);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.imageWrap}>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
          {photos.map((uri, idx) => (
            <Image
              key={`${uri}-${idx}`}
              source={{ uri }}
              style={[styles.image, { width: imageWidth }]}
              resizeMode="contain"
            />
          ))}
        </ScrollView>
        {photos.length > 1 ? (
          <View style={styles.dotRow}>
            {photos.map((uri, idx) => (
              <View key={`dot-${uri}-${idx}`} style={styles.dot} />
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{view.title || view.name}</Text>
        <Text style={styles.meta}>{view.subCategory || view.category}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{Math.round(view.price || 0)}</Text>
          <Text style={styles.stock}>{view.quantity > 0 ? 'In stock' : 'Out of stock'}</Text>
        </View>

        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>
          {loading ? 'Loading description…' : view.description || view.features || 'No description available yet.'}
        </Text>
      </View>
      </ScrollView>
      <View style={styles.stickyBar}>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: customerColors.bg },
  scrollContent: { paddingBottom: 120 },
  backButton: { padding: customerSpacing.lg },
  backText: { color: customerColors.primary, fontWeight: '700' },
  imageWrap: {
    marginHorizontal: customerSpacing.lg,
    backgroundColor: customerColors.card,
    borderRadius: 20,
    padding: customerSpacing.md,
    borderWidth: 1,
    borderColor: customerColors.border,
  },
  image: {
    height: 260,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: customerColors.surface,
  },
  dotRow: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 99, backgroundColor: customerColors.muted },
  content: { padding: customerSpacing.lg },
  title: { fontSize: 20, fontWeight: '800', color: customerColors.text },
  meta: { color: customerColors.muted, marginTop: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  price: { fontSize: 22, fontWeight: '800', color: customerColors.primary },
  stock: { color: customerColors.success, fontWeight: '700', fontSize: 12 },
  addButton: {
    backgroundColor: customerColors.primary,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  addText: { color: '#FFFFFF', fontWeight: '700' },
  sectionTitle: { marginTop: customerSpacing.xl, fontWeight: '700', color: customerColors.text },
  description: { marginTop: customerSpacing.sm, color: customerColors.muted, lineHeight: 20 },
  stickyBar: {
    position: 'absolute',
    left: customerSpacing.lg,
    right: customerSpacing.lg,
    bottom: customerSpacing.lg,
    backgroundColor: customerColors.card,
    padding: customerSpacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: customerColors.border,
    shadowColor: customerColors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});

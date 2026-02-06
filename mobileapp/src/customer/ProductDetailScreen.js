import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { customerColors, customerSpacing } from './CustomerTheme';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function ProductDetailScreen({ product, onBack, onLogin }) {
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();

  const handleAdd = () => {
    if (!isAuthenticated) {
      onLogin();
      return;
    }
    addItem(product);
  };

  if (!product) return null;

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.imageWrap}>
        <Image source={{ uri: product.image }} style={styles.image} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{product.name}</Text>
        <Text style={styles.meta}>{product.subCategory || product.category}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{Math.round(product.price || 0)}</Text>
          <Text style={styles.stock}>{product.quantity > 0 ? 'In stock' : 'Out of stock'}</Text>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addText}>Add to Cart</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{product.description}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: customerColors.bg },
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
  image: { width: '100%', height: 260, borderRadius: 16 },
  content: { padding: customerSpacing.lg },
  title: { fontSize: 20, fontWeight: '800', color: customerColors.text },
  meta: { color: customerColors.muted, marginTop: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  price: { fontSize: 22, fontWeight: '800', color: customerColors.primary },
  stock: { color: customerColors.success, fontWeight: '700', fontSize: 12 },
  addButton: {
    marginTop: customerSpacing.lg,
    backgroundColor: customerColors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  addText: { color: '#FFFFFF', fontWeight: '700' },
  sectionTitle: { marginTop: customerSpacing.xl, fontWeight: '700', color: customerColors.text },
  description: { marginTop: customerSpacing.sm, color: customerColors.muted, lineHeight: 20 },
});

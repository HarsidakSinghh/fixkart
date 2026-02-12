import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { customerColors, customerSpacing } from './CustomerTheme';

export default function ProductCard({ product, onPress, onAdd }) {
  const lowStock = typeof product.quantity === 'number' && product.quantity > 0 && product.quantity <= 2;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imageWrap}>
        <Image source={{ uri: product.image }} style={styles.image} resizeMode="contain" />
      </View>
      <Text style={styles.title} numberOfLines={2}>{product.name}</Text>
      <Text style={styles.meta} numberOfLines={1}>{product.subCategory || product.category}</Text>
      {lowStock ? (
        <View style={styles.stockPill}>
          <Text style={styles.stockText}>Only {product.quantity} left</Text>
        </View>
      ) : null}
      <View style={styles.footer}>
        <View>
          <Text style={styles.priceLabel}>Price</Text>
          <Text style={styles.price}>₹{Math.round(product.price || 0)}</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={onAdd}>
          <Text style={styles.addText}>Add</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: customerColors.card,
    borderRadius: 18,
    padding: customerSpacing.md,
    borderWidth: 1,
    borderColor: customerColors.border,
    width: '48%',
    marginBottom: customerSpacing.md,
    shadowColor: customerColors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  imageWrap: {
    backgroundColor: customerColors.surface,
    borderRadius: 14,
    padding: 10,
  },
  image: {
    width: '100%',
    height: 110,
    borderRadius: 10,
    backgroundColor: customerColors.surface,
  },
  title: {
    color: customerColors.text,
    fontSize: 13,
    fontWeight: '700',
    marginTop: customerSpacing.sm,
  },
  meta: {
    color: customerColors.muted,
    fontSize: 11,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: customerSpacing.sm,
  },
  priceLabel: { color: customerColors.muted, fontSize: 10 },
  price: { color: customerColors.primary, fontWeight: '800', fontSize: 14 },
  addButton: {
    backgroundColor: customerColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addText: { color: '#FFFFFF', fontWeight: '700', fontSize: 11 },
  stockPill: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FFE9E0',
  },
  stockText: {
    color: '#B54708',
    fontSize: 10,
    fontWeight: '700',
  },
});

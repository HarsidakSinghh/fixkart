import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Alert, ScrollView } from 'react-native';
import { customerColors, customerSpacing } from './CustomerTheme';
import { getTypeListings, getReviewSummaries } from './storeApi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function CustomerTypeListingsScreen({
  typeLabel,
  typeCategory = '',
  onBack,
  onOpenProduct,
  onOpenLogin,
}) {
  const [items, setItems] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTypeListings(typeLabel, typeCategory);
      const listings = data.listings || [];
      const summaries = await getReviewSummaries(listings.map((item) => item.id));
      setItems(
        listings.map((item) => ({
          ...item,
          averageRating: summaries[item.id]?.averageRating || 0,
          reviewCount: summaries[item.id]?.reviewCount || 0,
        }))
      );
    } catch (error) {
      console.error('Failed to load type listings', error);
    } finally {
      setLoading(false);
    }
  }, [typeLabel, typeCategory]);

  useEffect(() => {
    load();
  }, [load]);

  const gradeOptions = useMemo(() => {
    const set = new Set(items.map((item) => String(item?.grade || '').trim()).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [items]);

  const typeOptions = useMemo(() => {
    const set = new Set(items.map((item) => String(item?.customType || '').trim()).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [items]);

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const grade = String(item?.grade || '').trim();
        const type = String(item?.customType || '').trim();
        const gradeOk = selectedGrade === 'All' || grade === selectedGrade;
        const typeOk = selectedType === 'All' || type === selectedType;
        return gradeOk && typeOk;
      }),
    [items, selectedGrade, selectedType]
  );

  useEffect(() => {
    if (!gradeOptions.includes(selectedGrade)) setSelectedGrade('All');
  }, [gradeOptions, selectedGrade]);

  useEffect(() => {
    if (!typeOptions.includes(selectedType)) setSelectedType('All');
  }, [selectedType, typeOptions]);

  const handleAdd = (item) => {
    if (!isAuthenticated) {
      onOpenLogin?.();
      return;
    }
    if (typeof item.quantity === 'number' && item.quantity <= 0) {
      Alert.alert('Out of stock', 'This item is currently unavailable.');
      return;
    }
    const result = addItem(item);
    if (!result.added) {
      const label = result.maxQty ? `Only ${result.maxQty} left in stock.` : 'Stock limit reached.';
      Alert.alert('Stock limit reached', label);
      return;
    }
    Alert.alert('Added to cart', `${item.name} has been added.`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{typeLabel} Inventory</Text>
        <Text style={styles.subtitle}>
          {typeCategory ? `${typeCategory} • Select from vendor listings` : 'Select from vendor listings'}
        </Text>
        {gradeOptions.length > 1 ? (
          <View style={styles.filterBlock}>
            <Text style={styles.filterTitle}>Grades</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {gradeOptions.map((grade) => (
                <TouchableOpacity
                  key={`grade-${grade}`}
                  style={[styles.filterChip, selectedGrade === grade && styles.filterChipActive]}
                  onPress={() => setSelectedGrade(grade)}
                >
                  <Text style={[styles.filterChipText, selectedGrade === grade && styles.filterChipTextActive]}>{grade}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}
        {typeOptions.length > 1 ? (
          <View style={styles.filterBlock}>
            <Text style={styles.filterTitle}>Types</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {typeOptions.map((t) => (
                <TouchableOpacity
                  key={`type-${t}`}
                  style={[styles.filterChip, selectedType === t && styles.filterChipActive]}
                  onPress={() => setSelectedType(t)}
                >
                  <Text style={[styles.filterChipText, selectedType === t && styles.filterChipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={customerColors.primary} />
          <Text style={styles.loadingText}>Loading listings…</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.listingCard} onPress={() => onOpenProduct(item)}>
              <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="contain" />
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.cardVendor} numberOfLines={1}>{item.vendorName}</Text>
                {item.grade ? <Text style={styles.cardSpec}>Grade: {item.grade}</Text> : null}
                {item.customType ? <Text style={styles.cardSpec}>Type: {item.customType}</Text> : null}
                {Number(item.averageRating || 0) >= 4 ? (
                  <Text style={styles.ratingText}>★ {Number(item.averageRating).toFixed(1)}/5</Text>
                ) : null}
                <View style={styles.cardRow}>
                  <Text style={styles.cardPrice}>₹{Math.round(item.price || 0)}</Text>
                  <Text style={styles.cardMeta}>Qty: {item.quantity ?? 0}</Text>
                </View>
                <TouchableOpacity style={styles.addButton} onPress={() => handleAdd(item)}>
                  <Text style={styles.addText}>Add to cart</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No listings found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: customerColors.bg },
  hero: {
    paddingHorizontal: customerSpacing.lg,
    paddingTop: customerSpacing.lg,
  },
  backText: { color: customerColors.primary, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '800', color: customerColors.text, marginTop: 8 },
  subtitle: { color: customerColors.muted, marginTop: 6, fontSize: 12 },
  filterBlock: { marginTop: 10 },
  filterTitle: { color: customerColors.text, fontWeight: '700', fontSize: 12, marginBottom: 6 },
  filterRow: { gap: 8, paddingRight: 10 },
  filterChip: {
    borderWidth: 1,
    borderColor: customerColors.border,
    backgroundColor: customerColors.card,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  filterChipActive: {
    borderColor: customerColors.primary,
    backgroundColor: 'rgba(11, 97, 85, 0.08)',
  },
  filterChipText: { color: customerColors.muted, fontSize: 12, fontWeight: '700' },
  filterChipTextActive: { color: customerColors.primary },
  grid: { paddingHorizontal: customerSpacing.lg, paddingBottom: 160, paddingTop: customerSpacing.md },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 8, color: customerColors.muted },
  emptyWrap: { alignItems: 'center', paddingVertical: customerSpacing.xl },
  emptyText: { color: customerColors.muted },
  listingCard: {
    backgroundColor: customerColors.card,
    borderRadius: 18,
    padding: customerSpacing.md,
    borderWidth: 1,
    borderColor: customerColors.border,
    marginBottom: customerSpacing.sm,
    flexDirection: 'row',
    gap: 12,
  },
  cardImage: {
    width: 104,
    height: 104,
    borderRadius: 14,
    backgroundColor: customerColors.surface,
    padding: 6,
  },
  cardBody: { flex: 1, justifyContent: 'space-between' },
  cardTitle: { color: customerColors.text, fontWeight: '700' },
  cardVendor: { color: customerColors.muted, fontSize: 12, marginTop: 4 },
  cardSpec: { color: customerColors.muted, fontSize: 11, marginTop: 2 },
  ratingText: { color: '#B45309', fontSize: 12, fontWeight: '700', marginTop: 4 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' },
  cardPrice: { color: customerColors.primary, fontWeight: '800' },
  cardMeta: { color: customerColors.muted, fontSize: 12 },
  addButton: {
    marginTop: 10,
    backgroundColor: customerColors.primary,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
  },
  addText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { customerColors, customerSpacing } from './CustomerTheme';
import { getStoreProducts } from './storeApi';
import ProductCard from './ProductCard';

export default function CustomerTypeListingsScreen({ typeLabel, onBack, onOpenProduct }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getStoreProducts({ subCategory: typeLabel });
      setItems(data.products || []);
    } catch (error) {
      console.error('Failed to load type listings', error);
    } finally {
      setLoading(false);
    }
  }, [typeLabel]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{typeLabel} Inventory</Text>
        <Text style={styles.subtitle}>Select from vendor listings</Text>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={customerColors.primary} />
          <Text style={styles.loadingText}>Loading listings…</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <ProductCard product={item} onPress={() => onOpenProduct(item)} />
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
  grid: { paddingHorizontal: customerSpacing.lg, paddingBottom: 160, paddingTop: customerSpacing.md },
  gridRow: { justifyContent: 'space-between' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 8, color: customerColors.muted },
  emptyWrap: { alignItems: 'center', paddingVertical: customerSpacing.xl },
  emptyText: { color: customerColors.muted },
});

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { customerColors, customerSpacing } from './CustomerTheme';
import { getTypeListings } from './storeApi';

export default function CustomerTypeListingsScreen({ typeLabel, onBack, onOpenProduct }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTypeListings(typeLabel);
      setItems(data.listings || []);
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
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.listingCard} onPress={() => onOpenProduct(item)}>
              <View style={styles.cardTop}>
                <View>
                  <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.cardVendor} numberOfLines={1}>{item.vendorName}</Text>
                </View>
                <Text style={styles.cardPrice}>₹{Math.round(item.price || 0)}</Text>
              </View>
              <Text style={styles.cardMeta}>Qty: {item.quantity ?? 0}</Text>
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
  grid: { paddingHorizontal: customerSpacing.lg, paddingBottom: 160, paddingTop: customerSpacing.md },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 8, color: customerColors.muted },
  emptyWrap: { alignItems: 'center', paddingVertical: customerSpacing.xl },
  emptyText: { color: customerColors.muted },
  listingCard: {
    backgroundColor: customerColors.card,
    borderRadius: 16,
    padding: customerSpacing.md,
    borderWidth: 1,
    borderColor: customerColors.border,
    marginBottom: customerSpacing.sm,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  cardTitle: { color: customerColors.text, fontWeight: '700', flex: 1 },
  cardVendor: { color: customerColors.muted, fontSize: 12, marginTop: 4 },
  cardPrice: { color: customerColors.primary, fontWeight: '800' },
  cardMeta: { color: customerColors.muted, marginTop: 6, fontSize: 12 },
});

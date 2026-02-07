import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Image } from 'react-native';
import { customerColors, customerSpacing } from './CustomerTheme';
import CustomerHeader from './CustomerHeader';
import CategoryDrawer from './CategoryDrawer';
import { getStoreTypes } from './storeApi';
import { useAuth } from '../context/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-expo';

export default function CustomerHomeScreen({ onOpenProduct, onOpenLogin }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [types, setTypes] = useState([]);
  const { isAuthenticated, clearSession } = useAuth();
  const { signOut } = useClerkAuth();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  const [loadingTypes, setLoadingTypes] = useState(false);

  const loadTypes = useCallback(async () => {
    setLoadingTypes(true);
    try {
      const data = await getStoreTypes(category === 'All' ? '' : category);
      setTypes(data.types || []);
    } catch (error) {
      console.error('Failed to load types', error);
    } finally {
      setLoadingTypes(false);
    }
  }, [category]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTypes();
  }, [loadTypes]);

  const filteredTypes = useMemo(() => {
    if (!debouncedQuery) return types;
    const needle = debouncedQuery.toLowerCase();
    return types.filter((item) => item.label?.toLowerCase().includes(needle));
  }, [types, debouncedQuery]);

  return (
    <View style={styles.container}>
      <CustomerHeader
        query={query}
        onQueryChange={setQuery}
        onLogin={onOpenLogin}
        onToggleMenu={() => setDrawerOpen(true)}
        categoryLabel={category}
        isAuthenticated={isAuthenticated}
        onLogout={async () => {
          await signOut();
          await clearSession();
        }}
      />

      <FlatList
        data={filteredTypes}
        keyExtractor={(item) => item.label}
        numColumns={2}
        columnWrapperStyle={styles.typeRow}
        contentContainerStyle={styles.typesGrid}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              try {
                await loadTypes();
              } finally {
                setRefreshing(false);
              }
            }}
          />
        }
        ListEmptyComponent={
          !loadingTypes ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No types found.</Text>
              <Text style={styles.emptySubtext}>Try a different category or search.</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loadingTypes ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator color={customerColors.primary} />
              <Text style={styles.footerText}>Loading types…</Text>
            </View>
          ) : null
        }
        ListHeaderComponent={() => (
          <>
            <View style={styles.hero}>
              <Text style={styles.heroOverline}>Trusted Industrial Supply</Text>
              <Text style={styles.heroTitle}>Worldwide supply for fasteners & tools.</Text>
              <Text style={styles.heroSubtitle}>Shop reliable inventory, verified vendors, and fast delivery.</Text>
              <TouchableOpacity style={styles.heroButton}>
                <Text style={styles.heroButtonText}>Explore Services</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>{category === 'All' ? 'Browse Types' : category}</Text>
                <Text style={styles.sectionSubtitle}>
                  {loadingTypes ? 'Loading types…' : `${filteredTypes.length} types`}
                </Text>
              </View>
              <TouchableOpacity style={styles.filterButton} onPress={() => setDrawerOpen(true)}>
                <Text style={styles.filterText}>Filter</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.typeCard}
            onPress={() => onOpenProduct({ type: item.label, isType: true })}
          >
            <View style={styles.typeImage}>
              {item.image ? <Image source={{ uri: item.image }} style={styles.typeImage} /> : null}
            </View>
            <Text style={styles.typeLabel} numberOfLines={2}>
              {item.label}
            </Text>
            <Text style={styles.typeMeta}>{item.count} listings</Text>
          </TouchableOpacity>
        )}
      />

      <CategoryDrawer
        visible={drawerOpen}
        active={category}
        onClose={() => setDrawerOpen(false)}
        onSelect={setCategory}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: customerColors.bg },
  hero: {
    marginHorizontal: customerSpacing.lg,
    marginTop: customerSpacing.lg,
    backgroundColor: customerColors.surface,
    borderRadius: 22,
    padding: customerSpacing.lg,
    borderWidth: 1,
    borderColor: customerColors.border,
    shadowColor: customerColors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  heroOverline: {
    color: customerColors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: customerColors.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: customerSpacing.sm,
  },
  heroSubtitle: { color: customerColors.muted, fontSize: 13, marginTop: 6 },
  heroButton: {
    marginTop: customerSpacing.md,
    backgroundColor: customerColors.primary,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  heroButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  sectionHeader: {
    paddingHorizontal: customerSpacing.lg,
    marginTop: customerSpacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { color: customerColors.text, fontSize: 16, fontWeight: '700' },
  sectionSubtitle: { color: customerColors.muted, fontSize: 12, marginTop: 4 },
  filterButton: {
    backgroundColor: customerColors.card,
    borderWidth: 1,
    borderColor: customerColors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  filterText: { color: customerColors.primary, fontWeight: '700', fontSize: 12 },
  typeSection: {
    paddingHorizontal: customerSpacing.lg,
    marginTop: customerSpacing.md,
  },
  typeTitle: { color: customerColors.text, fontWeight: '700', marginBottom: customerSpacing.sm },
  typeRow: { justifyContent: 'space-between', gap: 12 },
  typeCard: {
    width: '48%',
    backgroundColor: customerColors.card,
    borderRadius: 16,
    padding: customerSpacing.sm,
    borderWidth: 1,
    borderColor: customerColors.border,
    marginBottom: customerSpacing.sm,
  },
  typeImage: { width: '100%', height: 90, borderRadius: 12, backgroundColor: customerColors.surface },
  typeLabel: { color: customerColors.text, fontWeight: '700', marginTop: 8, fontSize: 12 },
  typeMeta: { color: customerColors.muted, marginTop: 4, fontSize: 11 },
  typesGrid: { paddingHorizontal: customerSpacing.lg, paddingBottom: 160, paddingTop: customerSpacing.md },
  footerLoading: { alignItems: 'center', paddingVertical: customerSpacing.md },
  footerText: { color: customerColors.muted, marginTop: 6, fontSize: 12 },
  emptyWrap: { alignItems: 'center', paddingVertical: customerSpacing.xl },
  emptyText: { color: customerColors.text, fontWeight: '700' },
  emptySubtext: { color: customerColors.muted, marginTop: 6, textAlign: 'center' },
});

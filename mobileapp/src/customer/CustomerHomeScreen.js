import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { customerColors, customerSpacing } from './CustomerTheme';
import CustomerHeader from './CustomerHeader';
import CategoryDrawer from './CategoryDrawer';
import ProductCard from './ProductCard';
import { useAsyncList } from '../services/useAsyncList';
import { getStoreProducts } from './storeApi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-expo';

export default function CustomerHomeScreen({ onOpenProduct, onOpenLogin }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { addItem, items: cartItems } = useCart();
  const { isAuthenticated, clearSession } = useAuth();
  const { signOut } = useClerkAuth();

  const fetchProducts = useCallback(async () => {
    const data = await getStoreProducts({ query, category: category === 'All' ? '' : category });
    return data.products;
  }, [query, category]);

  const { items: products, loading } = useAsyncList(fetchProducts, []);

  const handleAdd = (product) => {
    if (!isAuthenticated) {
      onOpenLogin();
      return;
    }
    if (typeof product.quantity === 'number' && product.quantity <= 0) {
      Alert.alert('Out of stock', 'This item is currently unavailable.');
      return;
    }
    const available = typeof product.quantity === 'number' ? product.quantity : null;
    const inCart = productsInCart(product.id, available);
    if (!inCart) {
      Alert.alert(
        'Stock limit reached',
        available ? `Only ${available} left in stock.` : 'You cannot add more than available stock.'
      );
      return;
    }
    const result = addItem(product);
    if (!result.added) {
      const label = result.maxQty ? `Only ${result.maxQty} left in stock.` : 'Stock limit reached.';
      Alert.alert('Stock limit reached', label);
      return;
    }
    Alert.alert('Added to cart', `${product.title || product.name} has been added.`);
  };

  function productsInCart(productId, maxQty) {
    const cartItem = cartItems.find((item) => item.id === productId);
    if (!cartItem) return true;
    if (typeof maxQty !== 'number') return true;
    return cartItem.qty < maxQty;
  }

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
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.grid}
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
                <Text style={styles.sectionTitle}>{category === 'All' ? 'Top Products' : category}</Text>
                <Text style={styles.sectionSubtitle}>{loading ? 'Loading products…' : `${products.length} items`}</Text>
              </View>
              <TouchableOpacity style={styles.filterButton} onPress={() => setDrawerOpen(true)}>
                <Text style={styles.filterText}>Filter</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => onOpenProduct(item)}
            onAdd={() => handleAdd(item)}
          />
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
  grid: { paddingHorizontal: customerSpacing.lg, paddingBottom: 160 },
  gridRow: { justifyContent: 'space-between' },
});

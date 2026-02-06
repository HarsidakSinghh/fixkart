import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import CustomerHomeScreen from './CustomerHomeScreen';
import CustomerOrdersScreen from './CustomerOrdersScreen';
import CartScreen from './CartScreen';
import CustomerProfileScreen from './CustomerProfileScreen';
import ProductDetailScreen from './ProductDetailScreen';
import CustomerCheckoutScreen from './CustomerCheckoutScreen';
import { customerColors, customerSpacing } from './CustomerTheme';

const TABS = [
  { key: 'home', label: 'Home' },
  { key: 'orders', label: 'Orders' },
  { key: 'cart', label: 'Cart' },
  { key: 'profile', label: 'Profile' },
];

export default function CustomerPortal({ onOpenLogin }) {
  const [tab, setTab] = useState('home');
  const [detailProduct, setDetailProduct] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);

  if (detailProduct) {
    return (
      <ProductDetailScreen
        product={detailProduct}
        onBack={() => setDetailProduct(null)}
        onLogin={onOpenLogin}
      />
    );
  }

  if (showCheckout) {
    return (
      <CustomerCheckoutScreen
        onBack={() => setShowCheckout(false)}
        onDone={() => {
          setShowCheckout(false);
          setTab('orders');
        }}
      />
    );
  }

  let content = null;
  if (tab === 'home') {
    content = (
      <CustomerHomeScreen
        onOpenProduct={(product) => setDetailProduct(product)}
        onOpenLogin={onOpenLogin}
      />
    );
  } else if (tab === 'orders') {
    content = <CustomerOrdersScreen />;
  } else if (tab === 'cart') {
    content = <CartScreen onCheckout={() => setShowCheckout(true)} />;
  } else {
    content = <CustomerProfileScreen />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>{content}</View>
      <View style={styles.bottomBar}>
        {TABS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.tabButton, tab === item.key && styles.tabActive]}
            onPress={() => setTab(item.key)}
          >
            <Text style={[styles.tabText, tab === item.key && styles.tabTextActive]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: customerColors.bg },
  content: { flex: 1 },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: customerSpacing.sm,
    paddingBottom: customerSpacing.md,
    borderTopWidth: 1,
    borderTopColor: customerColors.border,
    backgroundColor: customerColors.card,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  tabActive: { backgroundColor: customerColors.primary },
  tabText: { color: customerColors.muted, fontWeight: '700', fontSize: 12 },
  tabTextActive: { color: '#FFFFFF' },
});

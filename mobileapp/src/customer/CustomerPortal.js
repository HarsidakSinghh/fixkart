import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import CustomerHomeScreen from './CustomerHomeScreen';
import CustomerOrdersScreen from './CustomerOrdersScreen';
import CartScreen from './CartScreen';
import CustomerProfileScreen from './CustomerProfileScreen';
import ProductDetailScreen from './ProductDetailScreen';
import CustomerCheckoutScreen from './CustomerCheckoutScreen';
import { customerColors, customerSpacing } from './CustomerTheme';
import { getCustomerOrders } from './customerApi';
import CustomerSupportScreen from './CustomerSupportScreen';
import CustomerSupportHistoryScreen from './CustomerSupportHistoryScreen';
import CustomerNotificationsScreen from './CustomerNotificationsScreen';
import NotificationDebugScreen from '../screens/NotificationDebugScreen';
import CustomerTypeListingsScreen from './CustomerTypeListingsScreen';

const TABS = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'orders', label: 'Orders', icon: 'package' },
  { key: 'cart', label: 'Cart', icon: 'shopping-cart' },
  { key: 'profile', label: 'Profile', icon: 'user' },
];

export default function CustomerPortal({ onOpenLogin }) {
  const [tab, setTab] = useState('home');
  const [detailProduct, setDetailProduct] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderBadge, setOrderBadge] = useState(0);
  const [supportOrder, setSupportOrder] = useState(null);
  const [showSupportHistory, setShowSupportHistory] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPushDebug, setShowPushDebug] = useState(false);

  async function refreshOrderBadge() {
    try {
      const data = await getCustomerOrders();
      const pending = (data.orders || []).filter(
        (o) => !['DELIVERED', 'COMPLETED'].includes(o.status)
      ).length;
      setOrderBadge(pending);
    } catch (_) {
      setOrderBadge(0);
    }
  }

  useEffect(() => {
    refreshOrderBadge();
  }, []);

  if (detailProduct) {
    if (detailProduct?.isType) {
      return (
        <CustomerTypeListingsScreen
          typeLabel={detailProduct.type}
          onBack={() => setDetailProduct(null)}
          onOpenProduct={(product) => setDetailProduct(product)}
          onOpenLogin={onOpenLogin}
        />
      );
    }
    return (
      <ProductDetailScreen
        product={detailProduct}
        onBack={() => setDetailProduct(null)}
        onLogin={onOpenLogin}
      />
    );
  }

  if (supportOrder) {
    return (
      <CustomerSupportScreen
        order={supportOrder}
        onBack={() => setSupportOrder(null)}
      />
    );
  }

  if (showSupportHistory) {
    return <CustomerSupportHistoryScreen onBack={() => setShowSupportHistory(false)} />;
  }

  if (showNotifications) {
    return <CustomerNotificationsScreen onBack={() => setShowNotifications(false)} />;
  }

  if (showPushDebug) {
    return <NotificationDebugScreen onBack={() => setShowPushDebug(false)} />;
  }

  if (showCheckout) {
    return (
      <CustomerCheckoutScreen
        onBack={() => setShowCheckout(false)}
        onDone={() => {
          setShowCheckout(false);
          setTab('orders');
          refreshOrderBadge();
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
    content = <CustomerOrdersScreen onOpenSupport={setSupportOrder} />;
  } else if (tab === 'cart') {
    content = <CartScreen onCheckout={() => setShowCheckout(true)} />;
  } else {
    content = (
      <CustomerProfileScreen
        onOpenSupportHistory={() => setShowSupportHistory(true)}
        onOpenNotifications={() => setShowNotifications(true)}
        onOpenPushDebug={() => setShowPushDebug(true)}
      />
    );
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
            <View style={styles.tabLabel}>
              <Feather
                name={item.icon}
                size={16}
                color={tab === item.key ? '#FFFFFF' : customerColors.muted}
              />
              <Text style={[styles.tabText, tab === item.key && styles.tabTextActive]}>{item.label}</Text>
              {item.key === 'orders' && orderBadge > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{orderBadge}</Text>
                </View>
              ) : null}
            </View>
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
  tabLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: customerColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
});

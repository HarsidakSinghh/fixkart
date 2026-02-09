import React, { useEffect, useState, useCallback } from 'react';
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
import { useAuth } from '../context/AuthContext';
import { getCustomerProfile } from './customerApi';

const TABS = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'orders', label: 'Orders', icon: 'package' },
  { key: 'cart', label: 'Cart', icon: 'shopping-cart' },
  { key: 'profile', label: 'Profile', icon: 'user' },
];

export default function CustomerPortal({ onOpenLogin }) {
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState('home');
  const [detailProduct, setDetailProduct] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderBadge, setOrderBadge] = useState(0);
  const [supportOrder, setSupportOrder] = useState(null);
  const [showSupportHistory, setShowSupportHistory] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPushDebug, setShowPushDebug] = useState(false);
  const [profileGate, setProfileGate] = useState(false);
  const [profileChecking, setProfileChecking] = useState(false);

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

  const checkProfile = useCallback(async () => {
    if (!isAuthenticated) {
      setProfileGate(false);
      return;
    }
    setProfileChecking(true);
    try {
      const data = await getCustomerProfile();
      const profile = data.profile || {};
      const required = ['fullName', 'phone', 'address', 'city', 'state', 'postalCode'];
      const incomplete = required.some((k) => !profile?.[k]);
      if (incomplete) {
        setProfileGate(true);
        setTab('profile');
      } else {
        setProfileGate(false);
      }
    } catch (_) {
      // Keep user in app if profile fetch fails
      setProfileGate(false);
    } finally {
      setProfileChecking(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    checkProfile();
  }, [checkProfile]);

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
        forceComplete={profileGate}
        onCompleted={() => {
          setProfileGate(false);
          setTab('home');
        }}
      />
    );
  }

  if (profileGate) {
    content = (
      <CustomerProfileScreen
        forceComplete
        onCompleted={() => {
          setProfileGate(false);
          setTab('home');
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>{content}</View>
      {profileGate ? null : (
      <View style={styles.bottomBar}>
        {TABS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.tabButton, tab === item.key && styles.tabActive]}
            onPress={() => setTab(item.key)}
          >
            <View style={styles.tabLabel}>
              <View style={styles.iconWrap}>
                <Feather
                  name={item.icon}
                  size={18}
                  color={tab === item.key ? customerColors.primary : customerColors.muted}
                />
                {item.key === 'orders' && orderBadge > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{orderBadge}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.tabText, tab === item.key && styles.tabTextActive]}>{item.label}</Text>
              {tab === item.key ? <View style={styles.activeLine} /> : null}
            </View>
          </TouchableOpacity>
        ))}
      </View>
      )}
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
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: 'transparent' },
  tabText: { color: customerColors.muted, fontWeight: '700', fontSize: 10, marginTop: 4 },
  tabTextActive: { color: customerColors.primary },
  tabLabel: { alignItems: 'center' },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeLine: {
    marginTop: 6,
    width: 18,
    height: 2,
    borderRadius: 2,
    backgroundColor: customerColors.primary,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: customerColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: -6,
    right: -6,
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
});

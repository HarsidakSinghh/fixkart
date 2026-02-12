import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { vendorColors, vendorSpacing } from './VendorTheme';
import UserHeader from '../components/UserHeader';
import VendorHomeScreen from './VendorHomeScreen';
import VendorStatsScreen from './VendorStatsScreen';
import VendorInventoryScreen from './VendorInventoryScreen';
import VendorProfileScreen from './VendorProfileScreen';
import VendorOrdersScreen from './VendorOrdersScreen';
import NotificationDebugScreen from '../screens/NotificationDebugScreen';
import VendorSalesmenScreen from './VendorSalesmenScreen';
import { getVendorProfile, getVendorOrders } from './vendorApi';

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'bar-chart-2' },
  { key: 'listings', label: 'Listings', icon: 'grid' },
  { key: 'inventory', label: 'Inventory', icon: 'box' },
  { key: 'orders', label: 'Orders', icon: 'shopping-bag' },
  { key: 'salesmen', label: 'Salesman', icon: 'users' },
  { key: 'profile', label: 'Profile', icon: 'user' },
];

export default function VendorPortal() {
  const [active, setActive] = useState('dashboard');
  const [status, setStatus] = useState('PENDING');
  const [ordersBadge, setOrdersBadge] = useState(0);
  const [showPushDebug, setShowPushDebug] = useState(false);

  const handleStatus = useCallback((nextStatus) => {
    if (nextStatus) {
      setStatus(nextStatus);
    }
  }, []);

  useEffect(() => {
    async function loadStatus() {
      try {
        const data = await getVendorProfile();
        if (data?.vendor?.status) {
          setStatus(data.vendor.status);
        }
      } catch (error) {
        console.error('Failed to load vendor status', error);
      }
    }

    loadStatus();
  }, []);

  useEffect(() => {
    refreshOrderBadge();
  }, []);

  async function refreshOrderBadge() {
    try {
      const data = await getVendorOrders();
      const pending = (data.orders || []).filter((o) => o.status !== 'READY').length;
      setOrdersBadge(pending);
    } catch (_) {
      setOrdersBadge(0);
    }
  }

  let content = null;
  if (active === 'dashboard') {
    content = <VendorStatsScreen />;
  } else if (active === 'listings') {
    content = <VendorHomeScreen canAdd={status === 'APPROVED'} status={status} />;
  } else if (active === 'inventory') {
    content = <VendorInventoryScreen />;
  } else if (active === 'orders') {
    content = <VendorOrdersScreen />;
  } else if (active === 'salesmen') {
    content = <VendorSalesmenScreen />;
  } else {
    content = (
      <VendorProfileScreen
        onStatusLoaded={handleStatus}
        onOpenPushDebug={() => setShowPushDebug(true)}
      />
    );
  }

  if (showPushDebug) {
    return <NotificationDebugScreen onBack={() => setShowPushDebug(false)} />;
  }

  return (
    <View style={styles.container}>
      <UserHeader showLogout />
      <View style={styles.content}>{content}</View>
      <View style={styles.bottomBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, active === tab.key && styles.tabActive]}
            onPress={() => setActive(tab.key)}
          >
            <View style={styles.tabLabel}>
              <View style={styles.iconWrap}>
                <Feather
                  name={tab.icon}
                  size={18}
                  color={active === tab.key ? '#FFFFFF' : vendorColors.muted}
                />
                {tab.key === 'orders' && ordersBadge > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{ordersBadge}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.tabText, active === tab.key && styles.tabTextActive]}>{tab.label}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: vendorColors.bg },
  content: { flex: 1 },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: vendorSpacing.sm,
    paddingBottom: vendorSpacing.md,
    borderTopWidth: 1,
    borderTopColor: vendorColors.border,
    backgroundColor: vendorColors.card,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: vendorColors.primary },
  tabText: { color: vendorColors.muted, fontWeight: '700', fontSize: 10, marginTop: 4 },
  tabTextActive: { color: '#FFFFFF' },
  tabLabel: { alignItems: 'center', gap: 0 },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: vendorColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: -6,
    top: -6,
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
});

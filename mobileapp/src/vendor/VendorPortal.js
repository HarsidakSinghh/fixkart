import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { vendorColors, vendorSpacing } from './VendorTheme';
import UserHeader from '../components/UserHeader';
import VendorHomeScreen from './VendorHomeScreen';
import VendorInventoryScreen from './VendorInventoryScreen';
import VendorProfileScreen from './VendorProfileScreen';
import VendorOrdersScreen from './VendorOrdersScreen';
import { getVendorProfile } from './vendorApi';

const TABS = [
  { key: 'home', label: 'Home' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'orders', label: 'Orders' },
  { key: 'profile', label: 'Profile' },
];

export default function VendorPortal() {
  const [active, setActive] = useState('home');
  const [status, setStatus] = useState('PENDING');

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

  let content = null;
  if (active === 'home') {
    content = <VendorHomeScreen canAdd={status === 'APPROVED'} status={status} />;
  } else if (active === 'inventory') {
    content = <VendorInventoryScreen />;
  } else if (active === 'orders') {
    content = <VendorOrdersScreen />;
  } else {
    content = <VendorProfileScreen onStatusLoaded={handleStatus} />;
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
            <Text style={[styles.tabText, active === tab.key && styles.tabTextActive]}>{tab.label}</Text>
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
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  tabActive: { backgroundColor: vendorColors.primary },
  tabText: { color: vendorColors.muted, fontWeight: '700', fontSize: 12 },
  tabTextActive: { color: '#FFFFFF' },
});

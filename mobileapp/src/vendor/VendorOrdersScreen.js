import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { vendorColors, vendorSpacing } from './VendorTheme';
import { getVendorOrders, markVendorOrderReady } from './vendorApi';

export default function VendorOrdersScreen({ onSwitchToListings }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeCode, setActiveCode] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getVendorOrders();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Failed to load vendor orders', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleDispatch = async (itemId) => {
    try {
      const res = await markVendorOrderReady(itemId);
      setActiveCode({ id: itemId, code: res.code });
      setOrders((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, status: 'READY', dispatchCode: res.code } : item))
      );
    } catch (error) {
      console.error('Failed to mark dispatch', error);
    }
  };

  const renderOrder = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.productName}</Text>
        <Text style={styles.meta}>Qty: {item.quantity} • Price: ₹{item.price}</Text>
        <Text style={styles.meta}>Order: {item.orderId}</Text>
        <Text style={styles.meta}>Customer: {item.customer?.name || 'Customer'}</Text>
        <Text style={styles.meta}>{item.customer?.phone || ''}</Text>
        <Text style={styles.meta}>{item.customer?.address || ''}</Text>

        {item.dispatchCode ? (
          <View style={styles.codeBadge}>
            <Text style={styles.codeLabel}>Dispatch Code</Text>
            <Text style={styles.codeValue}>{item.dispatchCode}</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.dispatchBtn} onPress={() => handleDispatch(item.id)}>
            <Text style={styles.dispatchText}>Ready to Dispatch</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={renderOrder}
        refreshing={loading}
        onRefresh={loadOrders}
        ListHeaderComponent={
          <View>
            <View style={styles.heroCard}>
              <Text style={styles.heroTitle}>Orders</Text>
              <Text style={styles.heroSubtitle}>Track and dispatch today’s orders</Text>
              {onSwitchToListings ? (
                <TouchableOpacity style={styles.switchBtn} onPress={onSwitchToListings}>
                  <Text style={styles.switchText}>Back to Listings</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        }
      />

      {activeCode ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>Share dispatch code {activeCode.code} with Porter.</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: vendorColors.bg },
  heroCard: {
    marginHorizontal: vendorSpacing.lg,
    marginTop: vendorSpacing.md,
    padding: vendorSpacing.lg,
    borderRadius: 20,
    backgroundColor: vendorColors.card,
    borderWidth: 1,
    borderColor: vendorColors.border,
    shadowColor: vendorColors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  heroTitle: { fontSize: 20, fontWeight: '800', color: vendorColors.text },
  heroSubtitle: { color: vendorColors.muted, marginTop: 6, fontSize: 12 },
  list: { padding: vendorSpacing.lg, paddingBottom: 120 },
  card: {
    backgroundColor: vendorColors.card,
    borderRadius: 16,
    padding: vendorSpacing.md,
    borderWidth: 1,
    borderColor: vendorColors.border,
    marginBottom: vendorSpacing.md,
    flexDirection: 'row',
    gap: vendorSpacing.md,
  },
  image: { width: 70, height: 70, borderRadius: 12, backgroundColor: vendorColors.surface },
  title: { color: vendorColors.text, fontWeight: '700' },
  meta: { color: vendorColors.muted, marginTop: 4, fontSize: 11 },
  dispatchBtn: {
    marginTop: vendorSpacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: vendorColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  dispatchText: { color: '#FFFFFF', fontWeight: '700', fontSize: 11 },
  codeBadge: {
    marginTop: vendorSpacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: vendorColors.surface,
  },
  codeLabel: { color: vendorColors.muted, fontSize: 10, fontWeight: '600' },
  codeValue: { color: vendorColors.text, fontSize: 14, fontWeight: '800', marginTop: 2 },
  toast: {
    position: 'absolute',
    left: vendorSpacing.lg,
    right: vendorSpacing.lg,
    bottom: 90,
    backgroundColor: vendorColors.primaryDark,
    padding: vendorSpacing.md,
    borderRadius: 14,
  },
  toastText: { color: '#FFFFFF', fontWeight: '600', fontSize: 12 },
  switchBtn: {
    marginTop: vendorSpacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: vendorColors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: vendorColors.border,
  },
  switchText: { color: vendorColors.primary, fontWeight: '700', fontSize: 12 },
});

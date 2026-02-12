import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { vendorColors, vendorSpacing } from './VendorTheme';
import {
  getVendorOrders,
  markVendorOrderReady,
  getVendorOrderPO,
  updateVendorOrderStatus,
} from './vendorApi';
import StatusPill from '../components/StatusPill';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import VendorComplaintsScreen from './VendorComplaintsScreen';

export default function VendorOrdersScreen({ onSwitchToListings }) {
  const [orders, setOrders] = useState([]);
  const [activeSection, setActiveSection] = useState('ORDERS');
  const [activeTab, setActiveTab] = useState('PENDING');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCode, setActiveCode] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getVendorOrders();
      setOrders(data.orders || []);
      try {
        const notifications = (data.orders || []).slice(0, 5).map((order) => ({
          id: order.orderId,
          title: `Order ${order.status || 'NEW'}`,
          message: `${order.items?.[0]?.productName || 'Order'} • ${order.totals?.totalQty || 0} items`,
          createdAt: order.createdAt,
        }));
        await SecureStore.setItemAsync('vendor_notifications', JSON.stringify(notifications));
      } catch {
        // ignore
      }
    } catch (error) {
      console.error('Failed to load vendor orders', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleDispatch = async (orderId) => {
    try {
      const res = await markVendorOrderReady(orderId);
      setActiveCode({ id: orderId, code: res.code });
      setOrders((prev) =>
        prev.map((order) => {
          if (order.orderId !== orderId) return order;
          return {
            ...order,
            status: 'SHIPPED',
            items: order.items.map((item) =>
              ['PROCESSING', 'READY', 'SHIPPED'].includes(String(item.status || '').toUpperCase())
                ? { ...item, status: 'SHIPPED', dispatchCode: item.dispatchCode || res.code }
                : item
            ),
          };
        })
      );
    } catch (error) {
      console.error('Failed to mark dispatch', error);
    }
  };

  const handleOrderAction = async (orderId, action) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await updateVendorOrderStatus(orderId, action);
      const nextStatus = res?.status || (action === 'ACCEPT' ? 'PROCESSING' : 'REJECTED');
      setOrders((prev) =>
        prev.map((order) => {
          if (order.orderId !== orderId) return order;
          return {
            ...order,
            status: nextStatus,
            items: order.items.map((item) => ({
              ...item,
              status:
                item.status === 'SHIPPED' || item.status === 'DELIVERED'
                  ? item.status
                  : action === 'ACCEPT'
                  ? 'PROCESSING'
                  : 'REJECTED',
            })),
          };
        })
      );
    } catch (error) {
      console.error(`Failed to ${action.toLowerCase()} order`, error);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleDownloadPO = async (orderId) => {
    setDownloading(orderId);
    try {
      const data = await getVendorOrderPO(orderId);
      if (data?.url) {
        await WebBrowser.openBrowserAsync(data.url);
      }
    } catch (error) {
      console.error('Failed to download PO', error);
    } finally {
      setDownloading(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const status = String(order.status || '').toUpperCase();
    if (activeTab === 'PENDING') return status === 'PENDING';
    if (activeTab === 'PROCESSING') return status === 'PROCESSING' || status === 'APPROVED';
    if (activeTab === 'SHIPPED') return status === 'SHIPPED';
    if (activeTab === 'DELIVERED') return status === 'DELIVERED';
    if (activeTab === 'REJECTED') return status === 'REJECTED' || status === 'CANCELLED';
    return true;
  });

  const tabCounts = {
    PENDING: orders.filter((order) => String(order.status || '').toUpperCase() === 'PENDING').length,
    PROCESSING: orders.filter((order) => {
      const status = String(order.status || '').toUpperCase();
      return status === 'PROCESSING' || status === 'APPROVED';
    }).length,
    SHIPPED: orders.filter((order) => String(order.status || '').toUpperCase() === 'SHIPPED').length,
    DELIVERED: orders.filter((order) => String(order.status || '').toUpperCase() === 'DELIVERED').length,
    REJECTED: orders.filter((order) => {
      const status = String(order.status || '').toUpperCase();
      return status === 'REJECTED' || status === 'CANCELLED';
    }).length,
  };

  const renderOrder = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>Order #{item.orderId.slice(-6).toUpperCase()}</Text>
          <Text style={styles.meta}>Items: {item.totals?.totalQty || 0}</Text>
          <Text style={styles.meta}>Customer: {item.customer?.name || 'Customer'}</Text>
        </View>
        <View style={styles.orderMetaRight}>
          <StatusPill label={item.status || 'NEW'} tone={statusTone(item.status)} />
          <Text style={styles.meta}>Total: ₹{Math.round(item.totals?.vendorTotal || 0)}</Text>
        </View>
      </View>

      {String(item.status || '').toUpperCase() === 'PENDING' ? (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.acceptBtn]}
            disabled={updatingOrderId === item.orderId}
            onPress={() => handleOrderAction(item.orderId, 'ACCEPT')}
          >
            <Text style={styles.actionText}>{updatingOrderId === item.orderId ? 'Please wait…' : 'Accept'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn]}
            disabled={updatingOrderId === item.orderId}
            onPress={() => handleOrderAction(item.orderId, 'REJECT')}
          >
            <Text style={styles.actionText}>Reject</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {String(item.status || '').toUpperCase() === 'PROCESSING' ? (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.dispatchBtn} onPress={() => handleDispatch(item.orderId)}>
            <Text style={styles.dispatchText}>Ready (Generate OTP)</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {(item.items || []).map((orderItem) => (
        <View key={orderItem.id} style={styles.itemRow}>
          <Image source={{ uri: orderItem.image }} style={styles.image} />
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{orderItem.productName}</Text>
            <Text style={styles.meta}>Qty: {orderItem.quantity} • Price: ₹{orderItem.vendorPrice}</Text>
            <View style={{ marginTop: vendorSpacing.xs }}>
              <StatusPill label={orderItem.status || 'NEW'} tone={statusTone(orderItem.status)} />
            </View>
          </View>
          {orderItem.dispatchCode ? (
            <View style={styles.codeBadge}>
              <Text style={styles.codeLabel}>Rider OTP</Text>
              <Text style={styles.codeValue}>{orderItem.dispatchCode}</Text>
            </View>
          ) : null}
        </View>
      ))}

      <TouchableOpacity
        style={styles.poBtn}
        onPress={() => handleDownloadPO(item.orderId)}
        disabled={downloading === item.orderId}
      >
        <Text style={styles.poText}>{downloading === item.orderId ? 'Preparing PO…' : 'Download PO'}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.sectionSwitchWrap}>
        {['ORDERS', 'SUPPORT'].map((section) => (
          <TouchableOpacity
            key={section}
            style={[styles.sectionPill, activeSection === section && styles.sectionPillActive]}
            onPress={() => setActiveSection(section)}
          >
            <Text style={[styles.sectionText, activeSection === section && styles.sectionTextActive]}>
              {section}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeSection === 'SUPPORT' ? (
        <VendorComplaintsScreen embedded hideHero />
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.orderId}
          contentContainerStyle={styles.list}
          renderItem={renderOrder}
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            try {
              await loadOrders();
            } finally {
              setRefreshing(false);
            }
          }}
          ListFooterComponent={
            loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={vendorColors.primary} />
                <Text style={styles.loadingText}>Loading orders…</Text>
              </View>
            ) : null
          }
          ListHeaderComponent={
            <View>
              <View style={styles.heroCard}>
                <Text style={styles.heroTitle}>Orders</Text>
                <Text style={styles.heroSubtitle}>Accept, ship with OTP, then wait for delivery closure</Text>
                {onSwitchToListings ? (
                  <TouchableOpacity style={styles.switchBtn} onPress={onSwitchToListings}>
                    <Text style={styles.switchText}>Back to Listings</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <View style={styles.tabsRow}>
                {['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'REJECTED'].map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.tabPill, activeTab === tab && styles.tabPillActive]}
                    onPress={() => setActiveTab(tab)}
                  >
                    <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                      {tab} ({tabCounts[tab] || 0})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          }
        />
      )}

      {activeCode ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>Share dispatch code {activeCode.code} with Porter.</Text>
        </View>
      ) : null}
    </View>
  );
}

function statusTone(status) {
  if (status === 'DELIVERED' || status === 'COMPLETED') return 'success';
  if (status === 'SHIPPED') return 'info';
  if (status === 'PROCESSING' || status === 'APPROVED') return 'warning';
  if (status === 'CANCELLED' || status === 'REJECTED') return 'danger';
  return 'warning';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: vendorColors.bg },
  sectionSwitchWrap: {
    marginTop: vendorSpacing.md,
    marginHorizontal: vendorSpacing.lg,
    marginBottom: vendorSpacing.sm,
    backgroundColor: vendorColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: vendorColors.border,
    padding: 4,
    flexDirection: 'row',
    gap: 6,
  },
  sectionPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
  },
  sectionPillActive: { backgroundColor: vendorColors.primary },
  sectionText: { color: vendorColors.muted, fontWeight: '800', fontSize: 12, letterSpacing: 0.2 },
  sectionTextActive: { color: '#FFFFFF' },
  heroCard: {
    marginHorizontal: vendorSpacing.lg,
    marginTop: vendorSpacing.sm,
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
  tabsRow: {
    marginTop: vendorSpacing.md,
    marginHorizontal: vendorSpacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tabPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: vendorColors.surface,
    borderWidth: 1,
    borderColor: vendorColors.border,
  },
  tabPillActive: {
    backgroundColor: vendorColors.primary,
    borderColor: vendorColors.primary,
  },
  tabText: { color: vendorColors.muted, fontSize: 11, fontWeight: '700' },
  tabTextActive: { color: '#FFFFFF' },
  loadingWrap: { alignItems: 'center', paddingVertical: vendorSpacing.md },
  loadingText: { marginTop: 8, color: vendorColors.muted, fontSize: 12 },
  card: {
    backgroundColor: vendorColors.card,
    borderRadius: 16,
    padding: vendorSpacing.md,
    borderWidth: 1,
    borderColor: vendorColors.border,
    marginBottom: vendorSpacing.md,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: vendorSpacing.sm,
  },
  orderId: { color: vendorColors.text, fontWeight: '800' },
  meta: { color: vendorColors.muted, marginTop: 4, fontSize: 11 },
  orderMetaRight: { alignItems: 'flex-end', gap: 6 },
  itemRow: {
    flexDirection: 'row',
    gap: vendorSpacing.md,
    paddingVertical: vendorSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: vendorColors.border,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: vendorSpacing.sm,
  },
  actionBtn: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  acceptBtn: {
    backgroundColor: vendorColors.primary,
  },
  rejectBtn: {
    backgroundColor: '#D9534F',
  },
  actionText: { color: '#FFFFFF', fontWeight: '700', fontSize: 11 },
  image: { width: 54, height: 54, borderRadius: 10, backgroundColor: vendorColors.surface },
  title: { color: vendorColors.text, fontWeight: '700' },
  dispatchBtn: {
    alignSelf: 'flex-start',
    backgroundColor: vendorColors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dispatchText: { color: '#FFFFFF', fontWeight: '700', fontSize: 11 },
  codeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: vendorColors.surface,
  },
  codeLabel: { color: vendorColors.muted, fontSize: 10, fontWeight: '600' },
  codeValue: { color: vendorColors.text, fontSize: 12, fontWeight: '800', marginTop: 2 },
  poBtn: {
    marginTop: vendorSpacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: vendorColors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: vendorColors.border,
  },
  poText: { color: vendorColors.primary, fontWeight: '700', fontSize: 11 },
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

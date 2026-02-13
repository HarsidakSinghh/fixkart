import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, Image, ScrollView } from 'react-native';
import { customerColors, customerSpacing } from './CustomerTheme';
import { getCustomerOrders, seedCustomerOrders, getCustomerInvoice } from './customerApi';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../context/AuthContext';
import { ErrorState } from '../components/StateViews';
import StatusPill from '../components/StatusPill';
import * as WebBrowser from 'expo-web-browser';

const STATUS_STEPS = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
const STATUS_ALIAS = {
  APPROVED: 'PROCESSING',
  READY: 'SHIPPED',
  COMPLETED: 'DELIVERED',
  CANCELLED: 'REJECTED',
};

function getStepIndex(status) {
  const normalized = STATUS_ALIAS[status] || status;
  const idx = STATUS_STEPS.indexOf(normalized);
  return idx >= 0 ? idx : 0;
}

function itemStatusLabel(status) {
  if (!status) return null;
  if (status === 'COMPLAINT') return 'Complaint registered';
  if (status === 'COMPLAINT_REVIEW') return 'Complaint in review';
  if (status === 'COMPLAINT_RESOLVED') return 'Complaint resolved';
  if (status === 'REFUND_REQUESTED') return 'Refund requested';
  if (status === 'REFUNDED') return 'Refund approved';
  if (status === 'REFUND_REJECTED') return 'Refund rejected';
  return null;
}

export default function CustomerOrdersScreen({ onOpenSupport }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getCustomerOrders();
      setOrders(data.orders || []);
      try {
        const notifications = (data.orders || []).slice(0, 5).map((order) => ({
          id: order.id,
          title: `Order ${order.status}`,
          message: `Order #${order.id.slice(-6).toUpperCase()} • ₹${Math.round(order.totalAmount || 0)}`,
          createdAt: order.createdAt,
        }));
        await SecureStore.setItemAsync('customer_notifications', JSON.stringify(notifications));
      } catch {
        // ignore
      }
    } catch {
      setError('Unable to load orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedCustomerOrders();
      await loadOrders();
    } catch {
      setError('Unable to create sample orders.');
    } finally {
      setSeeding(false);
    }
  };

  const handleDownloadInvoice = async (orderId) => {
    setDownloading(orderId);
    try {
      const data = await getCustomerInvoice(orderId);
      if (data?.url) {
        await WebBrowser.openBrowserAsync(data.url);
      }
    } catch {
      setError('Unable to download invoice.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.title}>My Orders</Text>
        <Text style={styles.subtitle}>Track delivery status and history</Text>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={customerColors.primary} />
          <Text style={styles.loadingText}>Fetching your orders…</Text>
        </View>
      ) : (
        <FlatList
          data={orders.filter((item) => {
            const normalized = STATUS_ALIAS[item.status] || item.status;
            if (activeTab === 'ALL') return true;
            if (activeTab === 'PENDING') return normalized === 'PENDING';
            if (activeTab === 'PROCESSING') return normalized === 'PROCESSING';
            if (activeTab === 'SHIPPED') return normalized === 'SHIPPED' || normalized === 'READY';
            if (activeTab === 'DELIVERED') return normalized === 'DELIVERED';
            if (activeTab === 'REJECTED') return normalized === 'REJECTED' || normalized === 'CANCELLED';
            return true;
          })}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                try {
                  await loadOrders();
                } finally {
                  setRefreshing(false);
                }
              }}
            />
          }
          ListEmptyComponent={
            error ? (
              <ErrorState message={error} onRetry={loadOrders} />
            ) : (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>No orders yet.</Text>
                <Text style={styles.emptySubtext}>Once you place an order, it will appear here.</Text>
                {user?.email === 'sidak798@gmail.com' && (
                  <TouchableOpacity style={styles.seedButton} onPress={handleSeed} disabled={seeding}>
                    <Text style={styles.seedText}>{seeding ? 'Creating…' : 'Create sample orders'}</Text>
                  </TouchableOpacity>
                )}
                {!!error && <Text style={styles.errorText}>{error}</Text>}
              </View>
            )
          }
          ListHeaderComponent={
            <View style={styles.tabsRow}>
              {['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'REJECTED'].map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabPill, activeTab === tab && styles.tabPillActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                </TouchableOpacity>
              ))}
            </View>
          }
          renderItem={({ item }) => {
            const stepIndex = getStepIndex(item.status);
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View>
                    <Text style={styles.orderId}>Order #{item.id.slice(-6).toUpperCase()}</Text>
                    <Text style={styles.orderDate}>{new Date(item.createdAt).toDateString()}</Text>
                  </View>
                <View style={styles.statusWrap}>
                  <StatusPill label={item.status} tone={statusTone(item.status)} />
                </View>
                </View>

                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>Total</Text>
                  <Text style={styles.amountValue}>₹{Math.round(item.totalAmount || 0)}</Text>
                </View>

                <Text style={styles.sectionTitle}>Tracking</Text>
                <View style={styles.trackingRow}>
                  {STATUS_STEPS.map((step, index) => (
                    <View key={step} style={styles.stepWrap}>
                      <View
                        style={[
                          styles.stepDot,
                          index <= stepIndex && styles.stepDotActive,
                        ]}
                      />
                      <Text style={[styles.stepLabel, index <= stepIndex && styles.stepLabelActive]}>
                        {step}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.itemsWrap}>
                  {(item.items || []).slice(0, 2).map((product) => (
                    <View key={product.id} style={styles.itemRow}>
                      <Text style={styles.itemText}>
                        • {product.productName} × {product.quantity}
                      </Text>
                      {itemStatusLabel(product.status) ? (
                        <Text style={styles.itemStatus}>{itemStatusLabel(product.status)}</Text>
                      ) : null}
                    </View>
                  ))}
                  {(item.items || []).length > 2 && (
                    <Text style={styles.moreText}>+{(item.items || []).length - 2} more items</Text>
                  )}
                </View>

                {onOpenSupport ? (
                  <TouchableOpacity style={styles.helpBtn} onPress={() => onOpenSupport(item)}>
                    <Text style={styles.helpText}>Help / Complaint / Refund</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity style={styles.summaryBtn} onPress={() => setSelectedOrder(item)}>
                  <Text style={styles.summaryText}>View Order Summary</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.invoiceBtn}
                  onPress={() => handleDownloadInvoice(item.id)}
                  disabled={downloading === item.id}
                >
                  <Text style={styles.invoiceText}>
                    {downloading === item.id ? 'Preparing Invoice…' : 'Download Invoice'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      <Modal visible={!!selectedOrder} transparent animationType="slide" onRequestClose={() => setSelectedOrder(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Summary</Text>
              <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                <Text style={styles.modalClose}>Close</Text>
              </TouchableOpacity>
            </View>
            {selectedOrder ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalMeta}>Order #{selectedOrder.id.slice(-6).toUpperCase()}</Text>
                <Text style={styles.modalMeta}>Status: {selectedOrder.status}</Text>
                <Text style={styles.modalMeta}>Placed: {new Date(selectedOrder.createdAt).toLocaleString()}</Text>

                <View style={styles.modalItemsWrap}>
                  {(selectedOrder.items || []).map((item) => {
                    const qty = Number(item.quantity || 0);
                    const price = Number(item.price || 0);
                    const lineTotal = qty * price;
                    return (
                      <View key={item.id} style={styles.modalItemCard}>
                        {item.image ? (
                          <Image source={{ uri: item.image }} style={styles.modalItemImage} />
                        ) : (
                          <View style={[styles.modalItemImage, styles.modalItemImagePlaceholder]}>
                            <Text style={styles.modalItemImagePlaceholderText}>No image</Text>
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={styles.modalItemName} numberOfLines={2}>{item.productName}</Text>
                          <Text style={styles.modalItemMeta}>Vendor: {item.vendorName || 'Vendor'}</Text>
                          <Text style={styles.modalItemMeta}>Qty: {qty}</Text>
                          <Text style={styles.modalItemMeta}>Price: ₹{Math.round(price)}</Text>
                        </View>
                        <Text style={styles.modalItemTotal}>₹{Math.round(lineTotal)}</Text>
                      </View>
                    );
                  })}
                </View>

                <View style={styles.modalTotalCard}>
                  <Text style={styles.modalTotalLabel}>Order Total</Text>
                  <Text style={styles.modalTotalValue}>₹{Math.round(selectedOrder.totalAmount || 0)}</Text>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: customerColors.bg },
  heroCard: {
    marginHorizontal: customerSpacing.lg,
    marginTop: customerSpacing.md,
    padding: customerSpacing.lg,
    borderRadius: 20,
    backgroundColor: customerColors.card,
    borderWidth: 1,
    borderColor: customerColors.border,
    shadowColor: customerColors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  title: { fontSize: 20, fontWeight: '800', color: customerColors.text },
  subtitle: { color: customerColors.muted, marginTop: 6, fontSize: 12 },
  list: { paddingHorizontal: customerSpacing.lg, paddingBottom: customerSpacing.lg },
  tabsRow: {
    marginTop: customerSpacing.md,
    marginBottom: customerSpacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tabPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: customerColors.surface,
    borderWidth: 1,
    borderColor: customerColors.border,
  },
  tabPillActive: {
    backgroundColor: customerColors.primary,
    borderColor: customerColors.primary,
  },
  tabText: { color: customerColors.muted, fontSize: 11, fontWeight: '700' },
  tabTextActive: { color: '#FFFFFF' },
  statusWrap: { alignSelf: 'flex-start', marginTop: 2 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 8, color: customerColors.muted },
  emptyWrap: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: customerColors.text, fontWeight: '700' },
  emptySubtext: { color: customerColors.muted, marginTop: 6, textAlign: 'center' },
  seedButton: {
    marginTop: customerSpacing.md,
    backgroundColor: customerColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  seedText: { color: '#FFFFFF', fontWeight: '700' },
  errorText: { color: customerColors.danger, marginTop: 8 },
  card: {
    backgroundColor: customerColors.card,
    borderRadius: 18,
    padding: customerSpacing.md,
    borderWidth: 1,
    borderColor: customerColors.border,
    marginBottom: customerSpacing.md,
    shadowColor: customerColors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: { fontWeight: '800', color: customerColors.text },
  orderDate: { color: customerColors.muted, fontSize: 12, marginTop: 4 },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: customerSpacing.sm,
  },
  amountLabel: { color: customerColors.muted },
  amountValue: { color: customerColors.text, fontWeight: '800' },
  sectionTitle: { marginTop: customerSpacing.md, fontWeight: '700', color: customerColors.text },
  trackingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  stepWrap: { alignItems: 'center', marginRight: 10 },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: customerColors.border,
    marginBottom: 4,
  },
  stepDotActive: { backgroundColor: customerColors.success },
  stepLabel: { fontSize: 10, color: customerColors.muted },
  stepLabelActive: { color: customerColors.success, fontWeight: '700' },
  itemsWrap: { marginTop: customerSpacing.md },
  itemRow: { marginTop: 4 },
  itemText: { color: customerColors.muted, fontSize: 12, marginTop: 4 },
  itemStatus: { color: customerColors.primary, fontSize: 11, marginTop: 2, fontWeight: '600' },
  moreText: { color: customerColors.primary, fontSize: 12, marginTop: 4 },
  helpBtn: {
    marginTop: customerSpacing.md,
    alignSelf: 'flex-start',
    backgroundColor: customerColors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: customerColors.border,
  },
  helpText: { color: customerColors.primary, fontSize: 12, fontWeight: '700' },
  summaryBtn: {
    marginTop: customerSpacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: customerColors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: customerColors.border,
  },
  summaryText: { color: customerColors.text, fontSize: 12, fontWeight: '700' },
  invoiceBtn: {
    marginTop: customerSpacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: customerColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  invoiceText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: customerColors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: customerColors.border,
    maxHeight: '88%',
    padding: customerSpacing.lg,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { color: customerColors.text, fontSize: 18, fontWeight: '800' },
  modalClose: { color: customerColors.primary, fontWeight: '700' },
  modalMeta: { color: customerColors.muted, fontSize: 12, marginTop: 6 },
  modalItemsWrap: { marginTop: customerSpacing.md, gap: 10 },
  modalItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: customerColors.border,
    backgroundColor: customerColors.card,
    borderRadius: 12,
    padding: 10,
  },
  modalItemImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: customerColors.surface,
  },
  modalItemImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: customerColors.border,
  },
  modalItemImagePlaceholderText: { color: customerColors.muted, fontSize: 9, fontWeight: '700' },
  modalItemName: { color: customerColors.text, fontWeight: '700', fontSize: 12 },
  modalItemMeta: { color: customerColors.muted, fontSize: 11, marginTop: 2 },
  modalItemTotal: { color: customerColors.primary, fontWeight: '800', fontSize: 13 },
  modalTotalCard: {
    marginTop: customerSpacing.md,
    borderWidth: 1,
    borderColor: customerColors.border,
    backgroundColor: customerColors.card,
    borderRadius: 12,
    padding: customerSpacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTotalLabel: { color: customerColors.muted, fontWeight: '700' },
  modalTotalValue: { color: customerColors.text, fontWeight: '800', fontSize: 18 },
});

function statusTone(status) {
  if (status === 'DELIVERED' || status === 'COMPLETED') return 'success';
  if (status === 'SHIPPED' || status === 'PROCESSING' || status === 'APPROVED') return 'info';
  if (status === 'CANCELLED' || status === 'REJECTED') return 'danger';
  return 'warning';
}

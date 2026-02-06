import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { customerColors, customerSpacing } from './CustomerTheme';
import { getCustomerOrders, seedCustomerOrders } from './customerApi';
import { useAuth } from '../context/AuthContext';

const STATUS_STEPS = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
const STATUS_ALIAS = {
  APPROVED: 'PROCESSING',
  COMPLETED: 'DELIVERED',
  CANCELLED: 'PENDING',
};

function getStepIndex(status) {
  const normalized = STATUS_ALIAS[status] || status;
  const idx = STATUS_STEPS.indexOf(normalized);
  return idx >= 0 ? idx : 0;
}

export default function CustomerOrdersScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState('');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getCustomerOrders();
      setOrders(data.orders || []);
    } catch (err) {
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
    } catch (err) {
      setError('Unable to create sample orders.');
    } finally {
      setSeeding(false);
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
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
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
                  <View style={styles.statusPill}>
                    <Text style={styles.statusText}>{item.status}</Text>
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
                    <Text key={product.id} style={styles.itemText}>
                      • {product.productName} × {product.quantity}
                    </Text>
                  ))}
                  {(item.items || []).length > 2 && (
                    <Text style={styles.moreText}>+{(item.items || []).length - 2} more items</Text>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
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
  statusPill: {
    backgroundColor: customerColors.surface,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: { color: customerColors.primary, fontWeight: '700', fontSize: 11 },
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
  itemText: { color: customerColors.muted, fontSize: 12, marginTop: 4 },
  moreText: { color: customerColors.primary, fontSize: 12, marginTop: 4 },
});

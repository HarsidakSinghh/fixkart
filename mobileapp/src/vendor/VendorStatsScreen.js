import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { vendorColors, vendorSpacing } from './VendorTheme';
import { getVendorOrders } from './vendorApi';

function formatMoney(value) {
  if (!Number.isFinite(value)) return '₹0';
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

export default function VendorStatsScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getVendorOrders();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Failed to load stats', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalEarnings = 0;
    let todayEarnings = 0;
    const orderIds = new Set();
    let pending = 0;
    let fulfilled = 0;
    let inTransit = 0;

    orders.forEach((order) => {
      const created = new Date(order.createdAt);

      (order.items || []).forEach((item) => {
        const status = String(item.status || order.status || '').toUpperCase();
        // Do not reflect fresh placed orders until vendor accepts.
        // Rejected/cancelled should never affect business stats.
        if (status === 'PENDING' || status === 'REJECTED' || status === 'CANCELLED') {
          return;
        }

        if (order.orderId) orderIds.add(order.orderId);

        const vendorPrice = Number(item.vendorPrice || item.price || 0);
        const amount = vendorPrice * Number(item.quantity || 0);
        totalEarnings += amount;
        if (created >= today) todayEarnings += amount;

        if (status === 'DELIVERED' || status === 'COMPLETED') {
          fulfilled += 1;
        } else if (status === 'SHIPPED') {
          inTransit += 1;
        } else if (status === 'PROCESSING' || status === 'APPROVED' || status === 'READY') {
          pending += 1;
        }
      });
    });

    const avgOrderValue = orderIds.size ? totalEarnings / orderIds.size : 0;

    return {
      totalEarnings,
      todayEarnings,
      totalOrders: orderIds.size,
      pending,
      fulfilled,
      inTransit,
      avgOrderValue,
    };
  }, [orders]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            try {
              await loadStats();
            } finally {
              setRefreshing(false);
            }
          }}
        />
      }
    >
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Vendor Dashboard</Text>
        <Text style={styles.heroTitle}>Your business at a glance</Text>
        <Text style={styles.heroSubtitle}>Track earnings, order flow, and fulfillment health.</Text>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={vendorColors.primary} />
          <Text style={styles.loadingText}>Loading stats…</Text>
        </View>
      ) : null}

      <View style={styles.cardGrid}>
        <View style={styles.statCardPrimary}>
          <Text style={styles.cardLabelPrimary}>Total Earnings</Text>
          <Text style={styles.cardValuePrimary}>{formatMoney(stats.totalEarnings)}</Text>
          <View style={styles.miniChartRow}>
            {[40, 55, 30, 70, 55, 80, 60].map((h, idx) => (
              <View key={`earn-${idx}`} style={[styles.miniBar, { height: h }]} />
            ))}
          </View>
          <Text style={styles.cardHintPrimary}>Lifetime vendor revenue</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.cardLabel}>Today</Text>
          <Text style={styles.cardValue}>{formatMoney(stats.todayEarnings)}</Text>
          <View style={styles.miniChartRowMuted}>
            {[20, 35, 24, 40, 30, 45, 28].map((h, idx) => (
              <View key={`today-${idx}`} style={[styles.miniBarMuted, { height: h }]} />
            ))}
          </View>
          <Text style={styles.cardHint}>Sales since midnight</Text>
        </View>
      </View>

      <View style={styles.cardGrid}>
        <View style={styles.statCard}>
          <Text style={styles.cardLabel}>Total Orders</Text>
          <Text style={styles.cardValue}>{stats.totalOrders}</Text>
          <View style={styles.miniChartRowMuted}>
            {[15, 18, 24, 20, 28, 22, 26].map((h, idx) => (
              <View key={`orders-${idx}`} style={[styles.miniBarMuted, { height: h }]} />
            ))}
          </View>
          <Text style={styles.cardHint}>Unique orders</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.cardLabel}>Avg Order</Text>
          <Text style={styles.cardValue}>{formatMoney(stats.avgOrderValue)}</Text>
          <View style={styles.miniChartRowMuted}>
            {[22, 30, 26, 34, 28, 36, 32].map((h, idx) => (
              <View key={`avg-${idx}`} style={[styles.miniBarMuted, { height: h }]} />
            ))}
          </View>
          <Text style={styles.cardHint}>Per order</Text>
        </View>
      </View>

      <View style={styles.statusRow}>
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Pending</Text>
          <Text style={styles.statusValue}>{stats.pending}</Text>
        </View>
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>In Transit</Text>
          <Text style={styles.statusValue}>{stats.inTransit}</Text>
        </View>
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Fulfilled</Text>
          <Text style={styles.statusValue}>{stats.fulfilled}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: vendorColors.bg },
  scroll: { padding: vendorSpacing.lg, paddingBottom: 120 },
  hero: {
    backgroundColor: vendorColors.card,
    borderRadius: 22,
    padding: vendorSpacing.lg,
    borderWidth: 1,
    borderColor: vendorColors.border,
    shadowColor: vendorColors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  heroLabel: {
    color: vendorColors.primary,
    fontWeight: '800',
    letterSpacing: 1,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  heroTitle: { color: vendorColors.text, fontSize: 22, fontWeight: '800', marginTop: 8 },
  heroSubtitle: { color: vendorColors.muted, fontSize: 12, marginTop: 6 },
  loadingWrap: { marginTop: vendorSpacing.lg, alignItems: 'center' },
  loadingText: { marginTop: 8, color: vendorColors.muted },
  cardGrid: { flexDirection: 'row', gap: 12, marginTop: vendorSpacing.lg },
  statCardPrimary: {
    flex: 1,
    backgroundColor: vendorColors.primary,
    borderRadius: 18,
    padding: vendorSpacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: vendorColors.card,
    borderRadius: 18,
    padding: vendorSpacing.lg,
    borderWidth: 1,
    borderColor: vendorColors.border,
  },
  cardLabelPrimary: { color: '#FFFFFFAA', fontSize: 11, fontWeight: '700' },
  cardValuePrimary: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginTop: 6 },
  cardHintPrimary: { color: '#FFFFFFCC', fontSize: 11, marginTop: 4 },
  cardLabel: { color: vendorColors.muted, fontSize: 11, fontWeight: '700' },
  cardValue: { color: vendorColors.text, fontSize: 20, fontWeight: '800', marginTop: 6 },
  cardHint: { color: vendorColors.muted, fontSize: 11, marginTop: 4 },
  miniChartRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'flex-end',
    marginTop: 8,
    minHeight: 40,
  },
  miniBar: {
    width: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  miniChartRowMuted: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'flex-end',
    marginTop: 8,
    minHeight: 40,
  },
  miniBarMuted: {
    width: 6,
    borderRadius: 4,
    backgroundColor: vendorColors.border,
  },
  statusRow: {
    marginTop: vendorSpacing.lg,
    flexDirection: 'row',
    gap: 12,
  },
  statusCard: {
    flex: 1,
    backgroundColor: vendorColors.card,
    borderRadius: 16,
    padding: vendorSpacing.md,
    borderWidth: 1,
    borderColor: vendorColors.border,
    alignItems: 'center',
  },
  statusLabel: { color: vendorColors.muted, fontSize: 11, fontWeight: '700' },
  statusValue: { color: vendorColors.text, fontSize: 18, fontWeight: '800', marginTop: 6 },
});

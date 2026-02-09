import React, { useCallback, useState, useEffect } from "react";
import { View, StyleSheet, Text, RefreshControl, Pressable } from "react-native";
import AdminScreenLayout from "../components/AdminScreenLayout";
import { ScreenTitle, SectionHeader, StatCard, RowCard, Badge } from "../components/Ui";
import { colors, spacing } from "../theme";
import { useAsyncList } from "../services/useAsyncList";
import { getDashboard, getInventoryApprovals, getRefunds, getComplaints } from "../services/api";
import { ErrorState } from "../components/StateViews";

export default function DashboardScreen({ onNavigate }) {
  const [dashboard, setDashboard] = useState({
    kpis: null,
    revenueByDay: [],
    recentVendors: [],
    alerts: [],
  });
  const [queue, setQueue] = useState({
    inventory: 0,
    refunds: 0,
    complaints: 0,
  });

  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    const data = await getDashboard();
    setDashboard(data);
    return data;
  }, []);

  const { loading, error } = useAsyncList(fetchDashboard, []);

  const loadQueue = useCallback(async () => {
    try {
      const [inventory, refunds, complaints] = await Promise.all([
        getInventoryApprovals(),
        getRefunds(),
        getComplaints(),
      ]);
      setQueue({
        inventory: inventory.products?.length || 0,
        refunds: refunds.refunds?.length || 0,
        complaints: complaints.complaints?.length || 0,
      });
    } catch (_) {
      setQueue({ inventory: 0, refunds: 0, complaints: 0 });
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchDashboard();
      await loadQueue();
    } finally {
      setRefreshing(false);
    }
  }, [fetchDashboard, loadQueue]);

  const kpis = dashboard.kpis || {};

  if (error) {
    return (
      <AdminScreenLayout>
        <ErrorState title="Failed to load dashboard" message={error} onRetry={fetchDashboard} />
      </AdminScreenLayout>
    );
  }

  return (
    <AdminScreenLayout>
      <ScreenTitle title="Dashboard Overview" subtitle="Live admin snapshot" />

      <View
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <SectionHeader title="Action Queue" />
        <View style={styles.queueGrid}>
          <QueueCard
            label="Pending Vendors"
            value={kpis.vendorPending || 0}
            tone="warning"
            onPress={() => onNavigate && onNavigate("vendors")}
          />
          <QueueCard
            label="Inventory Approvals"
            value={queue.inventory}
            tone="warning"
            onPress={() => onNavigate && onNavigate("inventoryApprovals")}
          />
          <QueueCard
            label="Refund Requests"
            value={queue.refunds}
            tone="danger"
            onPress={() => onNavigate && onNavigate("refunds")}
          />
          <QueueCard
            label="Open Complaints"
            value={queue.complaints}
            tone="danger"
            onPress={() => onNavigate && onNavigate("complaints")}
          />
        </View>

        <SectionHeader title="Order Performance" />
        <View style={styles.grid}>
          <StatCard label="Total Revenue" value={`₹${kpis.totalRevenue || 0}`} color={colors.accent} />
          <StatCard label="Commission Earned" value={`₹${kpis.totalCommission || 0}`} color={colors.info} />
          <StatCard label="Pending Orders" value={kpis.orderPending || 0} color={colors.warning} />
          <StatCard label="Processing" value={kpis.orderApproved || 0} color={colors.info} />
          <StatCard label="Completed" value={kpis.orderCompleted || 0} color={colors.accent} />
        </View>

        <SectionHeader title="Revenue Pulse" />
        <View style={styles.panel}>
          <Text style={styles.chartPlaceholder}>📊 Revenue Chart (7 Days)</Text>
          {dashboard.revenueByDay && dashboard.revenueByDay.length > 0 ? (
            <Text style={styles.chartSubtext}>
              {dashboard.revenueByDay.map(d => `${d.name}: ₹${d.total}`).join(' | ')}
            </Text>
          ) : (
            <Text style={styles.chartEmpty}>No revenue data yet</Text>
          )}
        </View>

        <SectionHeader title="Vendor Overview" />
        <View style={styles.grid}>
          <StatCard label="Total Vendors" value={kpis.vendorTotal || 0} />
          <StatCard label="Approved" value={kpis.vendorApproved || 0} color={colors.accent} />
          <StatCard label="Pending" value={kpis.vendorPending || 0} color={colors.warning} />
          <StatCard label="Suspended" value={kpis.vendorSuspended || 0} color={colors.danger} />
        </View>

        <SectionHeader title="Recent Vendors" />
        {loading && !refreshing ? (
          <Text style={styles.loading}>Loading dashboard...</Text>
        ) : (
          dashboard.recentVendors && dashboard.recentVendors.length > 0 ? (
            dashboard.recentVendors.map((vendor) => (
              <RowCard
                key={vendor.id}
                title={vendor.companyName || vendor.fullName || vendor.name}
                subtitle={`${vendor.city || "-"}  •  ${vendor.id}`}
                right={<Badge text={vendor.status} tone={statusTone(vendor.status)} />}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>No vendors found yet</Text>
          )
        )}
      </View>
    </AdminScreenLayout>
  );
}

function QueueCard({ label, value, tone, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.queueCard, pressed && { opacity: 0.8 }]}>
      <Text style={styles.queueLabel}>{label}</Text>
      <Text style={[styles.queueValue, { color: toneColor(tone) }]}>{value}</Text>
      <Text style={styles.queueHint}>Tap to open</Text>
    </Pressable>
  );
}

function toneColor(tone) {
  if (tone === "danger") return colors.danger;
  if (tone === "warning") return colors.warning;
  if (tone === "success") return colors.success;
  return colors.info;
}

function statusTone(status) {
  if (status === "APPROVED") return "success";
  if (status === "PENDING") return "warning";
  if (status === "SUSPENDED" || status === "REJECTED") return "danger";
  return "info";
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  queueGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  queueCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    minWidth: 160,
    flex: 1,
  },
  queueLabel: { color: colors.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6 },
  queueValue: { fontSize: 22, fontWeight: "700", marginTop: 6 },
  queueHint: { marginTop: 6, fontSize: 11, color: colors.muted },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  panel: {
    backgroundColor: colors.panelAlt,
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.line,
  },
  chartPlaceholder: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  chartSubtext: {
    color: colors.muted,
    fontSize: 12,
  },
  chartEmpty: {
    color: colors.muted,
    fontSize: 12,
  },
  alertWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  alertCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
  },
  loading: {
    color: colors.muted,
    fontSize: 12,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  emptyText: {
    color: colors.muted,
    fontSize: 12,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  errorText: {
    color: colors.danger,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  errorSubtext: {
    color: colors.muted,
    fontSize: 14,
    textAlign: "center",
  },
});

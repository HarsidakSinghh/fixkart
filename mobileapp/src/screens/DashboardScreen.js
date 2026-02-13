import React, { useCallback, useMemo, useState, useEffect } from "react";
import { View, StyleSheet, Text, RefreshControl, Pressable } from "react-native";
import AdminScreenLayout from "../components/AdminScreenLayout";
import { ScreenTitle, SectionHeader, StatCard, RowCard, Badge } from "../components/Ui";
import { colors, spacing } from "../theme";
import { useAsyncList } from "../services/useAsyncList";
import MiniBarChart from "../components/MiniBarChart";
import { getDashboard, getInventoryApprovals, getRefunds, getComplaints } from "../services/api";
import { ErrorState } from "../components/StateViews";

const REVENUE_FILTERS = [
  { key: "7d", label: "Last 7 Days" },
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
];

export default function DashboardScreen({ onNavigate }) {
  const [dashboard, setDashboard] = useState({
    kpis: null,
    revenueByDay: [],
    revenueSeries: {
      "7d": [],
      monthly: [],
      yearly: [],
    },
    recentVendors: [],
    alerts: [],
  });
  const [queue, setQueue] = useState({
    inventory: 0,
    refunds: 0,
    complaints: 0,
  });

  const [refreshing, setRefreshing] = useState(false);
  const [revenueFilter, setRevenueFilter] = useState("7d");

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

      const openComplaintCount = (complaints.complaints || []).filter((c) => {
        const status = String(c.status || "").toUpperCase();
        return status === "OPEN" || status === "PENDING" || status === "IN_REVIEW";
      }).length;

      const activeRefundCount = (refunds.refunds || []).filter((r) => {
        const status = String(r.status || "").toUpperCase();
        return status === "PENDING" || status === "IN_REVIEW";
      }).length;

      setQueue({
        inventory: inventory.products?.length || 0,
        refunds: activeRefundCount,
        complaints: openComplaintCount,
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
  const revenueSeries = dashboard.revenueSeries || {};
  const activeRevenueData = useMemo(
    () => {
      const series = revenueSeries[revenueFilter];
      if (Array.isArray(series) && series.length > 0) return series;
      if (revenueFilter === "7d" && Array.isArray(dashboard.revenueByDay)) {
        return dashboard.revenueByDay.map((d, idx) => ({
          key: `${d.name}-${idx}`,
          label: d.name,
          value: Number(d.total || 0),
        }));
      }
      return [];
    },
    [revenueSeries, revenueFilter, dashboard.revenueByDay]
  );
  const activeRevenueTotal = useMemo(
    () => activeRevenueData.reduce((sum, item) => sum + Number(item.value || 0), 0),
    [activeRevenueData]
  );

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
            onPress={() => onNavigate && onNavigate("approvals", { tab: "vendors" })}
          />
          <QueueCard
            label="Inventory Approvals"
            value={queue.inventory}
            tone="warning"
            onPress={() => onNavigate && onNavigate("approvals", { tab: "inventory" })}
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
          <View style={styles.filterRow}>
            {REVENUE_FILTERS.map((filter) => {
              const active = revenueFilter === filter.key;
              return (
                <Pressable
                  key={filter.key}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setRevenueFilter(filter.key)}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {filter.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {loading && !refreshing ? (
            <Text style={styles.chartEmpty}>Loading revenue graph...</Text>
          ) : activeRevenueData.length > 0 ? (
            <View style={styles.chartWrap}>
              <MiniBarChart data={activeRevenueData} />
              <Text style={styles.chartSubtext}>Total: ₹{Math.round(activeRevenueTotal)}</Text>
            </View>
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
    borderWidth: 1,
    borderColor: colors.line,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  filterChipActive: {
    backgroundColor: colors.info,
    borderColor: colors.info,
  },
  filterChipText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  chartWrap: {
    width: "100%",
  },
  chartSubtext: {
    color: colors.muted,
    fontSize: 12,
    textAlign: "right",
    marginTop: spacing.sm,
  },
  chartEmpty: {
    color: colors.muted,
    fontSize: 12,
    textAlign: "center",
    paddingVertical: spacing.md,
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

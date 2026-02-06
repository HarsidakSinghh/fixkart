import React, { useCallback, useState } from "react";
import { View, StyleSheet, Text, RefreshControl } from "react-native";
import AdminScreenLayout from "../components/AdminScreenLayout";
import { ScreenTitle, SectionHeader, StatCard, RowCard, Badge } from "../components/Ui";
import { colors, spacing } from "../theme";
import { useAsyncList } from "../services/useAsyncList";
import { getDashboard } from "../services/api";

export default function DashboardScreen() {
  const [dashboard, setDashboard] = useState({
    kpis: null,
    revenueByDay: [],
    recentVendors: [],
    alerts: [],
  });

  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    const data = await getDashboard();
    setDashboard(data);
    return data;
  }, []);

  const { loading, error } = useAsyncList(fetchDashboard, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchDashboard();
    } finally {
      setRefreshing(false);
    }
  }, [fetchDashboard]);

  const kpis = dashboard.kpis || {};

  if (error) {
    return (
      <AdminScreenLayout>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load dashboard</Text>
          <Text style={styles.errorSubtext}>{error.message}</Text>
        </View>
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
        <SectionHeader title="Order Performance" />
        <View style={styles.grid}>
          <StatCard label="Total Revenue" value={`₹${kpis.totalRevenue || 0}`} color={colors.accent} />
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

        {dashboard.alerts && dashboard.alerts.length > 0 && (
          <>
            <SectionHeader title="Attention Queue" />
            <View style={styles.alertWrap}>
              {dashboard.alerts.map((alert) => (
                <View key={alert.id} style={styles.alertCard}>
                  <Badge text={alert.title} tone={alert.tone || 'warning'} />
                </View>
              ))}
            </View>
          </>
        )}

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

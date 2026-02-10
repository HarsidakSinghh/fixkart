import React, { useCallback } from "react";
import { View, StyleSheet, Text } from "react-native";
import AdminScreenLayout from "../components/AdminScreenLayout";
import { ScreenTitle, SectionHeader, RowCard, StatCard } from "../components/Ui";
import { colors, spacing } from "../theme";
import { useAsyncList } from "../services/useAsyncList";
import { ErrorState, SkeletonList, EmptyState } from "../components/StateViews";
import { getOrders, getDashboard, updateOrderStatus } from "../services/api";
import { ActionRow } from "../components/Ui";
import StatusPill from "../components/StatusPill";

export default function OrdersScreen() {
  const [stats, setStats] = React.useState({
    pending: 0,
    processing: 0,
    completed: 0,
  });

  const fetchOrders = useCallback(async () => {
    const data = await getOrders();
    return (data.orders || []).filter(
      (o) => !["COMPLETED", "DELIVERED"].includes(String(o.status || "").toUpperCase())
    );
  }, []);

  const { items, setItems, error, refresh, loading } = useAsyncList(fetchOrders, []);

  React.useEffect(() => {
    let mounted = true;
    getDashboard().then((data) => {
      if (!mounted) return;
      setStats({
        pending: data.kpis?.orderPending || 0,
        processing: data.kpis?.orderApproved || 0,
        completed: data.kpis?.orderCompleted || 0,
      });
    });
    return () => {
      mounted = false;
    };
  }, []);


  return (
    <AdminScreenLayout>
      <ScreenTitle title="Orders" subtitle="Live pipeline" />

      <SectionHeader title="Quick Stats" />
      <View style={styles.grid}>
        <StatCard label="Pending" value={stats.pending} color={colors.warning} />
        <StatCard label="Processing" value={stats.processing} color={colors.info} />
        <StatCard label="Completed" value={stats.completed} color={colors.accent} />
      </View>

      <SectionHeader title="Latest Orders" actionLabel="Filter" />
      {loading && items.length === 0 ? <SkeletonList count={3} /> : null}
      {error && items.length === 0 ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : !loading && items.length === 0 ? (
        <EmptyState
          title="No orders yet"
          message="New orders will appear here as they come in."
          actionLabel="Refresh"
          onAction={refresh}
        />
      ) : (
        items.map((order) => (
          <RowCard
            key={order.id}
            title={order.customer}
            subtitle={`${order.id}  •  ${order.city}`}
            right={
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.amount}>₹{order.amount}</Text>
                <StatusPill label={order.status} tone={statusTone(order.status)} />
              </View>
            }
            meta={
              <View>
                <Text style={styles.placed}>Placed {order.placedAt}</Text>
                <ActionRow
                  secondaryLabel="Mark Shipped"
                  primaryLabel="Mark Delivered"
                  onSecondary={async () => {
                    await updateOrderStatus(order.id, "SHIPPED");
                    refresh();
                  }}
                  onPrimary={async () => {
                    await updateOrderStatus(order.id, "DELIVERED");
                    refresh();
                  }}
                />
              </View>
            }
          />
        ))
      )}
    </AdminScreenLayout>
  );
}

function statusTone(status) {
  if (status === "COMPLETED") return "success";
  if (status === "PENDING") return "warning";
  if (status === "APPROVED") return "info";
  if (status === "IN_TRANSIT") return "info";
  return "danger";
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: spacing.md,
    columnGap: spacing.md,
  },
  amount: { color: colors.text, fontWeight: "700", marginBottom: 6 },
  placed: { color: colors.muted, fontSize: 11, marginBottom: 6 },
});

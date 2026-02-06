import React, { useCallback } from "react";
import { View, StyleSheet, Text } from "react-native";
import AdminScreenLayout from "../components/AdminScreenLayout";
import { ScreenTitle, SectionHeader, RowCard, Badge, StatCard } from "../components/Ui";
import { colors, spacing } from "../theme";
import { useAsyncList } from "../services/useAsyncList";
import { getOrders, getDashboard } from "../services/api";
import SkeletonCard from "../components/SkeletonCard";

export default function OrdersScreen() {
  const [stats, setStats] = React.useState({
    pending: 0,
    processing: 0,
    completed: 0,
  });

  const fetchOrders = useCallback(async () => {
    const data = await getOrders();
    return data.orders;
  }, []);

  const { items, setItems } = useAsyncList(fetchOrders, []);

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
      {items.length === 0 ? (
        <>
          <SkeletonCard height={120} />
          <SkeletonCard height={120} />
        </>
      ) : (
        items.map((order) => (
          <RowCard
            key={order.id}
            title={order.customer}
            subtitle={`${order.id}  •  ${order.city}`}
            right={
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.amount}>₹{order.amount}</Text>
                <Badge text={order.status} tone={statusTone(order.status)} />
              </View>
            }
            meta={
              <View>
                <Text style={styles.placed}>Placed {order.placedAt}</Text>
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

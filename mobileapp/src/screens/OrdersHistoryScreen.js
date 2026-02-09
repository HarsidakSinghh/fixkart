import React, { useCallback } from "react";
import AdminScreenLayout from "../components/AdminScreenLayout";
import { ScreenTitle, SectionHeader, RowCard, Badge } from "../components/Ui";
import { useAsyncList } from "../services/useAsyncList";
import { getOrdersHistory } from "../services/api";
import { Text } from "react-native";
import { ErrorState, SkeletonList, EmptyState } from "../components/StateViews";

export default function OrdersHistoryScreen() {
  const fetchHistory = useCallback(async () => {
    const data = await getOrdersHistory();
    return data.orders;
  }, []);

  const { items, error, refresh, loading } = useAsyncList(fetchHistory, []);

  return (
    <AdminScreenLayout>
      <ScreenTitle title="Orders History" subtitle="Past activity" />
      <SectionHeader title="Archived Orders" />
      {loading && items.length === 0 ? <SkeletonList count={3} /> : null}
      {error && items.length === 0 ? <ErrorState message={error} onRetry={refresh} /> : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState title="No archived orders" message="Completed orders will show here." />
      ) : null}
      {items.map((order) => (
        <RowCard
          key={order.id}
          title={order.customer}
          subtitle={`${order.id}  •  ${order.city || "-"}  •  ${new Date(order.createdAt).toLocaleDateString()}`}
          right={<Badge text={order.status} tone={statusTone(order.status)} />}
          meta={
            <Text style={{ color: "#7B8794", fontSize: 12 }}>
              ₹{order.amount}  •  {order.itemsCount || 0} items
            </Text>
          }
        />
      ))}
    </AdminScreenLayout>
  );
}

function statusTone(status) {
  if (status === "COMPLETED") return "success";
  if (status === "REJECTED") return "danger";
  return "info";
}

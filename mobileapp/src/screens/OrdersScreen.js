import React, { useCallback } from "react";
import { View, StyleSheet, Text, Modal, TouchableOpacity, ScrollView, Image } from "react-native";
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
  const [selectedOrder, setSelectedOrder] = React.useState(null);

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
                  secondaryLabel="View Details"
                  primaryLabel={String(order.status || "").toUpperCase() === "PENDING" ? "Approve" : "Mark Delivered"}
                  onSecondary={async () => {
                    setSelectedOrder(order);
                  }}
                  onPrimary={async () => {
                    await updateOrderStatus(
                      order.id,
                      String(order.status || "").toUpperCase() === "PENDING" ? "APPROVED" : "DELIVERED"
                    );
                    refresh();
                  }}
                />
              </View>
            }
          />
        ))
      )}

      {selectedOrder ? (
        <Modal visible transparent animationType="slide" onRequestClose={() => setSelectedOrder(null)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Order Details</Text>
                <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                  <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalSub}>Order ID: {selectedOrder.id}</Text>
                <Text style={styles.modalSub}>Customer: {selectedOrder.customerName || selectedOrder.customer}</Text>
                {selectedOrder.customerPhone ? <Text style={styles.modalSub}>Phone: {selectedOrder.customerPhone}</Text> : null}
                {selectedOrder.customerAddress ? <Text style={styles.modalSub}>Address: {selectedOrder.customerAddress}</Text> : null}
                <Text style={styles.modalSub}>Total: ₹{Math.round(selectedOrder.totalAmount || 0)}</Text>

                <Text style={styles.sectionTitle}>Items</Text>
                {(selectedOrder.items || []).map((item) => (
                  <View key={item.id} style={styles.itemCard}>
                    {item.image ? <Image source={{ uri: item.image }} style={styles.itemImage} /> : null}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{item.productName}</Text>
                      <Text style={styles.itemMeta}>Qty: {item.quantity} • ₹{Math.round(item.price || 0)}</Text>
                      <Text style={styles.itemMeta}>Vendor: {item.vendorName || "Vendor"}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={async () => {
                    await updateOrderStatus(selectedOrder.id, "APPROVED");
                    setSelectedOrder(null);
                    refresh();
                  }}
                >
                  <Text style={styles.approveText}>Approve Order</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    maxHeight: "88%",
    padding: spacing.lg,
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: "800" },
  closeText: { color: colors.primary, fontWeight: "700" },
  modalSub: { color: colors.muted, marginTop: 6, fontSize: 12 },
  sectionTitle: { color: colors.text, fontWeight: "700", marginTop: spacing.md, marginBottom: spacing.sm },
  itemCard: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  itemImage: { width: 52, height: 52, borderRadius: 10, backgroundColor: colors.panelAlt },
  itemName: { color: colors.text, fontWeight: "700" },
  itemMeta: { color: colors.muted, fontSize: 11, marginTop: 3 },
  modalActions: { marginTop: spacing.sm },
  approveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 11,
  },
  approveText: { color: "#FFFFFF", fontWeight: "700" },
});

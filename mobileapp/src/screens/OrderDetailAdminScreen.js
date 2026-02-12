import React, { useCallback } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from "react-native";
import AdminScreenLayout from "../components/AdminScreenLayout";
import { ScreenTitle, RowCard, Badge } from "../components/Ui";
import { ErrorState, SkeletonList, EmptyState } from "../components/StateViews";
import { colors, spacing } from "../theme";
import { useAsyncList } from "../services/useAsyncList";
import { getOrders } from "../services/api";

export default function OrderDetailAdminScreen({ orderId, onBack }) {
  const fetchOrder = useCallback(async () => {
    const data = await getOrders();
    const orders = Array.isArray(data?.orders) ? data.orders : [];
    return orders.find((o) => o.id === orderId) || null;
  }, [orderId]);

  const { items, error, refresh, loading } = useAsyncList(fetchOrder, null);
  const order = items && typeof items === "object" ? items : null;

  return (
    <AdminScreenLayout>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <ScreenTitle title="Order Detail" subtitle="Full order data with line items" />

      {loading && !order ? <SkeletonList count={3} /> : null}
      {error && !order ? <ErrorState message={error} onRetry={refresh} /> : null}
      {!loading && !error && !order ? (
        <EmptyState title="Order not found" message="This order may be archived or unavailable." />
      ) : null}

      {order ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Info</Text>
            <Text style={styles.metaText}>Order ID: {order.id}</Text>
            <Text style={styles.metaText}>Customer: {order.customerName || order.customer}</Text>
            {order.customerPhone ? <Text style={styles.metaText}>Phone: {order.customerPhone}</Text> : null}
            {order.customerAddress ? <Text style={styles.metaText}>Address: {order.customerAddress}</Text> : null}
            <Text style={styles.metaText}>Total: ₹{Math.round(order.totalAmount || 0)}</Text>
            {order.paymentMethod ? <Text style={styles.metaText}>Payment: {order.paymentMethod}</Text> : null}
            {order.createdAt ? (
              <Text style={styles.metaText}>Placed: {new Date(order.createdAt).toLocaleString()}</Text>
            ) : null}
            <View style={{ marginTop: 6, alignSelf: "flex-start" }}>
              <Badge text={order.status || "UNKNOWN"} tone={statusTone(order.status)} />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Items</Text>
          {(order.items || []).map((item) => (
            <RowCard
              key={item.id}
              title={item.productName || "Product"}
              subtitle={`Vendor: ${item.vendorName || "Vendor"}  •  Qty: ${item.quantity}  •  ₹${Math.round(
                item.price || 0
              )}`}
              meta={
                item.image ? (
                  <Image source={{ uri: item.image }} style={styles.itemImage} />
                ) : (
                  <Text style={styles.metaText}>No image</Text>
                )
              }
            />
          ))}
        </ScrollView>
      ) : null}
    </AdminScreenLayout>
  );
}

function statusTone(status) {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "DELIVERED" || normalized === "COMPLETED") return "success";
  if (normalized === "PENDING" || normalized === "APPROVED" || normalized === "PROCESSING") return "warning";
  if (normalized === "SHIPPED" || normalized === "IN_TRANSIT") return "info";
  return "danger";
}

const styles = StyleSheet.create({
  backBtn: { marginBottom: spacing.sm },
  backText: { color: colors.primary, fontWeight: "700" },
  section: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: { color: colors.text, fontWeight: "800", marginBottom: 6 },
  metaText: { color: colors.muted, fontSize: 12, marginTop: 4 },
  itemImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panelAlt,
    marginTop: 8,
  },
});

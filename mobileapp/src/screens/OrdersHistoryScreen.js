import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Image, Modal, ScrollView, TouchableOpacity } from "react-native";
import AdminScreenLayout from "../components/AdminScreenLayout";
import { ScreenTitle, SectionHeader, RowCard, Badge, ActionRow } from "../components/Ui";
import { useAsyncList } from "../services/useAsyncList";
import { getOrdersHistory, generateInvoice, generatePurchaseOrders } from "../services/api";
import { ErrorState, SkeletonList, EmptyState } from "../components/StateViews";
import { colors, spacing } from "../theme";
import * as WebBrowser from "expo-web-browser";

export default function OrdersHistoryScreen() {
  const fetchHistory = useCallback(async () => {
    const data = await getOrdersHistory();
    return data.orders;
  }, []);

  const { items, error, refresh, loading } = useAsyncList(fetchHistory, []);
  const [selected, setSelected] = useState(null);
  const [downloading, setDownloading] = useState(null);

  const openInvoice = async (orderId) => {
    setDownloading(`invoice:${orderId}`);
    try {
      const data = await generateInvoice(orderId);
      if (data?.url) {
        await WebBrowser.openBrowserAsync(data.url);
      }
    } finally {
      setDownloading(null);
    }
  };

  const openPOs = async (orderId) => {
    setDownloading(`po:${orderId}`);
    try {
      await generatePurchaseOrders(orderId);
      await refresh();
    } finally {
      setDownloading(null);
    }
  };

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
          title={order.customerName || order.customer}
          subtitle={`${order.id}  •  ${order.city || "-"}  •  ${new Date(order.createdAt).toLocaleDateString()}`}
          right={<Badge text={order.status} tone={statusTone(order.status)} />}
          meta={
            <View>
              <Text style={styles.metaText}>₹{Math.round(order.totalAmount || order.amount || 0)}  •  {(order.items || []).length} items</Text>
              <ActionRow
                primaryLabel="Details"
                onPrimary={() => setSelected(order)}
              />
            </View>
          }
        />
      ))}

      <Modal visible={!!selected} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Details</Text>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>
            {selected ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionTitle}>Buyer</Text>
                <Text style={styles.metaText}>{selected.customerName || selected.customer}</Text>
                <Text style={styles.metaText}>{selected.customerEmail || ""}</Text>
                <Text style={styles.metaText}>{selected.customerPhone || ""}</Text>

                <Text style={styles.sectionTitle}>Items</Text>
                {(selected.items || []).map((item) => (
                  <View key={item.id} style={styles.itemRow}>
                    {item.image ? <Image source={{ uri: item.image }} style={styles.itemImage} /> : null}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{item.productName}</Text>
                      <Text style={styles.metaText}>Qty: {item.quantity} • ₹{Math.round(item.price || 0)}</Text>
                    </View>
                  </View>
                ))}

                <Text style={styles.sectionTitle}>Documents</Text>
                <TouchableOpacity
                  style={styles.docBtn}
                  onPress={() => openInvoice(selected.id)}
                  disabled={downloading === `invoice:${selected.id}`}
                >
                  <Text style={styles.docText}>
                    {downloading === `invoice:${selected.id}` ? "Preparing PI…" : "Download PI"}
                  </Text>
                </TouchableOpacity>

                {(selected.purchaseOrders || []).length ? (
                  (selected.purchaseOrders || []).map((po) => (
                    <TouchableOpacity
                      key={po.id}
                      style={styles.poLink}
                      onPress={() => WebBrowser.openBrowserAsync(po.url)}
                    >
                      <Text style={styles.poText}>
                        Download {po.vendorName ? `${po.vendorName} PO` : "Vendor PO"}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <TouchableOpacity
                    style={styles.docBtnSecondary}
                    onPress={() => openPOs(selected.id)}
                    disabled={downloading === `po:${selected.id}`}
                  >
                    <Text style={styles.docTextSecondary}>
                      {downloading === `po:${selected.id}` ? "Preparing PO…" : "Generate PO(s)"}
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </AdminScreenLayout>
  );
}

function statusTone(status) {
  if (status === "COMPLETED") return "success";
  if (status === "REJECTED") return "danger";
  return "info";
}

const styles = StyleSheet.create({
  metaText: { color: colors.muted, fontSize: 12, marginTop: 4 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    maxHeight: "85%",
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
  closeText: { color: colors.primary, fontWeight: "700" },
  sectionTitle: { marginTop: spacing.md, fontWeight: "700", color: colors.text },
  itemRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
  },
  itemImage: { width: 48, height: 48, borderRadius: 10, backgroundColor: colors.panelAlt },
  itemTitle: { color: colors.text, fontWeight: "700" },
  docBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  docText: { color: "#FFFFFF", fontWeight: "700" },
  docBtnSecondary: {
    marginTop: spacing.sm,
    backgroundColor: colors.card,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.line,
  },
  docTextSecondary: { color: colors.primary, fontWeight: "700" },
  poLink: {
    marginTop: spacing.sm,
    paddingVertical: 8,
  },
  poText: { color: colors.info, fontWeight: "700" },
});

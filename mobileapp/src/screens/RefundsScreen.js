import React, { useCallback } from "react";
import AdminScreenLayout from "../components/AdminScreenLayout";
import { ScreenTitle, SectionHeader, RowCard, ActionRow } from "../components/Ui";
import { useAsyncList } from "../services/useAsyncList";
import { getRefunds, updateRefundStatus } from "../services/api";
import { ErrorState, SkeletonList, EmptyState } from "../components/StateViews";
import StatusPill from "../components/StatusPill";
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet, Image, Linking } from "react-native";
import { colors, spacing } from "../theme";

export default function RefundsScreen() {
  const fetchRefunds = useCallback(async () => {
    const data = await getRefunds();
    return data.refunds;
  }, []);

  const { items, setItems, error, refresh, loading } = useAsyncList(fetchRefunds, []);
  const [selectedRefund, setSelectedRefund] = React.useState(null);

  async function updateStatus(id, status) {
    await updateRefundStatus(id, status);
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  const pending = items.filter((i) => String(i.status || "").toUpperCase() !== "APPROVED");
  const issued = items.filter((i) => String(i.status || "").toUpperCase() === "APPROVED");

  return (
    <AdminScreenLayout>
      <ScreenTitle title="Refunds" subtitle="Finance desk" />
      <SectionHeader title="Refund Queue" actionLabel="Export" />
      {loading && items.length === 0 ? <SkeletonList count={4} /> : null}
      {error && items.length === 0 ? <ErrorState message={error} onRetry={refresh} /> : null}
      {!loading && !error && pending.length === 0 ? (
        <EmptyState title="No pending refunds" message="Refund requests will show here." />
      ) : null}
      {pending.map((item) => (
        <RowCard
          key={item.id}
          title={`₹${item.amount}`}
          subtitle={`${item.orderId}  •  ${item.id}`}
          right={<StatusPill label={item.status} tone={statusTone(item.status)} />}
          meta={
            <ActionRow
              secondaryLabel="View Details"
              primaryLabel="In Review"
              onSecondary={() => setSelectedRefund(item)}
              onPrimary={async () => {
                await updateStatus(item.id, "IN_REVIEW");
                refresh();
              }}
            />
          }
        />
      ))}

      <SectionHeader title="Issued Refunds" />
      {!loading && !error && issued.length === 0 ? (
        <EmptyState title="No issued refunds" message="Approved refunds will appear here." />
      ) : null}
      {issued.map((item) => (
        <RowCard
          key={item.id}
          title={`₹${item.amount}`}
          subtitle={`${item.orderId}  •  ${item.id}`}
          right={<StatusPill label="ISSUED" tone="success" />}
        />
      ))}

      {selectedRefund ? (
        <Modal visible transparent animationType="slide" onRequestClose={() => setSelectedRefund(null)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Refund Detail</Text>
                <TouchableOpacity onPress={() => setSelectedRefund(null)}>
                  <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.metaText}>Order: {selectedRefund.orderId || "-"}</Text>
                <Text style={styles.metaText}>Customer: {selectedRefund.customerName || "Customer"}</Text>
                <Text style={styles.metaText}>Vendor: {selectedRefund.vendorName || "Vendor"}</Text>
                <Text style={styles.metaText}>Amount: ₹{Math.round(selectedRefund.amountValue || 0)}</Text>
                <Text style={styles.metaText}>Reason: {selectedRefund.reason || "-"}</Text>
                <Text style={styles.metaText}>Status: {humanRefundStatus(selectedRefund.status)}</Text>
                {selectedRefund.createdAt ? (
                  <Text style={styles.metaText}>Time: {new Date(selectedRefund.createdAt).toLocaleString()}</Text>
                ) : null}
                {selectedRefund.productImage ? (
                  <Image source={{ uri: selectedRefund.productImage }} style={styles.productImage} />
                ) : null}
                {selectedRefund.billUrl ? (
                  <Text style={styles.linkText} onPress={() => Linking.openURL(selectedRefund.billUrl)}>
                    Open Bill
                  </Text>
                ) : null}
                {selectedRefund.transportSlipUrl ? (
                  <Text style={styles.linkText} onPress={() => Linking.openURL(selectedRefund.transportSlipUrl)}>
                    Open Transport Slip
                  </Text>
                ) : null}
              </ScrollView>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.reviewBtn}
                  onPress={async () => {
                    await updateStatus(selectedRefund.id, "IN_REVIEW");
                    setSelectedRefund(null);
                    refresh();
                  }}
                >
                  <Text style={styles.reviewText}>In Review</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={async () => {
                    await updateStatus(selectedRefund.id, "REJECTED");
                    setSelectedRefund(null);
                    refresh();
                  }}
                >
                  <Text style={styles.rejectText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={async () => {
                    await updateStatus(selectedRefund.id, "APPROVED");
                    setSelectedRefund(null);
                    refresh();
                  }}
                >
                  <Text style={styles.approveText}>Issue</Text>
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
  const normalized = String(status || "").toUpperCase();
  if (normalized === "APPROVED") return "success";
  if (normalized === "IN_REVIEW" || normalized === "PENDING") return "warning";
  if (normalized === "REJECTED") return "danger";
  return "info";
}

function humanRefundStatus(status) {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "APPROVED") return "Issued";
  if (normalized === "IN_REVIEW" || normalized === "PENDING") return "In Review";
  if (normalized === "REJECTED") return "Rejected";
  return normalized || "Unknown";
}

const styles = StyleSheet.create({
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
  metaText: { color: colors.muted, fontSize: 12, marginTop: 6 },
  productImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panelAlt,
    marginTop: spacing.sm,
  },
  linkText: { color: colors.info, marginTop: 8, fontWeight: "700", fontSize: 12 },
  modalActions: { marginTop: spacing.sm, flexDirection: "row", gap: spacing.sm },
  reviewBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 11,
    backgroundColor: colors.panelAlt,
  },
  reviewText: { color: colors.text, fontWeight: "700" },
  rejectBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 11,
    backgroundColor: colors.card,
  },
  rejectText: { color: colors.text, fontWeight: "700" },
  approveBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 11,
  },
  approveText: { color: "#FFFFFF", fontWeight: "700" },
});

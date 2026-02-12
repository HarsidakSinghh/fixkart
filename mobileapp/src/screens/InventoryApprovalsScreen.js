import React, { useCallback } from "react";
import { View, Text, Image, Modal, TouchableOpacity, ScrollView, StyleSheet, TextInput, Alert } from "react-native";
import AdminScreenLayout from "../components/AdminScreenLayout";
import { ScreenTitle, SectionHeader, RowCard, Badge, ActionRow } from "../components/Ui";
import { useAsyncList } from "../services/useAsyncList";
import { getInventoryApprovals, approveProduct, rejectProduct, updateProductCommission } from "../services/api";
import { ErrorState, SkeletonList, EmptyState } from "../components/StateViews";
import { colors, spacing } from "../theme";

export default function InventoryApprovalsScreen() {
  const fetchInventoryApprovals = useCallback(async () => {
    const data = await getInventoryApprovals();
    return data.products;
  }, []);

  const { items, setItems, error, refresh, loading } = useAsyncList(fetchInventoryApprovals, []);
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [commissionInput, setCommissionInput] = React.useState("");
  const [savingCommission, setSavingCommission] = React.useState(false);

  async function updateStatus(id, status) {
    if (status === "APPROVED") await approveProduct(id);
    if (status === "REJECTED") await rejectProduct(id);
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  async function saveCommission() {
    if (!selectedItem?.id) return;
    const percent = Number(commissionInput);
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
      Alert.alert("Invalid commission", "Commission must be between 0 and 100.");
      return;
    }
    setSavingCommission(true);
    try {
      await updateProductCommission(selectedItem.id, percent);
      setSelectedItem((prev) => (prev ? { ...prev, commissionPercent: percent } : prev));
      setItems((prev) =>
        prev.map((item) => (item.id === selectedItem.id ? { ...item, commissionPercent: percent } : item))
      );
      Alert.alert("Updated", "Commission percent updated successfully.");
    } catch {
      Alert.alert("Failed", "Could not update commission percent.");
    } finally {
      setSavingCommission(false);
    }
  }

  return (
    <AdminScreenLayout>
      <ScreenTitle title="Inventory Approvals" subtitle="Pending listings" />
      <SectionHeader title="Awaiting Review" actionLabel="Bulk" />
      {loading && items.length === 0 ? <SkeletonList count={3} /> : null}
      {error && items.length === 0 ? <ErrorState message={error} onRetry={refresh} /> : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState title="No pending listings" message="Inventory approvals will appear here." />
      ) : null}
      {items.map((item) => (
        <RowCard
          key={item.id}
          title={item.item}
          subtitle={`${item.vendor}  •  ${item.id}`}
          right={<Badge text={item.status} tone={statusTone(item.status)} />}
          meta={
            <ActionRow
              secondaryLabel="Reject"
              primaryLabel="View Details"
              onSecondary={() => updateStatus(item.id, "REJECTED")}
              onPrimary={() => {
                setSelectedItem(item);
                setCommissionInput(String(Number(item.commissionPercent || 0)));
              }}
            />
          }
        />
      ))}

      {selectedItem ? (
        <Modal visible transparent animationType="slide" onRequestClose={() => setSelectedItem(null)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Inventory Detail</Text>
                <TouchableOpacity onPress={() => setSelectedItem(null)}>
                  <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {selectedItem.image ? <Image source={{ uri: selectedItem.image }} style={styles.image} /> : null}
                <Text style={styles.metaText}>Name: {selectedItem.name || selectedItem.item}</Text>
                <Text style={styles.metaText}>Vendor: {selectedItem.vendorName || selectedItem.vendor}</Text>
                <Text style={styles.metaText}>Category: {selectedItem.category || "-"}</Text>
                <Text style={styles.metaText}>Subcategory: {selectedItem.subCategory || "-"}</Text>
                <Text style={styles.metaText}>Price: ₹{Math.round(selectedItem.price || 0)}</Text>
                <Text style={styles.metaText}>Commission: {Number(selectedItem.commissionPercent || 0)}%</Text>
                <Text style={styles.metaText}>Description: {selectedItem.description || "No description"}</Text>
                <View style={styles.commissionWrap}>
                  <Text style={styles.commissionLabel}>Update Commission %</Text>
                  <TextInput
                    value={commissionInput}
                    onChangeText={setCommissionInput}
                    keyboardType="numeric"
                    placeholder="e.g. 12"
                    placeholderTextColor={colors.muted}
                    style={styles.commissionInput}
                  />
                  <TouchableOpacity
                    style={[styles.commissionBtn, savingCommission ? { opacity: 0.7 } : null]}
                    onPress={saveCommission}
                    disabled={savingCommission}
                  >
                    <Text style={styles.commissionBtnText}>
                      {savingCommission ? "Saving..." : "Save Commission"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={async () => {
                    await updateStatus(selectedItem.id, "APPROVED");
                    setSelectedItem(null);
                  }}
                >
                  <Text style={styles.approveText}>Approve Inventory</Text>
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
  if (status === "PENDING") return "warning";
  if (status === "APPROVED") return "success";
  if (status === "REJECTED") return "danger";
  return "info";
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
  image: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panelAlt,
    marginBottom: spacing.sm,
  },
  metaText: { color: colors.muted, fontSize: 12, marginTop: 6 },
  modalActions: { marginTop: spacing.sm },
  approveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 11,
  },
  approveText: { color: "#FFFFFF", fontWeight: "700" },
  commissionWrap: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: spacing.sm,
    backgroundColor: colors.card,
  },
  commissionLabel: { color: colors.text, fontWeight: "700", fontSize: 12, marginBottom: 6 },
  commissionInput: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.text,
    fontSize: 12,
  },
  commissionBtn: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: "center",
  },
  commissionBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
});

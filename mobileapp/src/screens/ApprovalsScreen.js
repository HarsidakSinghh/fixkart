import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Modal, TouchableOpacity, ScrollView, Image, TextInput, Alert } from "react-native";
import AdminScreenLayout from "../components/AdminScreenLayout";
import { ScreenTitle, SectionHeader, RowCard, Badge, ActionRow } from "../components/Ui";
import { colors, spacing } from "../theme";
import { useAsyncList } from "../services/useAsyncList";
import { ErrorState } from "../components/StateViews";
import {
  getVendors,
  updateVendorStatus,
  getCustomers,
  updateCustomerStatus,
  getInventoryApprovals,
  approveProduct,
  rejectProduct,
  updateProductCommission,
} from "../services/api";

const TABS = [
  { key: "vendors", label: "Vendors" },
  { key: "inventory", label: "Inventory" },
  { key: "customers", label: "Customers" },
];

export default function ApprovalsScreen() {
  const [activeTab, setActiveTab] = useState("vendors");
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [commissionInput, setCommissionInput] = useState("");
  const [savingCommission, setSavingCommission] = useState(false);

  const fetchVendors = useCallback(async () => {
    const data = await getVendors("PENDING");
    return data.vendors;
  }, []);
  const fetchCustomers = useCallback(async () => {
    const data = await getCustomers("PENDING");
    return data.customers;
  }, []);
  const fetchInventory = useCallback(async () => {
    const data = await getInventoryApprovals();
    return data.products;
  }, []);

  const vendorsList = useAsyncList(fetchVendors, []);
  const customersList = useAsyncList(fetchCustomers, []);
  const inventoryList = useAsyncList(fetchInventory, []);

  const counts = useMemo(
    () => ({
      vendors: vendorsList.items.length,
      customers: customersList.items.length,
      inventory: inventoryList.items.length,
    }),
    [vendorsList.items.length, customersList.items.length, inventoryList.items.length]
  );

  const handleVendorAction = async (vendorId, status) => {
    await updateVendorStatus(vendorId, status);
    vendorsList.setItems((prev) => prev.filter((v) => v.id !== vendorId));
  };

  const handleCustomerAction = async (customerId, status) => {
    await updateCustomerStatus(customerId, status);
    customersList.setItems((prev) => prev.filter((c) => c.id !== customerId));
  };

  const handleInventoryAction = async (productId, action) => {
    if (action === "APPROVE") {
      await approveProduct(productId);
    } else {
      await rejectProduct(productId);
    }
    inventoryList.setItems((prev) => prev.filter((p) => p.id !== productId));
  };

  const saveCommission = async () => {
    if (!selectedInventory?.id) return;
    const percent = Number(commissionInput);
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
      Alert.alert("Invalid commission", "Commission must be between 0 and 100.");
      return;
    }
    setSavingCommission(true);
    try {
      await updateProductCommission(selectedInventory.id, percent);
      setSelectedInventory((prev) => (prev ? { ...prev, commissionPercent: percent } : prev));
      inventoryList.setItems((prev) =>
        prev.map((item) => (item.id === selectedInventory.id ? { ...item, commissionPercent: percent } : item))
      );
      Alert.alert("Updated", "Commission percent updated.");
    } catch {
      Alert.alert("Failed", "Could not update commission percent.");
    } finally {
      setSavingCommission(false);
    }
  };

  const activeItems =
    activeTab === "vendors"
      ? vendorsList.items
      : activeTab === "customers"
      ? customersList.items
      : inventoryList.items;

  const activeError =
    activeTab === "vendors"
      ? vendorsList.error
      : activeTab === "customers"
      ? customersList.error
      : inventoryList.error;

  const activeRefresh =
    activeTab === "vendors"
      ? vendorsList.refresh
      : activeTab === "customers"
      ? customersList.refresh
      : inventoryList.refresh;

  return (
    <AdminScreenLayout>
      <ScreenTitle title="Approvals" subtitle="Everything pending in one view" />

      <View style={styles.tabRow}>
        {TABS.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {tab.label} · {counts[tab.key] || 0}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <SectionHeader
        title={
          activeTab === "vendors"
            ? "Vendor Requests"
            : activeTab === "customers"
            ? "Customer Requests"
            : "Inventory Requests"
        }
      />

      {activeError && activeItems.length === 0 ? (
        <ErrorState message={activeError} onRetry={activeRefresh} />
      ) : activeItems.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No pending approvals</Text>
          <Text style={styles.emptySubtitle}>Everything is cleared for now.</Text>
        </View>
      ) : null}

      {activeItems.map((item) => {
        if (activeTab === "inventory") {
          return (
            <RowCard
              key={item.id}
              title={item.item}
              subtitle={`Vendor: ${item.vendor}`}
              right={<Badge text={item.status || "PENDING"} tone="warning" />}
              meta={
                <ActionRow
                  primaryLabel="Approve"
                  secondaryLabel="View Details"
                  onPrimary={() => handleInventoryAction(item.id, "APPROVE")}
                  onSecondary={() => {
                    setSelectedInventory(item);
                    setCommissionInput(String(Number(item.commissionPercent || 0)));
                  }}
                />
              }
            />
          );
        }

        if (activeTab === "customers") {
          return (
            <RowCard
              key={item.id}
              title={item.name}
              subtitle={item.city || "-"}
              right={<Badge text={item.status || "PENDING"} tone="warning" />}
              meta={
                <ActionRow
                  primaryLabel="Approve"
                  secondaryLabel="Reject"
                  onPrimary={() => handleCustomerAction(item.id, "APPROVED")}
                  onSecondary={() => handleCustomerAction(item.id, "REJECTED")}
                />
              }
            />
          );
        }

        return (
          <RowCard
            key={item.id}
            title={item.name}
            subtitle={item.city || "-"}
            right={<Badge text={item.status || "PENDING"} tone="warning" />}
            meta={
              <ActionRow
                primaryLabel="Approve"
                secondaryLabel="Reject"
                onPrimary={() => handleVendorAction(item.id, "APPROVED")}
                onSecondary={() => handleVendorAction(item.id, "REJECTED")}
              />
            }
          />
        );
      })}

      {selectedInventory ? (
        <Modal visible transparent animationType="slide" onRequestClose={() => setSelectedInventory(null)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Inventory Detail</Text>
                <TouchableOpacity onPress={() => setSelectedInventory(null)}>
                  <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {selectedInventory.image ? (
                  <Image source={{ uri: selectedInventory.image }} style={styles.image} />
                ) : null}
                <Text style={styles.metaText}>Name: {selectedInventory.name || selectedInventory.item}</Text>
                <Text style={styles.metaText}>Vendor: {selectedInventory.vendorName || selectedInventory.vendor}</Text>
                <Text style={styles.metaText}>Category: {selectedInventory.category || "-"}</Text>
                <Text style={styles.metaText}>Subcategory: {selectedInventory.subCategory || "-"}</Text>
                <Text style={styles.metaText}>Price: ₹{Math.round(selectedInventory.price || 0)}</Text>
                <Text style={styles.metaText}>Commission: {Number(selectedInventory.commissionPercent || 0)}%</Text>
                <Text style={styles.metaText}>Description: {selectedInventory.description || "No description"}</Text>
                <View style={styles.commissionWrap}>
                  <Text style={styles.commissionLabel}>Change Commission %</Text>
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
                  style={styles.rejectBtn}
                  onPress={async () => {
                    await handleInventoryAction(selectedInventory.id, "REJECT");
                    setSelectedInventory(null);
                  }}
                >
                  <Text style={styles.rejectText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={async () => {
                    await handleInventoryAction(selectedInventory.id, "APPROVE");
                    setSelectedInventory(null);
                  }}
                >
                  <Text style={styles.approveText}>Approve</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </AdminScreenLayout>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panelAlt,
    alignItems: "center",
  },
  tabActive: {
    borderColor: colors.primary,
    backgroundColor: colors.card,
  },
  tabText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  tabTextActive: {
    color: colors.text,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.md,
  },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  emptySubtitle: { color: colors.muted, marginTop: 6, fontSize: 12 },
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
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
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
  modalActions: { marginTop: spacing.sm, flexDirection: "row", gap: spacing.sm },
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

import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import AdminScreenLayout from "../components/AdminScreenLayout";
import { ScreenTitle, SectionHeader, RowCard, Badge, ActionRow } from "../components/Ui";
import { colors, spacing } from "../theme";
import { useAsyncList } from "../services/useAsyncList";
import {
  getVendors,
  updateVendorStatus,
  getCustomers,
  updateCustomerStatus,
  getInventoryApprovals,
  approveProduct,
  rejectProduct,
} from "../services/api";

const TABS = [
  { key: "vendors", label: "Vendors" },
  { key: "inventory", label: "Inventory" },
  { key: "customers", label: "Customers" },
];

export default function ApprovalsScreen() {
  const [activeTab, setActiveTab] = useState("vendors");

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

  const activeItems =
    activeTab === "vendors"
      ? vendorsList.items
      : activeTab === "customers"
      ? customersList.items
      : inventoryList.items;

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

      {activeItems.length === 0 ? (
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
                  secondaryLabel="Reject"
                  onPrimary={() => handleInventoryAction(item.id, "APPROVE")}
                  onSecondary={() => handleInventoryAction(item.id, "REJECT")}
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
});

import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import AdminScreenLayout from "../components/AdminScreenLayout";
import { ScreenTitle, SectionHeader, RowCard, Badge } from "../components/Ui";
import { useAsyncList } from "../services/useAsyncList";
import { bulkVendorAction, getVendors } from "../services/api";
import { ErrorState, SkeletonList, EmptyState } from "../components/StateViews";
import { colors } from "../theme";
import VendorProfileAdminScreen from "./VendorProfileAdminScreen";

export default function OnboardedVendorsScreen() {
  const fetchVendors = useCallback(async () => {
    const data = await getVendors("APPROVED");
    return data.vendors;
  }, []);

  const { items, setItems, error, refresh, loading } = useAsyncList(fetchVendors, []);
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [selectedVendorIds, setSelectedVendorIds] = useState([]);
  const [action, setAction] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  const selectedCount = selectedVendorIds.length;
  const canApply = selectedCount > 0 && (action === "SUSPEND" || action === "DELETE");
  const selectedSet = useMemo(() => new Set(selectedVendorIds), [selectedVendorIds]);

  if (selectedVendorId) {
    return <VendorProfileAdminScreen vendorId={selectedVendorId} onBack={() => setSelectedVendorId(null)} />;
  }

  const toggleSelect = (vendorId) => {
    setSelectedVendorIds((prev) =>
      prev.includes(vendorId) ? prev.filter((id) => id !== vendorId) : [...prev, vendorId]
    );
  };

  const selectAll = () => {
    setSelectedVendorIds(items.map((v) => v.id));
  };

  const clearSelection = () => {
    setSelectedVendorIds([]);
  };

  const onApply = async () => {
    if (!canApply || isApplying) return;
    const actionLabel = action === "DELETE" ? "delete" : "suspend";
    Alert.alert(
      `Confirm ${actionLabel}`,
      `Apply ${actionLabel} on ${selectedCount} vendor(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Apply",
          style: action === "DELETE" ? "destructive" : "default",
          onPress: async () => {
            setIsApplying(true);
            try {
              const res = await bulkVendorAction(action, selectedVendorIds);
              if (!res?.success) {
                Alert.alert("Failed", "Could not apply action.");
                return;
              }

              setItems((prev) => prev.filter((v) => !selectedSet.has(v.id)));
              setSelectedVendorIds([]);
              setAction("");
              Alert.alert(
                "Success",
                `${res.affectedVendors || 0} vendor(s) updated, ${res.removedListings || 0} listing(s) removed.`
              );
            } catch (e) {
              Alert.alert("Failed", e?.message || "Could not apply action.");
            } finally {
              setIsApplying(false);
            }
          },
        },
      ]
    );
  };

  return (
    <AdminScreenLayout>
      <ScreenTitle title="Onboarded Vendors" subtitle="Approved partners" />
      <View style={styles.bulkPanel}>
        <Text style={styles.bulkTitle}>Bulk Actions</Text>
        <Text style={styles.bulkMeta}>
          {selectedCount} selected
        </Text>
        <View style={styles.choiceRow}>
          <TouchableOpacity
            style={[styles.choiceChip, action === "SUSPEND" && styles.choiceChipActive]}
            onPress={() => setAction("SUSPEND")}
          >
            <Text style={[styles.choiceText, action === "SUSPEND" && styles.choiceTextActive]}>Suspend</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.choiceChip, action === "DELETE" && styles.choiceChipDanger]}
            onPress={() => setAction("DELETE")}
          >
            <Text style={[styles.choiceText, action === "DELETE" && styles.choiceTextActive]}>Delete</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.bulkButtons}>
          <TouchableOpacity style={styles.smallBtn} onPress={selectAll}>
            <Text style={styles.smallBtnText}>Select All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallBtn} onPress={clearSelection}>
            <Text style={styles.smallBtnText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.applyBtn,
              action === "DELETE" && styles.applyBtnDanger,
              (!canApply || isApplying) && styles.applyBtnDisabled,
            ]}
            onPress={onApply}
            disabled={!canApply || isApplying}
          >
            <Text style={styles.applyBtnText}>{isApplying ? "Applying..." : "Apply"}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <SectionHeader title="Active Vendors" />
      {loading && items.length === 0 ? <SkeletonList count={3} /> : null}
      {error && items.length === 0 ? <ErrorState message={error} onRetry={refresh} /> : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState title="No vendors yet" message="Approved vendors will appear here." />
      ) : null}

      {items.map((vendor) => (
        <RowCard
          key={vendor.id}
          title={vendor.name}
          subtitle={`${vendor.city}  •  ${vendor.id}`}
          right={<Badge text={vendor.status} tone="success" />}
          meta={
            <View style={styles.vendorRowMeta}>
              <TouchableOpacity style={styles.checkboxWrap} onPress={() => toggleSelect(vendor.id)}>
                <View style={[styles.checkbox, selectedVendorIds.includes(vendor.id) && styles.checkboxActive]}>
                  {selectedVendorIds.includes(vendor.id) ? <Text style={styles.checkmark}>✓</Text> : null}
                </View>
                <Text style={styles.selectText}>Select</Text>
              </TouchableOpacity>
              <Text style={styles.vendorLink} onPress={() => setSelectedVendorId(vendor.id)}>
                Open profile
              </Text>
            </View>
          }
        />
      ))}
    </AdminScreenLayout>
  );
}

const styles = StyleSheet.create({
  bulkPanel: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
    padding: 12,
    gap: 8,
  },
  bulkTitle: { color: colors.text, fontWeight: "800", fontSize: 14 },
  bulkMeta: { color: colors.muted, fontSize: 12 },
  choiceRow: { flexDirection: "row", gap: 8 },
  choiceChip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  choiceChipActive: {
    borderColor: colors.primary,
    backgroundColor: "#EAF2FF",
  },
  choiceChipDanger: {
    borderColor: colors.danger,
    backgroundColor: "#FFECEC",
  },
  choiceText: { color: colors.muted, fontWeight: "700", fontSize: 12 },
  choiceTextActive: { color: colors.text },
  bulkButtons: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  smallBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  smallBtnText: { color: colors.text, fontWeight: "700", fontSize: 12 },
  applyBtn: {
    borderRadius: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  applyBtnDanger: { backgroundColor: colors.danger },
  applyBtnDisabled: { opacity: 0.45 },
  applyBtnText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  vendorRowMeta: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  checkboxWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: { color: "#fff", fontSize: 12, fontWeight: "800" },
  selectText: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  vendorLink: { color: colors.primary, fontWeight: "700", textDecorationLine: "underline" },
});

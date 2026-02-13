import React, { useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import AdminScreenLayout from "../components/AdminScreenLayout";
import { ScreenTitle, SectionHeader, RowCard, Badge } from "../components/Ui";
import { useAsyncList } from "../services/useAsyncList";
import { getVendors } from "../services/api";
import { ErrorState, SkeletonList, EmptyState } from "../components/StateViews";
import { colors } from "../theme";
import VendorProfileAdminScreen from "./VendorProfileAdminScreen";

export default function OnboardedVendorsScreen() {
  const fetchVendors = useCallback(async () => {
    const data = await getVendors("APPROVED");
    return data.vendors;
  }, []);

  const { items, error, refresh, loading } = useAsyncList(fetchVendors, []);
  const [selectedVendorId, setSelectedVendorId] = React.useState(null);

  if (selectedVendorId) {
    return <VendorProfileAdminScreen vendorId={selectedVendorId} onBack={() => setSelectedVendorId(null)} />;
  }

  return (
    <AdminScreenLayout>
      <ScreenTitle title="Onboarded Vendors" subtitle="Approved partners" />
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
            <View>
              <Text style={styles.vendorLink} onPress={() => setSelectedVendorId(vendor.id)}>
                {vendor.name}
              </Text>
            </View>
          }
        />
      ))}
    </AdminScreenLayout>
  );
}

const styles = StyleSheet.create({
  vendorLink: { color: colors.primary, fontWeight: "700", textDecorationLine: "underline" },
});

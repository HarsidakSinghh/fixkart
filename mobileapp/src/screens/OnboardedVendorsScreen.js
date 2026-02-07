import React, { useCallback } from "react";
import AdminScreenLayout from "../components/AdminScreenLayout";
import { ScreenTitle, SectionHeader, RowCard, Badge } from "../components/Ui";
import { useAsyncList } from "../services/useAsyncList";
import { getVendors } from "../services/api";
import { ErrorState } from "../components/StateViews";

export default function OnboardedVendorsScreen() {
  const fetchVendors = useCallback(async () => {
    const data = await getVendors("APPROVED");
    return data.vendors;
  }, []);

  const { items, error, refresh } = useAsyncList(fetchVendors, []);

  return (
    <AdminScreenLayout>
      <ScreenTitle title="Onboarded Vendors" subtitle="Approved partners" />
      <SectionHeader title="Active Vendors" />
      {error && items.length === 0 ? <ErrorState message={error} onRetry={refresh} /> : null}
      {items.map((vendor) => (
        <RowCard
          key={vendor.id}
          title={vendor.name}
          subtitle={`${vendor.city}  •  ${vendor.id}`}
          right={<Badge text={vendor.status} tone="success" />}
        />
      ))}
    </AdminScreenLayout>
  );
}

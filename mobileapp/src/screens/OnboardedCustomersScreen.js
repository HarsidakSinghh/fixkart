import React, { useCallback } from "react";
import AdminScreenLayout from "../components/AdminScreenLayout";
import { ScreenTitle, SectionHeader, RowCard, Badge } from "../components/Ui";
import { useAsyncList } from "../services/useAsyncList";
import { getCustomers } from "../services/api";
import { ErrorState, SkeletonList, EmptyState } from "../components/StateViews";

export default function OnboardedCustomersScreen() {
  const fetchCustomers = useCallback(async () => {
    const data = await getCustomers("APPROVED");
    return data.customers;
  }, []);

  const { items, error, refresh, loading } = useAsyncList(fetchCustomers, []);

  return (
    <AdminScreenLayout>
      <ScreenTitle title="Onboarded Customers" subtitle="Verified accounts" />
      <SectionHeader title="Active Customers" />
      {loading && items.length === 0 ? <SkeletonList count={3} /> : null}
      {error && items.length === 0 ? <ErrorState message={error} onRetry={refresh} /> : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState title="No customers yet" message="Approved customers will appear here." />
      ) : null}
      {items.map((customer) => (
        <RowCard
          key={customer.id}
          title={customer.name}
          subtitle={`${customer.city}  •  ${customer.id}`}
          right={<Badge text={customer.status} tone="success" />}
        />
      ))}
    </AdminScreenLayout>
  );
}

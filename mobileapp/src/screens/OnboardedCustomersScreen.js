import React, { useCallback } from "react";
import AdminScreenLayout from "../components/AdminScreenLayout";
import { ScreenTitle, SectionHeader, RowCard, Badge } from "../components/Ui";
import { useAsyncList } from "../services/useAsyncList";
import { getCustomers } from "../services/api";

export default function OnboardedCustomersScreen() {
  const fetchCustomers = useCallback(async () => {
    const data = await getCustomers("APPROVED");
    return data.customers;
  }, []);

  const { items } = useAsyncList(fetchCustomers, []);

  return (
    <AdminScreenLayout>
      <ScreenTitle title="Onboarded Customers" subtitle="Verified accounts" />
      <SectionHeader title="Active Customers" />
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

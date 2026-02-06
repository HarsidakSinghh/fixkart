import React, { useCallback } from "react";
import AdminScreenLayout from "../components/AdminScreenLayout";
import { ScreenTitle, SectionHeader, RowCard, Badge, ActionRow } from "../components/Ui";
import { useAsyncList } from "../services/useAsyncList";
import { getCustomers, updateCustomerStatus } from "../services/api";

export default function CustomerApprovalsScreen() {
  const fetchCustomers = useCallback(async () => {
    const data = await getCustomers("PENDING");
    return data.customers;
  }, []);

  const { items, setItems } = useAsyncList(fetchCustomers, []);

  async function updateStatus(id, status) {
    await updateCustomerStatus(id, status);
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  return (
    <AdminScreenLayout>
      <ScreenTitle title="Customer Approvals" subtitle="Pending access" />
      <SectionHeader title="Awaiting Approval" actionLabel="Bulk" />
      {items.map((customer) => (
        <RowCard
          key={customer.id}
          title={customer.name}
          subtitle={`${customer.city}  •  ${customer.id}`}
          right={<Badge text={customer.status} tone={statusTone(customer.status)} />}
          meta={
            <ActionRow
              secondaryLabel="Reject"
              primaryLabel="Approve"
              onSecondary={() => updateStatus(customer.id, "REJECTED")}
              onPrimary={() => updateStatus(customer.id, "APPROVED")}
            />
          }
        />
      ))}
    </AdminScreenLayout>
  );
}

function statusTone(status) {
  if (status === "PENDING") return "warning";
  if (status === "APPROVED") return "success";
  if (status === "REJECTED") return "danger";
  return "info";
}

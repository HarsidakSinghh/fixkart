import React, { useCallback } from "react";
import AdminScreenLayout from "../components/AdminScreenLayout";
import { ScreenTitle, SectionHeader, RowCard, Badge, ActionRow } from "../components/Ui";
import { useAsyncList } from "../services/useAsyncList";
import { getInventoryApprovals, approveProduct, rejectProduct } from "../services/api";
import { ErrorState } from "../components/StateViews";

export default function InventoryApprovalsScreen() {
  const fetchInventoryApprovals = useCallback(async () => {
    const data = await getInventoryApprovals();
    return data.products;
  }, []);

  const { items, setItems, error, refresh } = useAsyncList(fetchInventoryApprovals, []);

  async function updateStatus(id, status) {
    if (status === "APPROVED") await approveProduct(id);
    if (status === "REJECTED") await rejectProduct(id);
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  return (
    <AdminScreenLayout>
      <ScreenTitle title="Inventory Approvals" subtitle="Pending listings" />
      <SectionHeader title="Awaiting Review" actionLabel="Bulk" />
      {error && items.length === 0 ? <ErrorState message={error} onRetry={refresh} /> : null}
      {items.map((item) => (
        <RowCard
          key={item.id}
          title={item.item}
          subtitle={`${item.vendor}  •  ${item.id}`}
          right={<Badge text={item.status} tone={statusTone(item.status)} />}
          meta={
            <ActionRow
              secondaryLabel="Reject"
              primaryLabel="Approve"
              onSecondary={() => updateStatus(item.id, "REJECTED")}
              onPrimary={() => updateStatus(item.id, "APPROVED")}
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

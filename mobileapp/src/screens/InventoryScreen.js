import React, { useCallback } from "react";
import AdminScreenLayout from "../components/AdminScreenLayout";
import { ScreenTitle, SectionHeader, RowCard, Badge } from "../components/Ui";
import { useAsyncList } from "../services/useAsyncList";
import { getInventory } from "../services/api";
import { ErrorState } from "../components/StateViews";

export default function InventoryScreen() {
  const fetchInventory = useCallback(async () => {
    const data = await getInventory();
    return data.inventory;
  }, []);

  const { items, error, refresh } = useAsyncList(fetchInventory, []);

  return (
    <AdminScreenLayout>
      <ScreenTitle title="Inventory" subtitle="Warehouse status" />
      <SectionHeader title="Stock Watch" />
      {error && items.length === 0 ? <ErrorState message={error} onRetry={refresh} /> : null}
      {items.map((item) => (
        <RowCard
          key={item.id}
          title={item.item}
          subtitle={`${item.warehouse}  •  ${item.id}`}
          right={<Badge text={item.status} tone={statusTone(item.status)} />}
        />
      ))}
    </AdminScreenLayout>
  );
}

function statusTone(status) {
  if (status === "OK") return "success";
  if (status === "LOW") return "warning";
  if (status === "CRITICAL") return "danger";
  return "info";
}

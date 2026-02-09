import React, { useCallback } from "react";
import AdminScreenLayout from "../components/AdminScreenLayout";
import { ScreenTitle, SectionHeader, RowCard, Badge, ActionRow } from "../components/Ui";
import { useAsyncList } from "../services/useAsyncList";
import { getProducts, approveProduct, rejectProduct } from "../services/api";
import { ErrorState, SkeletonList, EmptyState } from "../components/StateViews";

export default function ProductsScreen() {
  const fetchProducts = useCallback(async () => {
    const data = await getProducts();
    return data.products;
  }, []);

  const { items, setItems, error, refresh, loading } = useAsyncList(fetchProducts, []);

  async function updateStatus(id, status) {
    if (status === "APPROVED") await approveProduct(id);
    if (status === "REJECTED") await rejectProduct(id);
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  return (
    <AdminScreenLayout>
      <ScreenTitle title="Products" subtitle="Catalog control" />
      <SectionHeader title="Latest Updates" actionLabel="Add" />
      {loading && items.length === 0 ? <SkeletonList count={3} /> : null}
      {error && items.length === 0 ? <ErrorState message={error} onRetry={refresh} /> : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState title="No products yet" message="Catalog updates will appear here." />
      ) : null}
      {items.map((item) => (
        <RowCard
          key={item.id}
          title={item.name}
          subtitle={`${item.vendor}  •  Stock ${item.stock}`}
          right={<Badge text={item.status} tone={statusTone(item.status)} />}
          meta={
            <ActionRow
              secondaryLabel="Reject"
              primaryLabel="Publish"
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
  if (status === "APPROVED") return "success";
  if (status === "PENDING") return "warning";
  if (status === "REJECTED") return "danger";
  return "info";
}

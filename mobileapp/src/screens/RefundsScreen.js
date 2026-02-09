import React, { useCallback } from "react";
import AdminScreenLayout from "../components/AdminScreenLayout";
import { ScreenTitle, SectionHeader, RowCard, ActionRow } from "../components/Ui";
import { useAsyncList } from "../services/useAsyncList";
import { getRefunds, updateRefundStatus } from "../services/api";
import { ErrorState, SkeletonList, EmptyState } from "../components/StateViews";
import StatusPill from "../components/StatusPill";

export default function RefundsScreen() {
  const fetchRefunds = useCallback(async () => {
    const data = await getRefunds();
    return data.refunds;
  }, []);

  const { items, setItems, error, refresh, loading } = useAsyncList(fetchRefunds, []);

  async function updateStatus(id, status) {
    await updateRefundStatus(id, status);
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  const pending = items.filter((i) => i.status !== "APPROVED");
  const issued = items.filter((i) => i.status === "APPROVED");

  return (
    <AdminScreenLayout>
      <ScreenTitle title="Refunds" subtitle="Finance desk" />
      <SectionHeader title="Refund Queue" actionLabel="Export" />
      {loading && items.length === 0 ? <SkeletonList count={4} /> : null}
      {error && items.length === 0 ? <ErrorState message={error} onRetry={refresh} /> : null}
      {!loading && !error && pending.length === 0 ? (
        <EmptyState title="No pending refunds" message="Refund requests will show here." />
      ) : null}
      {pending.map((item) => (
        <RowCard
          key={item.id}
          title={`₹${item.amount}`}
          subtitle={`${item.orderId}  •  ${item.id}`}
          right={<StatusPill label={item.status} tone={statusTone(item.status)} />}
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

      <SectionHeader title="Issued Refunds" />
      {!loading && !error && issued.length === 0 ? (
        <EmptyState title="No issued refunds" message="Approved refunds will appear here." />
      ) : null}
      {issued.map((item) => (
        <RowCard
          key={item.id}
          title={`₹${item.amount}`}
          subtitle={`${item.orderId}  •  ${item.id}`}
          right={<StatusPill label="APPROVED" tone="success" />}
        />
      ))}
    </AdminScreenLayout>
  );
}

function statusTone(status) {
  if (status === "APPROVED") return "success";
  if (status === "PENDING") return "warning";
  return "info";
}

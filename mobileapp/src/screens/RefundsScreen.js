import React, { useCallback } from "react";
import AdminScreenLayout from "../components/AdminScreenLayout";
import { ScreenTitle, SectionHeader, RowCard, Badge, ActionRow } from "../components/Ui";
import { useAsyncList } from "../services/useAsyncList";
import { getRefunds, updateRefundStatus } from "../services/api";

export default function RefundsScreen() {
  const fetchRefunds = useCallback(async () => {
    const data = await getRefunds();
    return data.refunds;
  }, []);

  const { items, setItems } = useAsyncList(fetchRefunds, []);

  async function updateStatus(id, status) {
    await updateRefundStatus(id, status);
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  return (
    <AdminScreenLayout>
      <ScreenTitle title="Refunds" subtitle="Finance desk" />
      <SectionHeader title="Refund Queue" actionLabel="Export" />
      {items.map((item) => (
        <RowCard
          key={item.id}
          title={`₹${item.amount}`}
          subtitle={`${item.orderId}  •  ${item.id}`}
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
  if (status === "APPROVED") return "success";
  if (status === "PENDING") return "warning";
  return "info";
}

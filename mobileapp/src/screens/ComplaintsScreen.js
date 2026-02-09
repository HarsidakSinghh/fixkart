import React, { useCallback } from "react";
import AdminScreenLayout from "../components/AdminScreenLayout";
import { ScreenTitle, SectionHeader, RowCard, ActionRow } from "../components/Ui";
import { useAsyncList } from "../services/useAsyncList";
import { getComplaints, updateComplaintStatus } from "../services/api";
import { Linking, Text } from "react-native";
import { ErrorState, SkeletonList, EmptyState } from "../components/StateViews";
import StatusPill from "../components/StatusPill";

export default function ComplaintsScreen() {
  const fetchComplaints = useCallback(async () => {
    const data = await getComplaints();
    return data.complaints;
  }, []);

  const { items, setItems, error, refresh, loading } = useAsyncList(fetchComplaints, []);

  async function updateStatus(id, status) {
    await updateComplaintStatus(id, status);
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  return (
    <AdminScreenLayout>
      <ScreenTitle title="Complaints" subtitle="Customer escalations" />
      <SectionHeader title="Open Tickets" actionLabel="Assign" />
      {loading && items.length === 0 ? <SkeletonList count={4} /> : null}
      {error && items.length === 0 ? <ErrorState message={error} onRetry={refresh} /> : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState title="No complaints" message="Customer complaints will show here." />
      ) : null}
      {items.map((item) => (
        <RowCard
          key={item.id}
          title={item.customerName || "Customer"}
          subtitle={`${item.orderId || "—"}  •  ${item.message}`}
          right={<StatusPill label={item.status || "OPEN"} tone={statusTone(item.status)} />}
          meta={
            <>
              {item.imageUrl ? (
                <Text
                  style={{ color: "#6FA8FF", fontSize: 12, marginBottom: 6 }}
                  onPress={() => Linking.openURL(item.imageUrl)}
                >
                  View attachment
                </Text>
              ) : null}
              <ActionRow
                secondaryLabel="Resolve"
                primaryLabel="In Review"
                onSecondary={() => updateStatus(item.id, "RESOLVED")}
                onPrimary={() => updateStatus(item.id, "IN_REVIEW")}
              />
            </>
          }
        />
      ))}
    </AdminScreenLayout>
  );
}

function statusTone(status) {
  if (status === "RESOLVED") return "success";
  if (status === "IN_REVIEW") return "warning";
  return "danger";
}

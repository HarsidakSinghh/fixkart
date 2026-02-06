import React, { useCallback } from "react";
import AdminScreenLayout from "../components/AdminScreenLayout";
import { ScreenTitle, SectionHeader, RowCard, Badge, ActionRow } from "../components/Ui";
import { useAsyncList } from "../services/useAsyncList";
import { getComplaints, updateComplaintStatus } from "../services/api";

export default function ComplaintsScreen() {
  const fetchComplaints = useCallback(async () => {
    const data = await getComplaints();
    return data.complaints;
  }, []);

  const { items, setItems } = useAsyncList(fetchComplaints, []);

  async function updateStatus(id, status) {
    await updateComplaintStatus(id, status);
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  return (
    <AdminScreenLayout>
      <ScreenTitle title="Complaints" subtitle="Customer escalations" />
      <SectionHeader title="Open Tickets" actionLabel="Assign" />
      {items.map((item) => (
        <RowCard
          key={item.id}
          title={item.subject}
          subtitle={`${item.id}`}
          right={<Badge text={item.priority} tone={priorityTone(item.priority)} />}
          meta={
            <ActionRow
              secondaryLabel="Resolve"
              primaryLabel="In Review"
              onSecondary={() => updateStatus(item.id, "RESOLVED")}
              onPrimary={() => updateStatus(item.id, "IN_REVIEW")}
            />
          }
        />
      ))}
    </AdminScreenLayout>
  );
}

function priorityTone(priority) {
  if (priority === "HIGH") return "danger";
  if (priority === "MEDIUM") return "warning";
  return "info";
}

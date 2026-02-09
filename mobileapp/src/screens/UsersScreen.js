import React, { useCallback } from "react";
import AdminScreenLayout from "../components/AdminScreenLayout";
import { ScreenTitle, SectionHeader, RowCard, Badge, Pill, ActionRow } from "../components/Ui";
import { useAsyncList } from "../services/useAsyncList";
import { getUsers, updateUserStatus } from "../services/api";
import { ErrorState, SkeletonList, EmptyState } from "../components/StateViews";

export default function UsersScreen() {
  const fetchUsers = useCallback(async () => {
    const data = await getUsers();
    return data.users;
  }, []);

  const { items, setItems, error, refresh, loading } = useAsyncList(fetchUsers, []);

  async function updateStatus(id, status) {
    await updateUserStatus(id, status);
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  return (
    <AdminScreenLayout>
      <ScreenTitle title="Admin Users" subtitle="Access control" />
      <SectionHeader title="Team Members" />
      {loading && items.length === 0 ? <SkeletonList count={3} /> : null}
      {error && items.length === 0 ? <ErrorState message={error} onRetry={refresh} /> : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState title="No admins yet" message="Admin users will appear here." />
      ) : null}
      {items.map((user) => (
        <RowCard
          key={user.id}
          title={user.name}
          subtitle={`${user.role}  •  ${user.id}`}
          right={<Badge text={user.status} tone={user.status === "ACTIVE" ? "success" : "danger"} />}
          meta={
            <>
              <Pill text="Invite Sent" tone="info" />
              <ActionRow
                secondaryLabel="Suspend"
                primaryLabel="Activate"
                onSecondary={() => updateStatus(user.id, "SUSPENDED")}
                onPrimary={() => updateStatus(user.id, "ACTIVE")}
              />
            </>
          }
        />
      ))}
    </AdminScreenLayout>
  );
}

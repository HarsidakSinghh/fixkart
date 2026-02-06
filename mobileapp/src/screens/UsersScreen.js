import React, { useCallback } from "react";
import AdminScreenLayout from "../components/AdminScreenLayout";
import { ScreenTitle, SectionHeader, RowCard, Badge, Pill, ActionRow } from "../components/Ui";
import { useAsyncList } from "../services/useAsyncList";
import { getUsers, updateUserStatus } from "../services/api";

export default function UsersScreen() {
  const fetchUsers = useCallback(async () => {
    const data = await getUsers();
    return data.users;
  }, []);

  const { items, setItems } = useAsyncList(fetchUsers, []);

  async function updateStatus(id, status) {
    await updateUserStatus(id, status);
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  return (
    <AdminScreenLayout>
      <ScreenTitle title="Admin Users" subtitle="Access control" />
      <SectionHeader title="Team Members" />
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

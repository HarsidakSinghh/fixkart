import React from "react";
import AdminScreenLayout from "../components/AdminScreenLayout";
import { ScreenTitle, SectionHeader, ListItem } from "../components/Ui";

export default function MoreScreen({ routes, onNavigate }) {
  return (
    <AdminScreenLayout>
      <ScreenTitle title="Admin Sections" subtitle="Jump to module" />
      <SectionHeader title="Management" />
      {routes.map((route) => (
        <ListItem
          key={route.key}
          title={route.label}
          subtitle={route.subtitle}
          icon={route.icon}
          onPress={() => onNavigate(route.key)}
        />
      ))}
    </AdminScreenLayout>
  );
}

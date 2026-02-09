import React, { useCallback, useState } from "react";
import AdminScreenLayout from "../components/AdminScreenLayout";
import { ScreenTitle, SectionHeader, RowCard, Badge, ActionRow } from "../components/Ui";
import { useAsyncList } from "../services/useAsyncList";
import { getSalesmen, getSalesmanDetail } from "../services/salesmanAdminApi";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing } from "../theme";
import { ErrorState, SkeletonList, EmptyState } from "../components/StateViews";

export default function SalesmenScreen() {
  const fetchSalesmen = useCallback(async () => {
    return await getSalesmen();
  }, []);

  const { items, error, refresh, loading } = useAsyncList(fetchSalesmen, []);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);

  const loadDetail = async (id) => {
    setSelected(id);
    const data = await getSalesmanDetail(id);
    setDetail(data);
  };

  return (
    <AdminScreenLayout>
      <ScreenTitle title="Salesmen" subtitle="Field team visibility" />
      <SectionHeader title="Registered Salesmen" />
      {loading && items.length === 0 ? <SkeletonList count={3} /> : null}
      {error && items.length === 0 ? <ErrorState message={error} onRetry={refresh} /> : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState title="No salesmen yet" message="Registered salesmen will show here." />
      ) : null}
      {items.map((s) => (
        <RowCard
          key={s.id}
          title={s.name || "Salesman"}
          subtitle={`${s.phone}  •  ${s.code}`}
          right={<Badge text={s.status || "ACTIVE"} tone={s.status === "ACTIVE" ? "success" : "warning"} />}
          meta={
            <ActionRow
              primaryLabel="View Details"
              onPrimary={() => loadDetail(s.id)}
            />
          }
        />
      ))}

      {detail && selected ? (
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>{detail.salesman?.name}</Text>
          <Text style={styles.detailMeta}>Phone: {detail.salesman?.phone}</Text>
          <Text style={styles.detailMeta}>Code: {detail.salesman?.code}</Text>
          <Text style={styles.detailMeta}>Status: {detail.salesman?.status}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Visits</Text>
              <Text style={styles.statValue}>{detail.stats?.visitsCompleted || 0}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Day Starts</Text>
              <Text style={styles.statValue}>{detail.stats?.dayStarts || 0}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Day Ends</Text>
              <Text style={styles.statValue}>{detail.stats?.dayEnds || 0}</Text>
            </View>
          </View>

          <Text style={styles.logTitle}>Recent Activity</Text>
          {detail.logs?.map((l) => (
            <View key={l.id} style={styles.logRow}>
              <Text style={styles.logEvent}>{l.event}</Text>
              <Text style={styles.logMeta}>{new Date(l.createdAt).toLocaleString()}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </AdminScreenLayout>
  );
}

const styles = StyleSheet.create({
  detailCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    marginTop: spacing.lg,
  },
  detailTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  detailMeta: { color: colors.muted, marginTop: 4 },
  statsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  statBox: {
    flex: 1,
    backgroundColor: colors.panelAlt,
    borderRadius: 14,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
  },
  statLabel: { color: colors.muted, fontSize: 11 },
  statValue: { color: colors.text, fontWeight: "700", fontSize: 16, marginTop: 6 },
  logTitle: { marginTop: spacing.md, fontWeight: "700", color: colors.text },
  logRow: { marginTop: spacing.sm },
  logEvent: { color: colors.text, fontWeight: "600" },
  logMeta: { color: colors.muted, fontSize: 11 },
});

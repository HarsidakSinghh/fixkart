import React, { useCallback, useState } from "react";
import AdminScreenLayout from "../components/AdminScreenLayout";
import { ScreenTitle, SectionHeader, RowCard, Badge, ActionRow } from "../components/Ui";
import { useAsyncList } from "../services/useAsyncList";
import { getSalesmen, getSalesmanDetail } from "../services/salesmanAdminApi";
import SalesmanTrackScreen from "./SalesmanTrackScreen";
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, ScrollView } from "react-native";
import { colors, spacing } from "../theme";
import { ErrorState, SkeletonList, EmptyState } from "../components/StateViews";

export default function SalesmenScreen() {
  const fetchSalesmen = useCallback(async () => {
    return await getSalesmen();
  }, []);

  const { items, error, refresh, loading } = useAsyncList(fetchSalesmen, []);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [trackSalesman, setTrackSalesman] = useState(null);

  const loadDetail = async (id) => {
    setSelected(id);
    const data = await getSalesmanDetail(id);
    setDetail(data);
  };

  if (trackSalesman) {
    return <SalesmanTrackScreen salesman={trackSalesman} onBack={() => setTrackSalesman(null)} />;
  }

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
          subtitle={`${s.phone}  •  ${s.code}${s.vendorName ? `  •  ${s.vendorName}` : ""}`}
          right={<Badge text={s.status || "ACTIVE"} tone={s.status === "ACTIVE" ? "success" : "warning"} />}
          meta={
            <ActionRow
              primaryLabel="View Details"
              onPrimary={() => loadDetail(s.id)}
              secondaryLabel="Track"
              onSecondary={() => setTrackSalesman(s)}
            />
          }
        />
      ))}

      {detail && selected ? (
        <Modal visible transparent animationType="slide" onRequestClose={() => { setDetail(null); setSelected(null); }}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Salesman Details</Text>
                <TouchableOpacity onPress={() => { setDetail(null); setSelected(null); }}>
                  <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.detailTitle}>{detail.salesman?.name}</Text>
                <Text style={styles.detailMeta}>Phone: {detail.salesman?.phone}</Text>
                <Text style={styles.detailMeta}>Code: {detail.salesman?.code}</Text>
                <Text style={styles.detailMeta}>Status: {detail.salesman?.status}</Text>
                {detail.salesman?.vendorName ? (
                  <Text style={styles.detailMeta}>Vendor: {detail.salesman?.vendorName}</Text>
                ) : null}

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

                <Text style={styles.logTitle}>ID Proof</Text>
                {detail.salesman?.idProofUrl ? (
                  <Image source={{ uri: detail.salesman.idProofUrl }} style={styles.idProofImage} />
                ) : (
                  <Text style={styles.logMeta}>No ID proof uploaded.</Text>
                )}

                <Text style={styles.logTitle}>Recent 3 Visits</Text>
                {(detail.recentVisits || []).length ? (
                  detail.recentVisits.map((visit) => (
                    <View key={visit.id} style={styles.visitCard}>
                      <Text style={styles.logEvent}>{visit.companyName || "Visit"}</Text>
                      {visit.companyAddress ? <Text style={styles.logMeta}>{visit.companyAddress}</Text> : null}
                      {visit.note ? <Text style={styles.logMeta}>{visit.note}</Text> : null}
                      <Text style={styles.logMeta}>{new Date(visit.createdAt).toLocaleString()}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.logMeta}>No visits logged yet.</Text>
                )}

                <Text style={styles.logTitle}>Recent Activity</Text>
                {detail.logs?.map((l) => (
                  <View key={l.id} style={styles.logRow}>
                    <Text style={styles.logEvent}>{l.event}</Text>
                    <Text style={styles.logMeta}>{new Date(l.createdAt).toLocaleString()}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      ) : null}
    </AdminScreenLayout>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
    maxHeight: "88%",
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  modalTitle: { color: colors.text, fontSize: 17, fontWeight: "800" },
  closeText: { color: colors.primary, fontWeight: "700" },
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
  idProofImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panelAlt,
  },
  visitCard: {
    backgroundColor: colors.panelAlt,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  logRow: { marginTop: spacing.sm },
  logEvent: { color: colors.text, fontWeight: "600" },
  logMeta: { color: colors.muted, fontSize: 11 },
});

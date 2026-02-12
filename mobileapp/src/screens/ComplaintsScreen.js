import React, { useCallback } from "react";
import AdminScreenLayout from "../components/AdminScreenLayout";
import { ScreenTitle, SectionHeader, RowCard, ActionRow } from "../components/Ui";
import { useAsyncList } from "../services/useAsyncList";
import { getComplaints, updateComplaintStatus } from "../services/api";
import { Linking, Text, View, Modal, TouchableOpacity, ScrollView, StyleSheet, Image } from "react-native";
import { ErrorState, SkeletonList, EmptyState } from "../components/StateViews";
import StatusPill from "../components/StatusPill";
import { colors, spacing } from "../theme";

export default function ComplaintsScreen() {
  const getComplaintImages = (complaint) => {
    if (Array.isArray(complaint?.imageUrls) && complaint.imageUrls.length) return complaint.imageUrls;
    if (complaint?.imageUrl) return [complaint.imageUrl];
    return [];
  };

  const fetchComplaints = useCallback(async () => {
    const data = await getComplaints();
    return data.complaints;
  }, []);

  const { items, setItems, error, refresh, loading } = useAsyncList(fetchComplaints, []);
  const [selectedComplaint, setSelectedComplaint] = React.useState(null);

  async function updateStatus(id, status) {
    await updateComplaintStatus(id, status);
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  const pending = items.filter((i) => {
    const s = String(i.status || "OPEN").toUpperCase();
    return s === "OPEN" || s === "PENDING";
  });
  const inReview = items.filter((i) => String(i.status || "").toUpperCase() === "IN_REVIEW");
  const resolved = items.filter((i) => String(i.status || "").toUpperCase() === "RESOLVED");

  return (
    <AdminScreenLayout>
      <ScreenTitle title="Complaints" subtitle="Customer escalations" />
      <SectionHeader title="Pending Complaints" actionLabel="Assign" />
      {loading && items.length === 0 ? <SkeletonList count={4} /> : null}
      {error && items.length === 0 ? <ErrorState message={error} onRetry={refresh} /> : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState title="No complaints" message="Customer complaints will show here." />
      ) : null}
      {pending.map((item) => (
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
                  onPress={() => {
                    const urls = getComplaintImages(item);
                    if (urls[0]) Linking.openURL(urls[0]);
                  }}
                >
                  View attachment{getComplaintImages(item).length > 1 ? `s (${getComplaintImages(item).length})` : ""}
                </Text>
              ) : null}
              <ActionRow
                secondaryLabel="View Details"
                primaryLabel="In Review"
                onSecondary={() => setSelectedComplaint(item)}
                onPrimary={() => updateStatus(item.id, "IN_REVIEW")}
              />
            </>
          }
        />
      ))}

      <SectionHeader title="In Review" />
      {!loading && !error && inReview.length === 0 ? (
        <EmptyState title="No complaints in review" message="Items marked in review appear here." />
      ) : null}
      {inReview.map((item) => (
        <RowCard
          key={item.id}
          title={item.customerName || "Customer"}
          subtitle={`${item.orderId || "—"}  •  ${item.message}`}
          right={<StatusPill label={item.status || "IN_REVIEW"} tone={statusTone(item.status)} />}
          meta={
            <ActionRow
              secondaryLabel="View Details"
              primaryLabel="Resolved"
              onSecondary={() => setSelectedComplaint(item)}
              onPrimary={() => updateStatus(item.id, "RESOLVED")}
            />
          }
        />
      ))}

      <SectionHeader title="Resolved" />
      {!loading && !error && resolved.length === 0 ? (
        <EmptyState title="No resolved complaints" message="Resolved complaints appear here." />
      ) : null}
      {resolved.map((item) => (
        <RowCard
          key={item.id}
          title={item.customerName || "Customer"}
          subtitle={`${item.orderId || "—"}  •  ${item.message}`}
          right={<StatusPill label="RESOLVED" tone="success" />}
          meta={
            <ActionRow
              secondaryLabel="View Details"
              onSecondary={() => setSelectedComplaint(item)}
            />
          }
        />
      ))}

      {selectedComplaint ? (
        <Modal visible transparent animationType="slide" onRequestClose={() => setSelectedComplaint(null)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Complaint Detail</Text>
                <TouchableOpacity onPress={() => setSelectedComplaint(null)}>
                  <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.metaText}>Customer: {selectedComplaint.customerName || "Customer"}</Text>
                {selectedComplaint.customerPhone ? <Text style={styles.metaText}>Phone: {selectedComplaint.customerPhone}</Text> : null}
                <Text style={styles.metaText}>Order: {selectedComplaint.orderId || "-"}</Text>
                <Text style={styles.metaText}>Status: {selectedComplaint.status || "OPEN"}</Text>
                {selectedComplaint.createdAt ? (
                  <Text style={styles.metaText}>Time: {new Date(selectedComplaint.createdAt).toLocaleString()}</Text>
                ) : null}
                <Text style={styles.noteTitle}>Note</Text>
                <Text style={styles.noteText}>{selectedComplaint.message || selectedComplaint.subject || "-"}</Text>
                {getComplaintImages(selectedComplaint).length ? (
                  <View>
                    <Text style={styles.noteTitle}>Attachments ({getComplaintImages(selectedComplaint).length})</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
                      {getComplaintImages(selectedComplaint).map((url, index) => (
                        <TouchableOpacity key={`${url}-${index}`} onPress={() => Linking.openURL(url)}>
                          <Image source={{ uri: url }} style={styles.attachmentImage} />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <Text style={styles.linkText}>Tap any image to open full size</Text>
                  </View>
                ) : (
                  <Text style={styles.metaText}>No image attached.</Text>
                )}
              </ScrollView>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.resolveBtn}
                  onPress={async () => {
                    await updateStatus(selectedComplaint.id, "RESOLVED");
                    setSelectedComplaint(null);
                  }}
                >
                  <Text style={styles.resolveText}>Mark Resolved</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.reviewBtn}
                  onPress={async () => {
                    await updateStatus(selectedComplaint.id, "IN_REVIEW");
                    setSelectedComplaint(null);
                  }}
                >
                  <Text style={styles.reviewText}>Mark In Review</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </AdminScreenLayout>
  );
}

function statusTone(status) {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "RESOLVED") return "success";
  if (normalized === "IN_REVIEW") return "warning";
  return "danger";
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    maxHeight: "88%",
    padding: spacing.lg,
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: "800" },
  closeText: { color: colors.primary, fontWeight: "700" },
  metaText: { color: colors.muted, fontSize: 12, marginTop: 6 },
  noteTitle: { color: colors.text, fontWeight: "700", marginTop: spacing.md },
  noteText: { color: colors.text, marginTop: 6, fontSize: 13 },
  attachmentImage: {
    marginTop: spacing.sm,
    width: 140,
    height: 140,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panelAlt,
    marginRight: spacing.sm,
  },
  imageRow: { marginTop: spacing.sm, paddingBottom: 4 },
  linkText: { color: colors.info, marginTop: 6, fontWeight: "700", fontSize: 12 },
  modalActions: { marginTop: spacing.sm, flexDirection: "row", gap: spacing.sm },
  resolveBtn: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    paddingVertical: 11,
  },
  resolveText: { color: colors.text, fontWeight: "700" },
  reviewBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 11,
  },
  reviewText: { color: "#FFFFFF", fontWeight: "700" },
});

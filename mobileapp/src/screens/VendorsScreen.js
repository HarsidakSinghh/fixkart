import React, { useCallback } from "react";
import AdminScreenLayout from "../components/AdminScreenLayout";
import { ScreenTitle, SectionHeader, RowCard, Badge, ActionRow } from "../components/Ui";
import { useAsyncList } from "../services/useAsyncList";
import { getVendors, updateVendorStatus, getVendorDetail } from "../services/api";
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking } from "react-native";
import { colors, spacing } from "../theme";
import { ErrorState } from "../components/StateViews";

export default function VendorsScreen() {
  const fetchVendors = useCallback(async () => {
    const data = await getVendors("PENDING");
    return data.vendors;
  }, []);

  const { items, setItems, error, refresh } = useAsyncList(fetchVendors, []);
  const [detail, setDetail] = React.useState(null);

  async function updateStatus(id, status) {
    await updateVendorStatus(id, status);
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  async function loadDetail(id) {
    const data = await getVendorDetail(id);
    setDetail(data.vendor);
  }

  return (
    <AdminScreenLayout>
      <ScreenTitle title="Vendors" subtitle="Partner management" />
      <SectionHeader title="Pending & Active" actionLabel="Invite" />
      {error && items.length === 0 ? <ErrorState message={error} onRetry={refresh} /> : null}
      {items.map((vendor) => (
        <RowCard
          key={vendor.id}
          title={vendor.name}
          subtitle={`${vendor.city}  •  ${vendor.id}`}
          right={<Badge text={vendor.status} tone={statusTone(vendor.status)} />}
          meta={
            <ActionRow
              secondaryLabel="Details"
              primaryLabel={vendor.status === "PENDING" ? "Approve" : "Activate"}
              onSecondary={() => loadDetail(vendor.id)}
              onPrimary={() => updateStatus(vendor.id, "APPROVED")}
            />
          }
        />
      ))}

      {detail ? (
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailTitle}>{detail.companyName || detail.fullName}</Text>
              <Text style={styles.detailMeta}>{detail.email} • {detail.phone}</Text>
              <Text style={styles.detailMeta}>{detail.address}, {detail.city}, {detail.state} {detail.postalCode}</Text>
            </View>
            <Badge text={detail.status} tone={statusTone(detail.status)} />
          </View>

          <Text style={styles.sectionLabel}>Business</Text>
          <Text style={styles.detailMeta}>
            GST: {detail.gstNumber || "N/A"} • {detail.idProofType || "ID"}: {detail.idProofNumber || "N/A"}
          </Text>
          <Text style={styles.detailMeta}>Category: {detail.category || "N/A"}</Text>

          <Text style={styles.sectionLabel}>Bank</Text>
          <Text style={styles.detailMeta}>{detail.bankName || "N/A"}</Text>
          <Text style={styles.detailMeta}>A/C: {detail.accountNumber || "N/A"} • IFSC: {detail.ifscCode || "N/A"}</Text>

          <Text style={styles.sectionLabel}>Documents</Text>
          <View style={styles.docRow}>
            {detail.gstCertificateUrl ? <DocPreview label="GST" uri={detail.gstCertificateUrl} /> : null}
            {detail.panCardUrl ? <DocPreview label="PAN" uri={detail.panCardUrl} /> : null}
            {detail.idProofUrl ? <DocPreview label="ID Proof" uri={detail.idProofUrl} /> : null}
            {detail.locationPhotoUrl ? <DocPreview label="Location" uri={detail.locationPhotoUrl} /> : null}
            {!detail.gstCertificateUrl &&
            !detail.panCardUrl &&
            !detail.idProofUrl &&
            !detail.locationPhotoUrl ? (
              <Text style={styles.detailMeta}>No documents uploaded.</Text>
            ) : null}
          </View>

          <ActionRow
            secondaryLabel="Reject"
            primaryLabel="Approve"
            onSecondary={() => updateStatus(detail.id, "REJECTED")}
            onPrimary={() => updateStatus(detail.id, "APPROVED")}
          />
        </View>
      ) : null}
    </AdminScreenLayout>
  );
}

function statusTone(status) {
  if (status === "APPROVED") return "success";
  if (status === "PENDING") return "warning";
  if (status === "SUSPENDED") return "danger";
  return "info";
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
  detailHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  detailTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  detailMeta: { color: colors.muted, fontSize: 12, marginTop: 4 },
  sectionLabel: { marginTop: spacing.md, color: colors.text, fontWeight: "700" },
  docRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm },
  docCard: {
    width: 98,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: spacing.xs,
    backgroundColor: colors.panelAlt,
  },
  docImage: { width: "100%", height: 70, borderRadius: 8, backgroundColor: colors.panelAlt },
  docPlaceholder: {
    width: "100%",
    height: 70,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
  },
  docLabel: { marginTop: 6, fontSize: 11, color: colors.muted, fontWeight: "600" },
  docAction: { marginTop: 4, fontSize: 11, color: colors.primary, fontWeight: "700" },
});

function DocPreview({ uri, label }) {
  const isPdf = uri?.includes("application/pdf") || uri?.toLowerCase().endsWith(".pdf");
  return (
    <TouchableOpacity
      style={styles.docCard}
      onPress={() => Linking.openURL(uri)}
    >
      {isPdf ? (
        <View style={styles.docPlaceholder}>
          <Text style={styles.docLabel}>PDF</Text>
        </View>
      ) : (
        <Image source={{ uri }} style={styles.docImage} />
      )}
      <Text style={styles.docLabel}>{label}</Text>
      <Text style={styles.docAction}>View</Text>
    </TouchableOpacity>
  );
}

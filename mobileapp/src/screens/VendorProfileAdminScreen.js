import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking, ScrollView, ActivityIndicator, Alert } from "react-native";
import AdminScreenLayout from "../components/AdminScreenLayout";
import { ScreenTitle, SectionHeader, RowCard, Badge, StatCard } from "../components/Ui";
import { ErrorState, SkeletonList } from "../components/StateViews";
import { colors, spacing } from "../theme";
import { getVendorDetail, getOrders, getRefunds, getComplaints, verifyVendorGstPreview, saveVendorGstVerification } from "../services/api";
import { useAsyncList } from "../services/useAsyncList";

export default function VendorProfileAdminScreen({ vendorId, onBack }) {
  const fetchVendorProfile = useCallback(async () => {
    if (!vendorId) return null;
    const [vendorRes, ordersRes, refundsRes, complaintsRes] = await Promise.all([
      getVendorDetail(vendorId),
      getOrders(),
      getRefunds(),
      getComplaints(),
    ]);
    const vendor = vendorRes.vendor || null;
    const orders = Array.isArray(ordersRes?.orders) ? ordersRes.orders : [];
    const refunds = Array.isArray(refundsRes?.refunds) ? refundsRes.refunds : [];
    const complaints = Array.isArray(complaintsRes?.complaints) ? complaintsRes.complaints : [];
    if (!vendor) return null;

    const canonicalVendorId = vendor.userId || vendor.id;
    const vendorOrderRows = [];
    const excludedStatuses = new Set(["REJECTED", "CANCELLED"]);

    for (const order of orders) {
      const orderStatus = String(order.status || "").toUpperCase();
      if (excludedStatuses.has(orderStatus)) continue;

      const matchingItems = (order.items || []).filter((item) => item.vendorId === canonicalVendorId);
      if (!matchingItems.length) continue;
      const rowRevenue = matchingItems.reduce(
        (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
        0
      );
      const rowCommission = matchingItems.reduce(
        (sum, item) => sum + Number(item.commissionAmount || 0),
        0
      );
      const rowItems = matchingItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      vendorOrderRows.push({
        id: order.id,
        status: orderStatus,
        customer: order.customerName || order.customer || "Customer",
        totalAmount: rowRevenue,
        commissionAmount: rowCommission,
        itemsSold: rowItems,
        createdAt: order.createdAt,
      });
    }

    const totalOrders = vendorOrderRows.length;
    const totalCommission = vendorOrderRows.reduce((sum, row) => sum + row.commissionAmount, 0);
    const totalRevenue = vendorOrderRows.reduce((sum, row) => sum + row.totalAmount, 0);
    const totalItemsSold = vendorOrderRows.reduce((sum, row) => sum + row.itemsSold, 0);
    const deliveredOrders = vendorOrderRows.filter((row) => {
      const s = String(row.status || "").toUpperCase();
      return s === "DELIVERED" || s === "COMPLETED";
    }).length;
    const pendingOrders = vendorOrderRows.filter((row) => {
      const s = String(row.status || "").toUpperCase();
      return s === "PENDING" || s === "APPROVED" || s === "PROCESSING" || s === "SHIPPED";
    }).length;
    const refundedOrders = refunds.filter((r) => {
      const status = String(r.status || "").toUpperCase();
      return r.vendorId === canonicalVendorId && status === "APPROVED";
    }).length;
    const complaintCount = complaints.filter((c) => c.vendorId === canonicalVendorId).length;

    vendorOrderRows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      vendor,
      stats: {
        totalOrders,
        totalCommission,
        totalRevenue,
        totalItemsSold,
        deliveredOrders,
        pendingOrders,
        refundedOrders,
        complaintCount,
      },
      recentOrders: vendorOrderRows.slice(0, 15),
    };
  }, [vendorId]);

  const { items, error, refresh, loading } = useAsyncList(fetchVendorProfile, null);
  const data = items && typeof items === "object" ? items : null;
  const vendor = data?.vendor || null;
  const [gstPreview, setGstPreview] = useState(null);
  const [gstLoading, setGstLoading] = useState(false);
  const [gstSaving, setGstSaving] = useState(false);

  useEffect(() => {
    setGstPreview(null);
    setGstLoading(false);
    setGstSaving(false);
  }, [vendorId]);

  const savedGst = useMemo(() => {
    if (!vendor) return null;
    const hasStored =
      Boolean(vendor.gstLegalName) ||
      Boolean(vendor.gstTradeName) ||
      Boolean(vendor.gstBusinessAddress) ||
      Boolean(vendor.gstVerifiedAt);
    if (!hasStored) return null;
    return {
      gstVerificationStatus: vendor.gstVerificationStatus || "VERIFIED",
      gstVerificationError: vendor.gstVerificationError || null,
      gstVerifiedAt: vendor.gstVerifiedAt,
      gstNumber: vendor.gstNumber,
      gstLegalName: vendor.gstLegalName,
      gstTradeName: vendor.gstTradeName,
      gstBusinessAddress: vendor.gstBusinessAddress,
      gstNameMatches: vendor.gstNameMatches,
      source: "saved",
    };
  }, [vendor]);

  const gstView = gstPreview || savedGst;
  const isApprovedWithSavedInfo = String(vendor?.status || "").toUpperCase() === "APPROVED" && Boolean(savedGst);

  async function handleVerify() {
    if (!vendor?.id) return;
    setGstLoading(true);
    try {
      const res = await verifyVendorGstPreview(vendor.id);
      setGstPreview({ ...res, source: "preview" });
    } catch (err) {
      const message = String(err?.message || "GST verification failed");
      Alert.alert("GST Verification Failed", message);
    } finally {
      setGstLoading(false);
    }
  }

  async function handleSaveGst() {
    if (!vendor?.id) return;
    setGstSaving(true);
    try {
      await saveVendorGstVerification(vendor.id, gstPreview || {});
      setGstPreview(null);
      await refresh();
      Alert.alert("Saved", "GST details saved for this vendor.");
    } catch (err) {
      const message = String(err?.message || "Failed to save GST details");
      Alert.alert("Save Failed", message);
    } finally {
      setGstSaving(false);
    }
  }

  return (
    <AdminScreenLayout>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <ScreenTitle title="Vendor Profile" subtitle="Details, stats, and order performance" />

      {loading && !vendor ? <SkeletonList count={3} /> : null}
      {error && !vendor ? <ErrorState message={error} onRetry={refresh} /> : null}

      {vendor ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <View style={styles.avatarWrap}>
                <Text style={styles.avatarText}>{getInitials(vendor.companyName || vendor.fullName)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailTitle}>{vendor.companyName || vendor.fullName || "Vendor"}</Text>
                <Text style={styles.ratingText}>
                  {Number(vendor.averageRating || 0) > 0
                    ? `★ ${Number(vendor.averageRating).toFixed(1)}/5 (${Number(vendor.reviewCount || 0)} reviews)`
                    : "No ratings yet"}
                </Text>
                <Text style={styles.detailMeta}>{vendor.email || "N/A"}</Text>
                <Text style={styles.detailMeta}>{vendor.phone || "N/A"}</Text>
                <Text style={styles.detailMetaAddress}>
                  {vendor.address || "N/A"}, {vendor.city || "N/A"}, {vendor.state || "N/A"} {vendor.postalCode || ""}
                </Text>
              </View>
              <Badge text={vendor.status || "UNKNOWN"} tone={statusTone(vendor.status)} />
            </View>

            <View style={styles.detailSubCard}>
              <Text style={styles.sectionLabel}>Business</Text>
              <Text style={styles.detailMeta}>
                GST: {vendor.gstNumber || "N/A"} • {vendor.idProofType || "ID"}: {vendor.idProofNumber || "N/A"}
              </Text>
              <Text style={styles.detailMeta}>Category: {vendor.category || "N/A"}</Text>
            </View>

            <View style={styles.detailSubCard}>
              <Text style={styles.sectionLabel}>GST Verification (AppyFlow)</Text>
              {gstLoading ? (
                <View style={styles.fetchBar}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.fetchBarText}>Fetching GST info from AppyFlow...</Text>
                </View>
              ) : null}

              {isApprovedWithSavedInfo ? null : (
                <View style={styles.gstBtnRow}>
                  <TouchableOpacity
                    style={styles.verifyBtn}
                    onPress={handleVerify}
                    disabled={gstLoading || gstSaving}
                  >
                    <Text style={styles.verifyBtnText}>{gstView ? "Re-verify GST" : "Verify GST"}</Text>
                  </TouchableOpacity>

                  {gstPreview ? (
                    <TouchableOpacity
                      style={[styles.saveBtn, gstSaving ? styles.btnDisabled : null]}
                      onPress={handleSaveGst}
                      disabled={gstSaving || gstLoading}
                    >
                      <Text style={styles.saveBtnText}>{gstSaving ? "Saving..." : "Save GST Info"}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}

              <GstRow label="Submitted GSTIN" value={vendor.gstNumber || "N/A"} mono bordered={false} />
              {gstView ? (
                <View style={styles.gstGrid}>
                  <GstRow label="Verification Status" value={gstView.gstVerificationStatus || "NOT_VERIFIED"} />
                  <GstRow label="API Legal Name" value={gstView.gstLegalName || "N/A"} />
                  <GstRow label="API Trade Name" value={gstView.gstTradeName || "N/A"} />
                  <GstRow label="API Address" value={gstView.gstBusinessAddress || "N/A"} />
                  <GstRow
                    label="Name Match"
                    value={
                      gstView.gstNameMatches == null
                        ? "Unknown"
                        : gstView.gstNameMatches
                          ? "Matched"
                          : "Mismatch"
                    }
                  />
                  <GstRow
                    label="Verified At"
                    value={
                      gstView.gstVerifiedAt ? new Date(gstView.gstVerifiedAt).toLocaleString() : "Not verified yet"
                    }
                  />
                </View>
              ) : (
                <Text style={styles.gstHint}>Tap Verify GST to fetch details from AppyFlow.</Text>
              )}
              {gstView?.gstVerificationError ? (
                <Text style={styles.gstErrorText}>Verification Error: {gstView.gstVerificationError}</Text>
              ) : null}
            </View>

            <View style={styles.detailSubCard}>
              <Text style={styles.sectionLabel}>Bank</Text>
              <Text style={styles.detailMeta}>{vendor.bankName || "N/A"}</Text>
              <Text style={styles.detailMeta}>
                A/C: {vendor.accountNumber || "N/A"} • IFSC: {vendor.ifscCode || "N/A"}
              </Text>
            </View>

            <View style={styles.detailSubCard}>
              <Text style={styles.sectionLabel}>Location</Text>
              <Text style={styles.detailMeta}>GPS: {formatGps(vendor.gpsLat, vendor.gpsLng)}</Text>
              {vendor.gpsLat != null && vendor.gpsLng != null ? (
                <TouchableOpacity
                  style={styles.mapBtn}
                  onPress={() => Linking.openURL(`https://maps.google.com/?q=${vendor.gpsLat},${vendor.gpsLng}`)}
                >
                  <Text style={styles.mapBtnText}>Open in Maps</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.detailSubCard}>
              <Text style={styles.sectionLabel}>Documents</Text>
              <View style={styles.docRow}>
                {vendor.gstCertificateUrl ? <DocPreview label="GST" uri={vendor.gstCertificateUrl} /> : null}
                {vendor.panCardUrl ? <DocPreview label="PAN" uri={vendor.panCardUrl} /> : null}
                {vendor.idProofUrl ? <DocPreview label="ID Proof" uri={vendor.idProofUrl} /> : null}
                {vendor.locationPhotoUrl ? <DocPreview label="Location" uri={vendor.locationPhotoUrl} /> : null}
                {!vendor.gstCertificateUrl && !vendor.panCardUrl && !vendor.idProofUrl && !vendor.locationPhotoUrl ? (
                  <Text style={styles.detailMeta}>No documents uploaded.</Text>
                ) : null}
              </View>
            </View>
          </View>

          <SectionHeader title="Vendor Stats" />
          <View style={styles.statsGrid}>
            <StatCard label="Orders" value={data.stats.totalOrders} color={colors.info} />
            <StatCard label="Commission" value={`₹${Math.round(data.stats.totalCommission)}`} color={colors.warning} />
            <StatCard label="Revenue" value={`₹${Math.round(data.stats.totalRevenue)}`} color={colors.accent} />
            <StatCard label="Items Sold" value={data.stats.totalItemsSold} color={colors.success} />
            <StatCard label="Delivered" value={data.stats.deliveredOrders} color={colors.success} />
            <StatCard label="Pending" value={data.stats.pendingOrders} color={colors.warning} />
            <StatCard label="Refunded" value={data.stats.refundedOrders} color={colors.warning} />
            <StatCard label="Complaints" value={data.stats.complaintCount} color={colors.info} />
          </View>

          <SectionHeader title="Recent Vendor Orders" />
          {data.recentOrders.length === 0 ? (
            <Text style={styles.detailMeta}>No orders linked to this vendor yet.</Text>
          ) : null}
          {data.recentOrders.map((order) => (
            <RowCard
              key={order.id}
              title={`${order.customer} • ${order.id}`}
              subtitle={`₹${Math.round(order.totalAmount)}  •  Commission ₹${Math.round(
                order.commissionAmount
              )}  •  Items ${order.itemsSold}`}
              right={<Badge text={order.status} tone={statusTone(order.status)} />}
            />
          ))}
        </ScrollView>
      ) : null}
    </AdminScreenLayout>
  );
}

function statusTone(status) {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "APPROVED" || normalized === "DELIVERED" || normalized === "COMPLETED") {
    return "success";
  }
  if (normalized === "PENDING" || normalized === "PROCESSING" || normalized === "SHIPPED") {
    return "warning";
  }
  if (normalized === "SUSPENDED" || normalized === "REJECTED" || normalized === "CANCELLED") {
    return "danger";
  }
  return "info";
}

function formatGps(lat, lng) {
  if (lat == null || lng == null) return "Not available";
  return `${lat}, ${lng}`;
}

function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "V";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function DocPreview({ uri, label }) {
  const isPdf = uri?.includes("application/pdf") || uri?.toLowerCase().endsWith(".pdf");
  return (
    <TouchableOpacity style={styles.docCard} onPress={() => Linking.openURL(uri)}>
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

function GstRow({ label, value, mono = false, bordered = true }) {
  return (
    <View style={[styles.gstRow, !bordered ? styles.gstRowPlain : null]}>
      <Text style={styles.gstRowLabel}>{label}</Text>
      <Text style={[styles.gstRowValue, mono ? styles.gstRowMono : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backBtn: { marginBottom: spacing.sm },
  backText: { color: colors.primary, fontWeight: "700" },
  detailCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.lg,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panelAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.primary, fontWeight: "800", fontSize: 14 },
  detailTitle: { fontSize: 17, fontWeight: "800", color: colors.text },
  ratingText: { marginTop: 5, color: "#B45309", fontSize: 12, fontWeight: "700" },
  detailMeta: { color: colors.muted, fontSize: 12, marginTop: 5 },
  detailMetaAddress: { color: colors.muted, fontSize: 12, marginTop: 6, lineHeight: 18 },
  detailSubCard: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    backgroundColor: "#FAFCFF",
    padding: spacing.md,
  },
  sectionLabel: { color: colors.text, fontWeight: "800", marginBottom: 8, fontSize: 13 },
  fetchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "#EEF4FB",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  fetchBarText: { color: colors.primary, fontWeight: "700", fontSize: 12 },
  gstBtnRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  verifyBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    backgroundColor: "#EAF1FB",
    alignItems: "center",
  },
  verifyBtnText: { color: colors.primary, fontWeight: "800", fontSize: 12 },
  saveBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#1E4F8C",
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    backgroundColor: "#1E4F8C",
    alignItems: "center",
  },
  saveBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 12 },
  btnDisabled: { opacity: 0.6 },
  gstGrid: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: colors.card,
  },
  gstRow: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  gstRowPlain: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: colors.card,
    marginBottom: spacing.sm,
  },
  gstRowLabel: { color: colors.muted, fontSize: 10, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase" },
  gstRowValue: { color: colors.text, fontSize: 12, marginTop: 2, lineHeight: 18 },
  gstRowMono: { fontFamily: "monospace" },
  gstHint: { color: colors.muted, fontSize: 12, marginTop: 2 },
  gstErrorText: { color: colors.danger, fontSize: 12, marginTop: spacing.sm, fontWeight: "600" },
  mapBtn: {
    marginTop: spacing.xs,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    backgroundColor: colors.panelAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  mapBtnText: { color: colors.primary, fontWeight: "700", fontSize: 12 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: spacing.md,
    columnGap: spacing.md,
    marginBottom: spacing.md,
  },
  docRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs },
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

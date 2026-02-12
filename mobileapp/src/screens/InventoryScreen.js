import React, { useCallback, useState } from "react";
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import AdminScreenLayout from "../components/AdminScreenLayout";
import { ScreenTitle, SectionHeader, RowCard, Badge } from "../components/Ui";
import { useAsyncList } from "../services/useAsyncList";
import { getInventory, getProductReviews, replyToProductReview } from "../services/api";
import { ErrorState, SkeletonList, EmptyState } from "../components/StateViews";
import { colors, spacing } from "../theme";

export default function InventoryScreen() {
  const fetchInventory = useCallback(async () => {
    const data = await getInventory();
    return data.inventory;
  }, []);

  const { items, error, refresh, loading } = useAsyncList(fetchInventory, []);
  const [selectedItem, setSelectedItem] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [replyInputs, setReplyInputs] = useState({});

  async function openDetail(item) {
    setSelectedItem(item);
    setReviewsLoading(true);
    try {
      const data = await getProductReviews(item.id);
      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
    } catch {
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }

  async function submitReply(reviewId) {
    const message = String(replyInputs[reviewId] || "").trim();
    if (!message) {
      Alert.alert("Reply required", "Please write a reply before posting.");
      return;
    }
    if (!selectedItem?.id) return;
    try {
      await replyToProductReview(selectedItem.id, reviewId, message);
      const data = await getProductReviews(selectedItem.id);
      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      setReplyInputs((prev) => ({ ...prev, [reviewId]: "" }));
    } catch {
      Alert.alert("Failed", "Could not post reply.");
    }
  }

  return (
    <AdminScreenLayout>
      <ScreenTitle title="Inventory" subtitle="Warehouse status" />
      <SectionHeader title="Stock Watch" />
      {loading && items.length === 0 ? <SkeletonList count={3} /> : null}
      {error && items.length === 0 ? <ErrorState message={error} onRetry={refresh} /> : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState title="Inventory is clear" message="Stock alerts will show here." />
      ) : null}
      {items.map((item) => (
        <TouchableOpacity key={item.id} onPress={() => openDetail(item)} activeOpacity={0.85}>
          <RowCard
            title={item.item}
            subtitle={`${item.warehouse}  •  ${item.id}`}
            right={<Badge text={item.status} tone={statusTone(item.status)} />}
          />
        </TouchableOpacity>
      ))}

      {selectedItem ? (
        <Modal visible transparent animationType="slide" onRequestClose={() => setSelectedItem(null)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Product Detail</Text>
                <TouchableOpacity onPress={() => setSelectedItem(null)}>
                  <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {selectedItem.image ? <Image source={{ uri: selectedItem.image }} style={styles.image} /> : null}
                <Text style={styles.metaText}>Name: {selectedItem.name || selectedItem.item}</Text>
                <Text style={styles.metaText}>Vendor: {selectedItem.vendorName || selectedItem.vendor}</Text>
                <Text style={styles.metaText}>Category: {selectedItem.category || "-"}</Text>
                <Text style={styles.metaText}>Subcategory: {selectedItem.subCategory || "-"}</Text>
                <Text style={styles.metaText}>Price: ₹{Math.round(selectedItem.price || 0)}</Text>
                <Text style={styles.metaText}>Stock: {Number(selectedItem.stock || 0)}</Text>
                <Text style={styles.metaText}>Description: {selectedItem.description || "No description"}</Text>

                <Text style={styles.reviewTitle}>Customer Reviews</Text>
                {reviewsLoading ? <Text style={styles.metaText}>Loading reviews…</Text> : null}
                {!reviewsLoading && !reviews.length ? (
                  <Text style={styles.metaText}>No customer reviews yet.</Text>
                ) : null}
                {reviews.map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <Text style={styles.reviewName}>{review.customerName}</Text>
                    <Text style={styles.reviewStars}>{stars(review.rating)} {review.rating}/5</Text>
                    <Text style={styles.reviewBody}>{review.comment}</Text>
                    {review.adminReply ? (
                      <View style={styles.replyBlock}>
                        <Text style={styles.replyAuthor}>Fixkart</Text>
                        <Text style={styles.replyBody}>{review.adminReply}</Text>
                      </View>
                    ) : null}
                    <TextInput
                      value={replyInputs[review.id] || ""}
                      onChangeText={(text) => setReplyInputs((prev) => ({ ...prev, [review.id]: text }))}
                      placeholder="Reply from platform side"
                      placeholderTextColor={colors.muted}
                      style={styles.replyInput}
                      multiline
                    />
                    <TouchableOpacity style={styles.replyBtn} onPress={() => submitReply(review.id)}>
                      <Text style={styles.replyBtnText}>Post as Fixkart</Text>
                    </TouchableOpacity>
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

function stars(rating) {
  const safe = Math.min(5, Math.max(0, Number(rating || 0)));
  let value = "";
  for (let i = 1; i <= 5; i += 1) value += i <= safe ? "★" : "☆";
  return value;
}

function statusTone(status) {
  if (status === "OK") return "success";
  if (status === "LOW") return "warning";
  if (status === "CRITICAL") return "danger";
  return "info";
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
  image: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panelAlt,
    marginBottom: spacing.sm,
  },
  metaText: { color: colors.muted, fontSize: 12, marginTop: 6 },
  reviewTitle: { marginTop: 14, color: colors.text, fontWeight: "800", fontSize: 14 },
  reviewCard: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: spacing.sm,
    backgroundColor: colors.card,
  },
  reviewName: { color: colors.text, fontWeight: "700" },
  reviewStars: { marginTop: 2, color: "#B45309", fontSize: 12, fontWeight: "700" },
  reviewBody: { marginTop: 6, color: colors.muted, fontSize: 12, lineHeight: 18 },
  replyBlock: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 8,
    backgroundColor: colors.panelAlt,
  },
  replyAuthor: { color: colors.primary, fontWeight: "800", marginBottom: 3 },
  replyBody: { color: colors.text, fontSize: 12 },
  replyInput: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    minHeight: 70,
    padding: 8,
    color: colors.text,
    textAlignVertical: "top",
    fontSize: 12,
  },
  replyBtn: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: "center",
  },
  replyBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
});

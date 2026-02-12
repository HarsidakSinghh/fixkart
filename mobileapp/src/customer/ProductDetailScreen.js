import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions, TextInput, Alert } from 'react-native';
import { customerColors, customerSpacing } from './CustomerTheme';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getStoreProduct } from './storeApi';
import { getProductReviewSummary } from '../services/reviews';
import { submitProductReview } from './customerApi';

export default function ProductDetailScreen({ product, onBack, onLogin }) {
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const [detail, setDetail] = useState(product);
  const [loading, setLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSummary, setReviewSummary] = useState({ averageRating: 0, reviewCount: 0, reviews: [] });
  const [selectedRating, setSelectedRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [savingReview, setSavingReview] = useState(false);

  const handleAdd = () => {
    if (!isAuthenticated) {
      onLogin();
      return;
    }
    addItem(detail || product);
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!product?.id) return;
      if (product?.description) {
        setDetail(product);
        return;
      }
      try {
        setLoading(true);
        const data = await getStoreProduct(product.id);
        if (mounted) setDetail(data.product || product);
      } catch {
        if (mounted) setDetail(product);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [product]);

  useEffect(() => {
    let mounted = true;
    async function loadReviews() {
      if (!product?.id) return;
      setReviewLoading(true);
      try {
        const data = await getProductReviewSummary(product.id);
        if (mounted) setReviewSummary(data);
      } finally {
        if (mounted) setReviewLoading(false);
      }
    }
    loadReviews();
    return () => {
      mounted = false;
    };
  }, [product?.id]);

  if (!product) return null;
  const view = detail || product;
  const imageWidth = Dimensions.get('window').width - customerSpacing.lg * 2 - customerSpacing.md * 2;
  const photos = [view.image, ...(Array.isArray(view.gallery) ? view.gallery : [])]
    .filter(Boolean)
    .filter((uri, index, arr) => arr.indexOf(uri) === index);
  const avgRating = Number(reviewSummary.averageRating || 0);
  const reviewCount = Number(reviewSummary.reviewCount || 0);

  const submitReview = async () => {
    if (!isAuthenticated) {
      onLogin?.();
      return;
    }
    const comment = reviewText.trim();
    if (!comment) {
      Alert.alert('Review required', 'Please write your review before submitting.');
      return;
    }
    setSavingReview(true);
    try {
      const data = await submitProductReview(view.id, {
        rating: selectedRating,
        comment,
      });
      setReviewSummary(data);
      setReviewText('');
      Alert.alert('Review submitted', 'Your review has been posted.');
    } finally {
      setSavingReview(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.imageWrap}>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
          {photos.map((uri, idx) => (
            <Image
              key={`${uri}-${idx}`}
              source={{ uri }}
              style={[styles.image, { width: imageWidth }]}
              resizeMode="contain"
            />
          ))}
        </ScrollView>
        {photos.length > 1 ? (
          <View style={styles.dotRow}>
            {photos.map((uri, idx) => (
              <View key={`dot-${uri}-${idx}`} style={styles.dot} />
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{view.title || view.name}</Text>
        <Text style={styles.meta}>{view.subCategory || view.category}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{Math.round(view.price || 0)}</Text>
          <Text style={styles.stock}>{view.quantity > 0 ? 'In stock' : 'Out of stock'}</Text>
        </View>

        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>
          {loading ? 'Loading description…' : view.description || view.features || 'No description available yet.'}
        </Text>

        <Text style={styles.sectionTitle}>Ratings & Reviews</Text>
        <Text style={styles.ratingSummary}>
          {avgRating ? `${renderStars(Math.round(avgRating))} ${avgRating}/5` : 'No ratings yet'} {reviewCount ? `(${reviewCount} reviews)` : ''}
        </Text>

        <View style={styles.reviewForm}>
          <Text style={styles.reviewLabel}>Your Rating</Text>
          <View style={styles.starSelectRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setSelectedRating(star)}>
                <Text style={[styles.starSelect, star <= selectedRating ? styles.starActive : null]}>★</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            value={reviewText}
            onChangeText={setReviewText}
            placeholder="Write your review"
            placeholderTextColor={customerColors.muted}
            multiline
            style={styles.reviewInput}
          />
          <TouchableOpacity style={[styles.submitReviewBtn, savingReview ? { opacity: 0.7 } : null]} onPress={submitReview} disabled={savingReview}>
            <Text style={styles.submitReviewText}>{savingReview ? 'Submitting…' : 'Submit Review'}</Text>
          </TouchableOpacity>
        </View>

        {reviewLoading ? <Text style={styles.reviewMeta}>Loading reviews…</Text> : null}
        {!reviewLoading && !reviewSummary.reviews.length ? (
          <Text style={styles.reviewMeta}>No reviews yet. Be the first to review.</Text>
        ) : null}
        {reviewSummary.reviews.map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <Text style={styles.reviewName}>{review.customerName}</Text>
            <Text style={styles.reviewStars}>{renderStars(review.rating)} {review.rating}/5</Text>
            <Text style={styles.reviewBody}>{review.comment}</Text>
            {review.adminReply ? (
              <View style={styles.replyWrap}>
                <Text style={styles.replyLabel}>Fixkart</Text>
                <Text style={styles.replyBody}>{review.adminReply}</Text>
              </View>
            ) : null}
          </View>
        ))}
      </View>
      </ScrollView>
      <View style={styles.stickyBar}>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function renderStars(rating) {
  const safe = Math.min(5, Math.max(0, Number(rating || 0)));
  let output = '';
  for (let i = 1; i <= 5; i += 1) {
    output += i <= safe ? '★' : '☆';
  }
  return output;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: customerColors.bg },
  scrollContent: { paddingBottom: 120 },
  backButton: { padding: customerSpacing.lg },
  backText: { color: customerColors.primary, fontWeight: '700' },
  imageWrap: {
    marginHorizontal: customerSpacing.lg,
    backgroundColor: customerColors.card,
    borderRadius: 20,
    padding: customerSpacing.md,
    borderWidth: 1,
    borderColor: customerColors.border,
  },
  image: {
    height: 260,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: customerColors.surface,
  },
  dotRow: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 99, backgroundColor: customerColors.muted },
  content: { padding: customerSpacing.lg },
  title: { fontSize: 20, fontWeight: '800', color: customerColors.text },
  meta: { color: customerColors.muted, marginTop: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  price: { fontSize: 22, fontWeight: '800', color: customerColors.primary },
  stock: { color: customerColors.success, fontWeight: '700', fontSize: 12 },
  addButton: {
    backgroundColor: customerColors.primary,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  addText: { color: '#FFFFFF', fontWeight: '700' },
  sectionTitle: { marginTop: customerSpacing.xl, fontWeight: '700', color: customerColors.text },
  description: { marginTop: customerSpacing.sm, color: customerColors.muted, lineHeight: 20 },
  ratingSummary: { marginTop: 8, color: customerColors.text, fontWeight: '700' },
  reviewForm: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: customerColors.border,
    borderRadius: 12,
    padding: customerSpacing.md,
    backgroundColor: customerColors.card,
  },
  reviewLabel: { color: customerColors.text, fontWeight: '700', marginBottom: 8 },
  starSelectRow: { flexDirection: 'row', gap: 8 },
  starSelect: { fontSize: 24, color: customerColors.border },
  starActive: { color: '#F59E0B' },
  reviewInput: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: customerColors.border,
    borderRadius: 10,
    minHeight: 90,
    padding: 10,
    color: customerColors.text,
    textAlignVertical: 'top',
  },
  submitReviewBtn: {
    marginTop: 10,
    backgroundColor: customerColors.primary,
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 10,
  },
  submitReviewText: { color: '#fff', fontWeight: '700' },
  reviewMeta: { marginTop: 12, color: customerColors.muted, fontSize: 12 },
  reviewCard: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: customerColors.border,
    borderRadius: 12,
    padding: customerSpacing.md,
    backgroundColor: customerColors.card,
  },
  reviewName: { color: customerColors.text, fontWeight: '700' },
  reviewStars: { marginTop: 4, color: '#B45309', fontSize: 12, fontWeight: '700' },
  reviewBody: { marginTop: 8, color: customerColors.muted, lineHeight: 18 },
  replyWrap: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: customerColors.surface,
    borderWidth: 1,
    borderColor: customerColors.border,
  },
  replyLabel: { color: customerColors.primary, fontWeight: '700', marginBottom: 4 },
  replyBody: { color: customerColors.text },
  stickyBar: {
    position: 'absolute',
    left: customerSpacing.lg,
    right: customerSpacing.lg,
    bottom: customerSpacing.lg,
    backgroundColor: customerColors.card,
    padding: customerSpacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: customerColors.border,
    shadowColor: customerColors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});

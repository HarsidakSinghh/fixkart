import { getProductReviews, getReviewSummaries } from "../customer/storeApi";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export async function getProductReviewSummary(productId) {
  return getProductReviews(productId);
}

export async function enrichProductsWithReviewSummary(products) {
  const items = safeArray(products);
  if (!items.length) return [];
  const summaries = await getReviewSummaries(items.map((item) => item.id));
  return items.map((item) => {
    const summary = summaries[item.id] || { averageRating: 0, reviewCount: 0 };
    return {
      ...item,
      averageRating: summary.averageRating,
      reviewCount: summary.reviewCount,
    };
  });
}

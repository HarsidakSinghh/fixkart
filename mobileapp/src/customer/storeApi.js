import { API_CONFIG } from '../config';
import { getCache, setCache } from '../services/cache';

const BASE_URL = API_CONFIG.baseUrl;

export async function getStoreProducts({ query = '', category = '', subCategory = '' } = {}) {
  if (!BASE_URL) {
    throw new Error('Missing API base URL');
  }
  const cacheKey = `store:products:v2:${query}:${category}:${subCategory}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;
  const params = new URLSearchParams();
  if (query) params.set('query', query);
  if (category) params.set('category', category);
  if (subCategory) params.set('subCategory', subCategory);

  const res = await fetch(`${BASE_URL}/api/mobile/store/products?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  const data = await res.json();
  setCache(cacheKey, data, 45000);
  return data;
}

export async function getReviewSummaries(productIds = []) {
  if (!BASE_URL) {
    throw new Error('Missing API base URL');
  }
  const ids = Array.isArray(productIds) ? productIds.filter(Boolean) : [];
  if (!ids.length) return {};
  const params = new URLSearchParams();
  params.set('productIds', ids.join(','));
  const res = await fetch(`${BASE_URL}/api/mobile/reviews/summary?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  const data = await res.json();
  return data.summaries || {};
}

export async function getProductReviews(productId) {
  if (!BASE_URL) {
    throw new Error('Missing API base URL');
  }
  const res = await fetch(`${BASE_URL}/api/mobile/reviews/${productId}`);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
}

export async function getStoreProduct(id) {
  if (!BASE_URL) {
    throw new Error('Missing API base URL');
  }
  const res = await fetch(`${BASE_URL}/api/mobile/store/products/${id}`);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
}

export async function getStoreTypes(category = '') {
  if (!BASE_URL) {
    throw new Error('Missing API base URL');
  }
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  const res = await fetch(`${BASE_URL}/api/mobile/store/types?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
}

export async function getStoreCategories() {
  if (!BASE_URL) {
    throw new Error('Missing API base URL');
  }
  const cacheKey = 'store:categories';
  const cached = getCache(cacheKey);
  if (cached) return cached;
  const res = await fetch(`${BASE_URL}/api/mobile/store/categories`);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  const data = await res.json();
  setCache(cacheKey, data, 60000);
  return data;
}

export async function getTypeListings(subCategory) {
  if (!BASE_URL) {
    throw new Error('Missing API base URL');
  }
  const params = new URLSearchParams();
  params.set('subCategory', subCategory);
  const res = await fetch(`${BASE_URL}/api/mobile/store/type-listings?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
}

export async function recognizeProductFromImage(asset) {
  if (!BASE_URL) {
    throw new Error('Missing API base URL');
  }
  if (!asset?.uri) {
    throw new Error('Image is required');
  }

  const formData = new FormData();
  formData.append('image', {
    uri: asset.uri,
    name: asset.fileName || `lens-${Date.now()}.jpg`,
    type: asset.mimeType || 'image/jpeg',
  });

  const res = await fetch(`${BASE_URL}/api/mobile/vision/recognize`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed: ${res.status}`);
  }
  return res.json();
}

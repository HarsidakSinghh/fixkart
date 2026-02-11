import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../config';
import { getCache, setCache } from '../services/cache';

const BASE_URL = API_CONFIG.baseUrl;

async function getAuthToken() {
  try {
    return await SecureStore.getItemAsync('clerk_session_token');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

async function authFetch(path, options = {}) {
  const token = await getAuthToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed: ${res.status}`);
  }

  return res.json();
}

export async function verifyVendorAccess() {
  return authFetch('/api/mobile/vendor/verify');
}

export async function verifyVendorAccessWithToken(token) {
  const res = await fetch(`${BASE_URL}/api/mobile/vendor/verify`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed: ${res.status}`);
  }

  return res.json();
}

export async function getVendorProfile() {
  const cacheKey = 'vendor:profile';
  const cached = getCache(cacheKey);
  if (cached) return cached;
  const data = await authFetch('/api/mobile/vendor/profile');
  setCache(cacheKey, data, 30000);
  return data;
}

export async function getVendorCategories() {
  const cacheKey = 'vendor:categories';
  const cached = getCache(cacheKey);
  if (cached) return cached;
  const data = await authFetch('/api/mobile/vendor/categories');
  setCache(cacheKey, data, 60000);
  return data;
}

export async function getVendorProducts(category = '') {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  const cacheKey = `vendor:products:${category}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;
  const data = await authFetch(`/api/mobile/vendor/products?${params.toString()}`);
  setCache(cacheKey, data, 30000);
  return data;
}

export async function getVendorTypes(category = '') {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  const cacheKey = `vendor:types:${category}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;
  const data = await authFetch(`/api/mobile/vendor/types?${params.toString()}`);
  setCache(cacheKey, data, 60000);
  return data;
}

export async function getVendorCatalogProducts({ category = '', subCategory = '', query = '' } = {}) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (subCategory) params.set('subCategory', subCategory);
  if (query) params.set('query', query);
  params.set('all', '1');
  const cacheKey = `vendor:catalog:${category}:${subCategory}:${query}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;
  const data = await authFetch(`/api/mobile/vendor/products?${params.toString()}`);
  setCache(cacheKey, data, 30000);
  return data;
}

export async function getVendorListings() {
  const cacheKey = 'vendor:listings';
  const cached = getCache(cacheKey);
  if (cached) return cached;
  const data = await authFetch('/api/mobile/vendor/listings');
  setCache(cacheKey, data, 20000);
  return data;
}

export async function updateVendorListing(id, payload) {
  return authFetch(`/api/mobile/vendor/listings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function submitVendorProduct(payload) {
  return authFetch('/api/mobile/vendor/product-request', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function uploadVendorListingImage(imageBase64, filename) {
  return authFetch('/api/mobile/vendor/uploads', {
    method: 'POST',
    body: JSON.stringify({ imageBase64, filename }),
  });
}

export async function getVendorOrders() {
  const cacheKey = 'vendor:orders';
  const cached = getCache(cacheKey);
  if (cached) return cached;
  const data = await authFetch('/api/mobile/vendor/orders');
  setCache(cacheKey, data, 15000);
  return data;
}

export async function getVendorOrderPO(orderId) {
  return authFetch('/api/mobile/vendor/orders/po', {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  });
}

export async function getVendorComplaints() {
  const cacheKey = 'vendor:complaints';
  const cached = getCache(cacheKey);
  if (cached) return cached;
  const data = await authFetch('/api/mobile/vendor/complaints');
  setCache(cacheKey, data, 15000);
  return data;
}

export async function getVendorRefunds() {
  const cacheKey = 'vendor:refunds';
  const cached = getCache(cacheKey);
  if (cached) return cached;
  const data = await authFetch('/api/mobile/vendor/refunds');
  setCache(cacheKey, data, 15000);
  return data;
}

export async function markVendorOrderReady(itemId) {
  return authFetch(`/api/mobile/vendor/orders/${itemId}/dispatch`, {
    method: 'PATCH',
  });
}

export async function getPublicCategories() {
  const res = await fetch(`${BASE_URL}/api/mobile/store/categories`);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
}

export async function registerVendor(payload) {
  return authFetch('/api/mobile/vendor/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function registerVendorWithToken(token, payload) {
  const res = await fetch(`${BASE_URL}/api/mobile/vendor/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed: ${res.status}`);
  }

  return res.json();
}

export async function getVendorSalesmen() {
  const data = await authFetch('/api/mobile/vendor/salesmen');
  return data.salesmen || [];
}

export async function createVendorSalesman(payload) {
  return authFetch('/api/mobile/vendor/salesmen', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function uploadSalesmanIdProof(imageBase64, filename) {
  return authFetch('/api/mobile/vendor/salesmen/id-proof', {
    method: 'POST',
    body: JSON.stringify({ imageBase64, filename }),
  });
}

export async function getSalesmanVisits(salesmanId) {
  const data = await authFetch(`/api/mobile/vendor/salesmen/visits?salesmanId=${salesmanId}`);
  return data.visits || [];
}

export async function getSalesmanAssignments(salesmanId) {
  const data = await authFetch(`/api/mobile/vendor/salesmen/assign?salesmanId=${salesmanId}`);
  return data.assignments || [];
}

export async function createSalesmanAssignment(payload) {
  return authFetch('/api/mobile/vendor/salesmen/assign', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getSalesmanTrack(salesmanId) {
  const data = await authFetch(`/api/mobile/vendor/salesmen/track?salesmanId=${salesmanId}`);
  return data;
}

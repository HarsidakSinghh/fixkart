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

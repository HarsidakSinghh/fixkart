import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../config';

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
  if (!BASE_URL) {
    throw new Error('Missing API base URL');
  }
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

export async function getCustomerOrders() {
  return authFetch('/api/mobile/customer-orders');
}

export async function getCustomerInvoice(orderId) {
  return authFetch('/api/mobile/customer-orders/invoice', {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  });
}

export async function getCustomerComplaints() {
  return authFetch('/api/mobile/customer/complaints');
}

export async function getCustomerRefunds() {
  return authFetch('/api/mobile/customer/refunds');
}

export async function submitComplaint(payload) {
  return authFetch('/api/mobile/complaints', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function submitRefund(payload) {
  return authFetch('/api/mobile/refunds/request', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function uploadComplaintImage(imageBase64, filename) {
  return authFetch('/api/mobile/uploads', {
    method: 'POST',
    body: JSON.stringify({ imageBase64, filename }),
  });
}

export async function uploadCustomerProfilePhoto(imageBase64, filename) {
  return authFetch('/api/mobile/uploads', {
    method: 'POST',
    body: JSON.stringify({ imageBase64, filename }),
  });
}

export async function seedCustomerOrders() {
  return authFetch('/api/mobile/customer-orders/seed', { method: 'POST' });
}

export async function getCustomerProfile() {
  return authFetch('/api/mobile/customer/profile');
}

export async function cancelPendingOrder(orderId, reason) {
  return authFetch(`/api/mobile/customer-orders/${orderId}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
}

export async function placeCustomerOrder(payload) {
  return authFetch('/api/mobile/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCustomerProfile(payload) {
  return authFetch('/api/mobile/customer/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function submitProductReview(productId, payload) {
  return authFetch(`/api/mobile/reviews/${productId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

import { API_CONFIG } from '../config';

/**
 * Database Service for Direct Database Operations
 * Provides CRUD operations for all entities using the authenticated API
 */

// Default API configuration
const getApiBaseUrl = () => API_CONFIG.baseUrl || '';

/**
 * Generic API request handler
 */
async function apiRequest(endpoint, options = {}) {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new Error('Missing API base URL');
  }

  const url = `${baseUrl}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// ====================
// DASHBOARD API
// ====================

export async function getDashboardData() {
  return apiRequest('/api/mobile/dashboard');
}

export async function getDashboardStats() {
  return apiRequest('/api/mobile/stats');
}

// ====================
// ORDERS API
// ====================

export async function getOrders(status = null) {
  const endpoint = status
    ? `/api/mobile/orders?status=${status}`
    : '/api/mobile/orders';
  return apiRequest(endpoint);
}

export async function getOrderById(orderId) {
  return apiRequest(`/api/mobile/orders/${orderId}`);
}

export async function updateOrder(orderId, data) {
  return apiRequest(`/api/mobile/orders/${orderId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function getOrdersHistory() {
  return apiRequest('/api/mobile/orders-history');
}

// ====================
// VENDORS API
// ====================

export async function getVendors(status = 'PENDING') {
  return apiRequest(`/api/mobile/vendors?status=${status}`);
}

export async function getVendorById(vendorId) {
  return apiRequest(`/api/mobile/vendors/${vendorId}`);
}

export async function updateVendorStatus(vendorId, status) {
  return apiRequest(`/api/mobile/vendors/${vendorId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function getOnboardedVendors() {
  return getVendors('APPROVED');
}

// ====================
// CUSTOMERS API
// ====================

export async function getCustomers(status = 'PENDING') {
  return apiRequest(`/api/mobile/customers?status=${status}`);
}

export async function getCustomerById(customerId) {
  return apiRequest(`/api/mobile/customers/${customerId}`);
}

export async function updateCustomerStatus(customerId, status) {
  return apiRequest(`/api/mobile/customers/${customerId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function getOnboardedCustomers() {
  return getCustomers('APPROVED');
}

// ====================
// PRODUCTS API
// ====================

export async function getProducts(status = 'APPROVED') {
  return apiRequest(`/api/mobile/products?status=${status}`);
}

export async function getProductById(productId) {
  return apiRequest(`/api/mobile/products/${productId}`);
}

export async function approveProduct(productId) {
  return apiRequest(`/api/mobile/products/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'APPROVE' }),
  });
}

export async function rejectProduct(productId) {
  return apiRequest(`/api/mobile/products/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'REJECT' }),
  });
}

export async function deleteProduct(productId) {
  return apiRequest(`/api/mobile/products/${productId}`, {
    method: 'DELETE',
  });
}

// ====================
// INVENTORY API
// ====================

export async function getInventory() {
  return apiRequest('/api/mobile/inventory');
}

export async function getInventoryApprovals() {
  return apiRequest('/api/mobile/inventory-approvals');
}

export async function updateInventoryItem(itemId, data) {
  return apiRequest(`/api/mobile/inventory/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ====================
// USERS API
// ====================

export async function getUsers() {
  return apiRequest('/api/mobile/users');
}

export async function getUserById(userId) {
  return apiRequest(`/api/mobile/users/${userId}`);
}

export async function banUser(userId) {
  return apiRequest(`/api/mobile/users/${userId}/ban`, {
    method: 'POST',
  });
}

export async function unbanUser(userId) {
  return apiRequest(`/api/mobile/users/${userId}/unban`, {
    method: 'POST',
  });
}

// ====================
// COMPLAINTS API
// ====================

export async function getComplaints() {
  return apiRequest('/api/mobile/complaints');
}

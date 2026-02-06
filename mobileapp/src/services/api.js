import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../config';
import { getCache, setCache } from './cache';
import {
  dashboardStats,
  weeklyRevenue,
  vendors as vendorsMock,
  orders as ordersMock,
  ordersHistory as ordersHistoryMock,
  users as usersMock,
  products as productsMock,
  inventory as inventoryMock,
  inventoryApprovals as inventoryApprovalsMock,
  customerApprovals as customerApprovalsMock,
  onboardedCustomers as onboardedCustomersMock,
  onboardedVendors as onboardedVendorsMock,
  complaints as complaintsMock,
  refunds as refundsMock,
  dashboardAlerts,
} from "../data/mock";

const ENV_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const API_BASE_URL = ENV_BASE_URL || API_CONFIG.baseUrl || "";
const USE_MOCK = (process.env.EXPO_PUBLIC_USE_MOCK || "false") === "true";

if (!ENV_BASE_URL) {
  console.log('[API] EXPO_PUBLIC_API_BASE_URL is not set. Using fallback:', API_BASE_URL);
} else {
  console.log('[API] Using EXPO_PUBLIC_API_BASE_URL:', API_BASE_URL);
}

async function getAuthToken() {
  try {
    return await SecureStore.getItemAsync("clerk_session_token");
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
}

async function authenticatedFetch(path, options = {}) {
  if (!API_BASE_URL) {
    throw new Error('Missing API base URL');
  }

  const token = await getAuthToken();
  const url = `${API_BASE_URL}${path}`;

  try {
    if (!token) {
      console.log('[API] No auth token found in SecureStore');
    } else {
      console.log('[API] Using auth token length:', token.length);
    }
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      const message = await res.text();
      throw new Error(message || `Request failed: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error('[API] Request failed:', { url, message: error?.message });
    throw error;
  }
}

async function cachedFetch(path, options = {}, ttlMs = 60000) {
  const cacheKey = `api:${path}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;
  const data = await authenticatedFetch(path, options);
  setCache(cacheKey, data, ttlMs);
  return data;
}

export async function getDashboard() {
  if (USE_MOCK) {
    return {
      kpis: {
        totalRevenue: dashboardStats.revenue,
        orderPending: dashboardStats.pendingOrders,
        orderApproved: dashboardStats.processingOrders,
        orderCompleted: dashboardStats.completedOrders,
        vendorTotal: dashboardStats.vendorsTotal,
        vendorApproved: dashboardStats.vendorsApproved,
        vendorPending: dashboardStats.vendorsPending,
        vendorSuspended: dashboardStats.vendorsSuspended,
      },
      revenueByDay: weeklyRevenue.map((d) => ({ name: d.day, total: d.value })),
      recentVendors: vendorsMock,
      alerts: dashboardAlerts,
    };
  }

  try {
    const data = await cachedFetch("/api/mobile/dashboard", {}, 45000);
    return {
      ...data,
      alerts: dashboardAlerts,
    };
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    return {
      kpis: {
        totalRevenue: dashboardStats.revenue,
        orderPending: dashboardStats.pendingOrders,
        orderApproved: dashboardStats.processingOrders,
        orderCompleted: dashboardStats.completedOrders,
        vendorTotal: dashboardStats.vendorsTotal,
        vendorApproved: dashboardStats.vendorsApproved,
        vendorPending: dashboardStats.vendorsPending,
        vendorSuspended: dashboardStats.vendorsSuspended,
      },
      revenueByDay: weeklyRevenue.map((d) => ({ name: d.day, total: d.value })),
      recentVendors: vendorsMock,
      alerts: dashboardAlerts,
    };
  }
}

export async function getOrders(status = "PENDING") {
  if (USE_MOCK) return { orders: ordersMock };

  try {
    const data = await cachedFetch(`/api/mobile/orders?status=${status}`, {}, 30000);
    return {
      orders: data.orders.map((o) => ({
        id: o.id,
        customer: o.customerName,
        city: o.city || "-",
        amount: String(Math.round(o.totalAmount || 0)),
        status: o.status,
        placedAt: new Date(o.createdAt).toLocaleDateString(),
      })),
    };
  } catch (error) {
    console.error("Error fetching orders:", error);
    return { orders: ordersMock };
  }
}

export async function updateOrderStatus(id, status) {
  if (USE_MOCK) return { success: true };

  return authenticatedFetch(`/api/mobile/orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function getOrdersHistory() {
  if (USE_MOCK) return { orders: ordersHistoryMock };

  try {
    const data = await cachedFetch("/api/mobile/orders-history", {}, 60000);
    return {
      orders: data.orders.map((o) => ({
        id: o.id,
        customer: o.customerName,
        amount: String(Math.round(o.totalAmount || 0)),
        status: o.status,
        city: o.city || "-",
        createdAt: o.createdAt,
        itemsCount: Array.isArray(o.items) ? o.items.length : 0,
      })),
    };
  } catch (error) {
    console.error("Error fetching orders history:", error);
    return { orders: ordersHistoryMock };
  }
}

export async function getVendors(status = "PENDING") {
  if (USE_MOCK) {
    return { vendors: status === "APPROVED" ? onboardedVendorsMock : vendorsMock };
  }

  try {
    const data = await cachedFetch(`/api/mobile/vendors?status=${status}`, {}, 45000);
    return {
      vendors: data.vendors.map((v) => ({
        id: v.id,
        name: v.companyName || v.fullName,
        city: v.city || "-",
        status: v.status,
      })),
    };
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return { vendors: status === "APPROVED" ? onboardedVendorsMock : vendorsMock };
  }
}

export async function getVendorDetail(id) {
  return authenticatedFetch(`/api/mobile/vendors/detail?id=${id}`);
}

export async function updateVendorStatus(id, status) {
  if (USE_MOCK) return { success: true };

  return authenticatedFetch(`/api/mobile/vendors/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function getCustomers(status = "PENDING") {
  if (USE_MOCK) {
    return { customers: status === "APPROVED" ? onboardedCustomersMock : customerApprovalsMock };
  }

  try {
    const data = await authenticatedFetch(`/api/mobile/customers?status=${status}`);
    return {
      customers: data.customers.map((c) => ({
        id: c.id,
        name: c.fullName,
        city: c.city || "-",
        status: c.status,
      })),
    };
  } catch (error) {
    console.error("Error fetching customers:", error);
    return { customers: status === "APPROVED" ? onboardedCustomersMock : customerApprovalsMock };
  }
}

export async function updateCustomerStatus(id, status) {
  if (USE_MOCK) return { success: true };

  return authenticatedFetch(`/api/mobile/customers/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function getInventoryApprovals() {
  if (USE_MOCK) return { products: inventoryApprovalsMock };

  try {
    const data = await authenticatedFetch("/api/mobile/inventory-approvals");
    return {
      products: data.products.map((p) => ({
        id: p.id,
        item: p.name,
        vendor: p.vendorName,
        status: p.status || "PENDING",
      })),
    };
  } catch (error) {
    console.error("Error fetching inventory approvals:", error);
    return { products: inventoryApprovalsMock };
  }
}

export async function approveProduct(id) {
  if (USE_MOCK) return { success: true };

  return authenticatedFetch(`/api/mobile/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "APPROVE" }),
  });
}

export async function rejectProduct(id) {
  if (USE_MOCK) return { success: true };

  return authenticatedFetch(`/api/mobile/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "REJECT" }),
  });
}

export async function getInventory() {
  if (USE_MOCK) return { inventory: inventoryMock };

  try {
    const data = await authenticatedFetch("/api/mobile/inventory");
    return {
      inventory: data.inventory.map((p) => ({
        id: p.id,
        item: p.name,
        status: p.stock > 10 ? "OK" : p.stock > 0 ? "LOW" : "CRITICAL",
        warehouse: p.vendorName || "Warehouse",
      })),
    };
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return { inventory: inventoryMock };
  }
}

export async function getProducts() {
  if (USE_MOCK) return { products: productsMock };

  try {
    const data = await authenticatedFetch("/api/mobile/products?status=APPROVED");
    return {
      products: data.products.map((p) => ({
        id: p.id,
        name: p.name,
        vendor: p.vendorId,
        status: p.status,
        stock: p.stock,
      })),
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return { products: productsMock };
  }
}

export async function getRefunds() {
  if (USE_MOCK) return { refunds: refundsMock };

  try {
    const data = await authenticatedFetch("/api/mobile/refunds");
    return {
      refunds: data.refunds.map((r) => ({
        id: r.id,
        orderId: r.orderId,
        amount: String(Math.round(r.amount || 0)),
        status: r.status,
      })),
    };
  } catch (error) {
    console.error("Error fetching refunds:", error);
    return { refunds: refundsMock };
  }
}

export async function updateRefundStatus(id, status) {
  if (USE_MOCK) return { success: true };

  return authenticatedFetch(`/api/mobile/refunds/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function getComplaints() {
  if (USE_MOCK) return { complaints: complaintsMock };

  try {
    const data = await authenticatedFetch("/api/mobile/complaints");
    return {
      complaints: data.complaints.map((c) => ({
        id: c.id,
        subject: c.message,
        priority: "MEDIUM",
        status: c.status || "OPEN",
      })),
    };
  } catch (error) {
    console.error("Error fetching complaints:", error);
    return { complaints: complaintsMock };
  }
}

export async function updateComplaintStatus(id, status) {
  if (USE_MOCK) return { success: true };

  return authenticatedFetch(`/api/mobile/complaints/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function getUsers() {
  if (USE_MOCK) return { users: usersMock };

  try {
    const data = await authenticatedFetch("/api/mobile/users");
    return {
      users: data.users.map((u) => ({
        id: u.id,
        name: u.fullName,
        role: "User",
        status: u.status,
      })),
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { users: usersMock };
  }
}

export async function updateUserStatus(id, status) {
  if (USE_MOCK) return { success: true };

  return authenticatedFetch(`/api/mobile/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ banned: status !== "ACTIVE" }),
  });
}

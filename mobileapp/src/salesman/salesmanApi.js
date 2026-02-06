import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../config';

const BASE_URL = API_CONFIG.baseUrl;

async function getSalesmanToken() {
  try {
    return await SecureStore.getItemAsync('salesman_token');
  } catch (error) {
    console.error('Error getting salesman token:', error);
    return null;
  }
}

async function authFetch(path, options = {}) {
  const token = await getSalesmanToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'X-Salesman-Id': token } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed: ${res.status}`);
  }

  return res.json();
}

export async function salesmanLogin(phone, code) {
  const res = await fetch(`${BASE_URL}/api/mobile/salesman/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code }),
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed: ${res.status}`);
  }

  return res.json();
}

export async function getSalesmanDashboard() {
  return authFetch('/api/mobile/salesman/dashboard');
}

export async function getSalesmanBeats() {
  return authFetch('/api/mobile/salesman/beats');
}

export async function startDay(lat, lng) {
  return authFetch('/api/mobile/salesman/day/start', {
    method: 'POST',
    body: JSON.stringify({ lat, lng }),
  });
}

export async function endDay(lat, lng) {
  return authFetch('/api/mobile/salesman/day/end', {
    method: 'POST',
    body: JSON.stringify({ lat, lng }),
  });
}

export async function startVisit(payload) {
  return authFetch('/api/mobile/salesman/visit/start', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function endVisit(payload) {
  return authFetch('/api/mobile/salesman/visit/end', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

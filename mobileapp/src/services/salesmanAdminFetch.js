import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../config';

const API_BASE_URL = API_CONFIG.baseUrl;

async function getAuthToken() {
  try {
    return await SecureStore.getItemAsync('clerk_session_token');
  } catch (error) {
    return null;
  }
}

export async function authenticatedFetch(path, options = {}) {
  const token = await getAuthToken();
  const url = `${API_BASE_URL}${path}`;

  const res = await fetch(url, {
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

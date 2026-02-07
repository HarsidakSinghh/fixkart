import { API_CONFIG } from '../config';

const BASE_URL = API_CONFIG.baseUrl;

export async function getSessionRole(token) {
  if (!BASE_URL) {
    throw new Error('Missing API base URL');
  }
  if (!token) {
    throw new Error('Missing auth token');
  }

  const res = await fetch(`${BASE_URL}/api/mobile/me`, {
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

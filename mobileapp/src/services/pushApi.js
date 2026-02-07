import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../config';

const BASE_URL = API_CONFIG.baseUrl;

async function getAuthToken() {
  try {
    return await SecureStore.getItemAsync('clerk_session_token');
  } catch (_) {
    return null;
  }
}

export async function registerPushToken({ token, role, platform }) {
  if (!BASE_URL) return;
  const authToken = await getAuthToken();
  if (!authToken) return;

  await fetch(`${BASE_URL}/api/mobile/push/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ token, role, platform }),
  });
}

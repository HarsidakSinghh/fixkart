import * as SecureStore from 'expo-secure-store';

const AUTH_TOKEN_KEY = 'clerk_session_token';
const USER_DATA_KEY = 'clerk_user';

export async function getAuthToken() {
  try {
    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

export async function setAuthToken(token) {
  try {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
    return true;
  } catch (error) {
    console.error('Error setting auth token:', error);
    return false;
  }
}

export async function clearAuthToken() {
  try {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing auth token:', error);
    return false;
  }
}

export async function setUserData(userData) {
  try {
    await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(userData));
    return true;
  } catch (error) {
    console.error('Error setting user data:', error);
    return false;
  }
}

export async function getUserData() {
  try {
    const userData = await SecureStore.getItemAsync(USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
}

export async function clearAllAuthData() {
  try {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_DATA_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing auth data:', error);
    return false;
  }
}

export async function authenticatedFetch(url, options = {}) {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('No authentication token available');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export default {
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  setUserData,
  getUserData,
  clearAllAuthData,
  authenticatedFetch,
};

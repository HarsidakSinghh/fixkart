import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

// Clerk imports
import { ClerkProvider } from '@clerk/clerk-expo';

// Admin emails from the main admin panel
const ADMIN_EMAILS = ['jka8685@gmail.com', 'info@thefixkart.com', 'sidak798@gmail.com'];

// Auth context
const AuthContext = createContext(null);

// Storage keys (matching your config.js)
const STORAGE_KEYS = {
  clerkUser: 'clerk_user',
  clerkSessionToken: 'clerk_session_token',
  isAdmin: 'is_admin',
  isVendor: 'is_vendor',
  salesmanUser: 'salesman_user',
  salesmanToken: 'salesman_token',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVendor, setIsVendor] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);
  const [salesman, setSalesman] = useState(null);
  const [salesmanToken, setSalesmanToken] = useState(null);

  // Load stored session on mount
  useEffect(() => {
    async function loadStoredSession() {
      try {
        const storedUser = await SecureStore.getItemAsync(STORAGE_KEYS.clerkUser);
        const storedToken = await SecureStore.getItemAsync(STORAGE_KEYS.clerkSessionToken);
        const storedAdmin = await SecureStore.getItemAsync(STORAGE_KEYS.isAdmin);
        const storedVendor = await SecureStore.getItemAsync(STORAGE_KEYS.isVendor);
        const storedSalesman = await SecureStore.getItemAsync(STORAGE_KEYS.salesmanUser);
        const storedSalesmanToken = await SecureStore.getItemAsync(STORAGE_KEYS.salesmanToken);

        if (storedUser) {
          setUser(JSON.parse(storedUser));
          setSessionToken(storedToken);
          setIsAdmin(storedAdmin === 'true');
          setIsVendor(storedVendor === 'true');
        }
        if (storedSalesman) {
          setSalesman(JSON.parse(storedSalesman));
          setSalesmanToken(storedSalesmanToken);
        }
      } catch (error) {
        console.error('Error loading stored session:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadStoredSession();
  }, []);

  // Save session to storage
  const saveSession = useCallback(async (userData, token, adminStatus, vendorStatus = false) => {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.clerkUser, JSON.stringify(userData));
      await SecureStore.setItemAsync(STORAGE_KEYS.clerkSessionToken, token);
      await SecureStore.setItemAsync(STORAGE_KEYS.isAdmin, adminStatus.toString());
      await SecureStore.setItemAsync(STORAGE_KEYS.isVendor, vendorStatus.toString());

      setUser(userData);
      setSessionToken(token);
      setIsAdmin(adminStatus);
      setIsVendor(vendorStatus);
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }, []);

  const updateToken = useCallback(async (token) => {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.clerkSessionToken, token);
      setSessionToken(token);
    } catch (error) {
      console.error('Error updating token:', error);
    }
  }, []);

  const saveSalesmanSession = useCallback(async (salesmanData, token) => {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.salesmanUser, JSON.stringify(salesmanData));
      await SecureStore.setItemAsync(STORAGE_KEYS.salesmanToken, token);
      setSalesman(salesmanData);
      setSalesmanToken(token);
    } catch (error) {
      console.error('Error saving salesman session:', error);
    }
  }, []);

  // Clear session on logout
  const clearSession = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.clerkUser);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.clerkSessionToken);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.isAdmin);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.isVendor);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.salesmanUser);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.salesmanToken);

      setUser(null);
      setSessionToken(null);
      setIsAdmin(false);
      setIsVendor(false);
      setSalesman(null);
      setSalesmanToken(null);
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }, []);

  // Check if user is admin
  const checkAdminStatus = useCallback(async (email) => {
    if (!email) return false;
    const normalized = email.trim().toLowerCase();
    return ADMIN_EMAILS.some((allowed) => allowed.toLowerCase() === normalized);
  }, []);

  const value = {
    user,
    isLoading,
    isAdmin,
    isVendor,
    sessionToken,
    salesman,
    salesmanToken,
    saveSession,
    updateToken,
    saveSalesmanSession,
    clearSession,
    checkAdminStatus,
    isAuthenticated: !!user && !!sessionToken,
    isSalesmanAuthenticated: !!salesman && !!salesmanToken,
  };

  return (
    <AuthContext.Provider value={value}>
      <ClerkProvider
        publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
        tokenCache={{
          getToken: async (key) => {
            try {
              return await SecureStore.getItemAsync(key);
            } catch (error) {
              return null;
            }
          },
          saveToken: async (key, token) => {
            try {
              await SecureStore.setItemAsync(key, token);
            } catch (error) {
              console.error('Error saving token:', error);
            }
          },
          clearToken: async (key) => {
            try {
              await SecureStore.deleteItemAsync(key);
            } catch (error) {
              console.error('Error clearing token:', error);
            }
          },
        }}
      >
        {children}
      </ClerkProvider>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { ADMIN_EMAILS };

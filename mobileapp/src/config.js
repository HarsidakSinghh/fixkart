/**
 * Configuration for the mobile app
 * Centralized configuration file
 */

// Clerk Configuration
export const CLERK_CONFIG = {
  publishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
  // Admin emails that can access the app (must match admin-guard.ts)
  adminEmails: ['jka8685@gmail.com', 'info@thefixkart.com', 'sidak798@gmail.com'],
};

// API Configuration
export const API_CONFIG = {
  baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.2.93:3000',
  timeout: 30000, // 30 seconds
  useMock: process.env.EXPO_PUBLIC_USE_MOCK === 'true',
};

// App Configuration
export const APP_CONFIG = {
  name: 'FixKart Admin',
  version: '1.0.0',
  environment: process.env.EXPO_PUBLIC_ENVIRONMENT || 'development',
};

// Feature Flags
export const FEATURE_FLAGS = {
  enableAnalytics: false,
  enableCrashReporting: false,
  enableDebugMode: true,
};

// Storage Keys
export const STORAGE_KEYS = {
  clerkUser: 'clerk_user',
  clerkSessionToken: 'clerk_session_token',
  isAdmin: 'is_admin',
};

export default {
  CLERK_CONFIG,
  API_CONFIG,
  APP_CONFIG,
  FEATURE_FLAGS,
  STORAGE_KEYS,
};

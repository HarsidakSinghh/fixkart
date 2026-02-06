# Mobile App Implementation Plan

## Overview
Implement Clerk authentication and real database connectivity in the React Native mobile app.

## Current State
- **Tech Stack**: React Native with Expo
- **Authentication**: None (currently uses mock data)
- **Data Source**: Mock data in `src/data/mock.js`
- **API Service**: `src/services/api.js` with mock toggle

## Implementation Steps

### Phase 1: Setup & Dependencies

1. **Install Clerk SDK for React Native**
   - Add `@clerk/clerk-react-native` package
   - Configure ClerkProvider in the app

2. **Create Environment Configuration**
   - Add Clerk publishable key to `.env`
   - Create authentication configuration file

### Phase 2: Authentication Implementation

3. **Create Auth Context**
   - Build `AuthContext.js` to manage authentication state
   - Implement login/logout functions
   - Handle token management

4. **Create Login Screen**
   - Design login screen with Clerk SignIn
   - Handle authentication callbacks
   - Navigate to dashboard on success

5. **Update App.js**
   - Wrap app with ClerkProvider
   - Implement authentication state management
   - Add protected routes

### Phase 3: API Integration

6. **Create Auth API Service**
   - Build `src/services/auth.js` for Clerk token handling
   - Implement API request interceptor for adding auth headers
   - Handle token refresh

7. **Update API Service**
   - Modify `src/services/api.js` to use authenticated requests
   - Remove mock mode by default
   - Add proper error handling

8. **Create Database Service**
   - Build `src/services/database.js` for direct DB operations
   - Implement CRUD operations for all entities
   - Add offline support consideration

### Phase 4: Backend API Updates

9. **Create Mobile Auth Middleware**
   - Build API route to verify Clerk tokens
   - Implement admin authorization check
   - Add user role management

10. **Update Existing API Routes**
    - Modify `/api/mobile/` routes to use Clerk auth
    - Add admin email validation
    - Implement proper error responses

### Phase 5: Testing & Documentation

11. **Test Authentication Flow**
    - Verify login/logout functionality
    - Test admin authorization
    - Test token refresh

12. **Test Data Connectivity**
    - Verify all screens load real data
    - Test CRUD operations
    - Verify error handling

13. **Update Documentation**
    - Document setup process
    - Add environment variable guide
    - Document authentication flow

## File Changes Summary

### New Files to Create:
- `mobileapp/src/services/auth.js` - Authentication service
- `mobileapp/src/context/AuthContext.js` - Auth state management
- `mobileapp/src/screens/LoginScreen.js` - Login screen
- `app/api/mobile/auth/[...clerk]/route.js` - Clerk webhook handler

### Files to Modify:
- `mobileapp/App.js` - Add auth provider and login flow
- `mobileapp/src/services/api.js` - Add auth headers
- `middleware.ts` - Add Clerk auth for mobile API routes
- Create new API routes for mobile authentication

### Environment Variables Required:
```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

## Implementation Order
1. Install dependencies
2. Create environment configuration
3. Set up ClerkProvider
4. Create AuthContext
5. Build LoginScreen
6. Update App.js
7. Create auth API service
8. Update API service
9. Create backend auth routes
10. Test end-to-end flow

## Success Criteria
- Users can log in with Clerk
- Only admin emails can access the app
- All data loads from the database
- Authentication persists across app restarts
- Proper error handling for unauthenticated users

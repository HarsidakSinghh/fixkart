// proxy.ts

import {
  clerkMiddleware,
  createRouteMatcher,
} from '@clerk/nextjs/server';

// Define routes that should be protected
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)', 
  '/admin(.*)',      
  // Add other routes you want to protect here
]);

// Define the main proxy function
export default clerkMiddleware(async (auth, req) => {

  if (isProtectedRoute(req) && !(await auth()).userId) {
    return (await auth()).redirectToSignIn(); // <-- FIX: RETURN the redirect response
  }
  // ----------------------------------------------------
});

export const config = {
  matcher: ['/((?!_next|.+\\.[\\w]+).*)'],
};
import { useEffect } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-expo';
import { useAuth as useCustomAuth } from '../context/AuthContext';

export default function useTokenRefresh() {
  const { getToken, isSignedIn } = useClerkAuth();
  const { user } = useUser();
  const { updateToken } = useCustomAuth();

  const jwtTemplate = process.env.EXPO_PUBLIC_CLERK_JWT_TEMPLATE || 'mobile';

  useEffect(() => {
    let intervalId;

    async function refresh() {
      if (!isSignedIn || !user) return;
      const token = await getToken({ template: jwtTemplate });
      if (token) {
        await updateToken(token);
      }
    }

    refresh();
    intervalId = setInterval(refresh, 5 * 60 * 1000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [getToken, isSignedIn, user, updateToken, jwtTemplate]);
}

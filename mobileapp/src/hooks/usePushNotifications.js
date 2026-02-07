import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { registerPushToken } from '../services/pushApi';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export function usePushNotifications({ enabled, role }) {
  useEffect(() => {
    if (!enabled) return;

    async function register() {
      try {
        if (Notifications.setNotificationChannelAsync) {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance.DEFAULT,
          });
        }
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') return;

        const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        await registerPushToken({
          token: tokenData.data,
          role,
          platform: 'expo',
        });
      } catch (err) {
        console.error('Failed to register push token', err);
      }
    }

    register();
  }, [enabled, role]);
}

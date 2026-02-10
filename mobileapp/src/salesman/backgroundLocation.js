import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { sendSalesmanPing } from './salesmanApi';

export const SALESMAN_LOCATION_TASK = 'salesman-location-task';

TaskManager.defineTask(SALESMAN_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Salesman location task error', error);
    return;
  }
  const locations = data?.locations || [];
  const latest = locations[0];
  if (!latest?.coords) return;
  try {
    await sendSalesmanPing(latest.coords.latitude, latest.coords.longitude);
  } catch (err) {
    console.error('Failed to send background ping', err);
  }
});

export async function startBackgroundTracking() {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') return { ok: false, reason: 'foreground' };

  const bg = await Location.requestBackgroundPermissionsAsync();
  if (bg.status !== 'granted') return { ok: false, reason: 'background' };

  const started = await Location.hasStartedLocationUpdatesAsync(SALESMAN_LOCATION_TASK);
  if (!started) {
    await Location.startLocationUpdatesAsync(SALESMAN_LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 10 * 60 * 1000,
      deferredUpdatesInterval: 10 * 60 * 1000,
      distanceInterval: 0,
      pausesUpdatesAutomatically: true,
      foregroundService: {
        notificationTitle: 'FixKart tracking',
        notificationBody: 'Tracking your location during the work day.',
      },
    });
  }
  return { ok: true };
}

export async function stopBackgroundTracking() {
  const started = await Location.hasStartedLocationUpdatesAsync(SALESMAN_LOCATION_TASK);
  if (started) {
    await Location.stopLocationUpdatesAsync(SALESMAN_LOCATION_TASK);
  }
}

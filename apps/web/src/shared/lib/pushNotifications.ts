import api from './axios';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const pushNotifications = {
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  },

  getPermissionState(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  },

  async requestPermissionAndSubscribe(): Promise<{ success: boolean; token?: string; error?: string }> {
    if (!this.isSupported()) {
      return { success: false, error: 'Push notifications are not supported in this browser' };
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return { success: false, error: 'Push notification permission was denied' };
      }

      // Register or get active service worker
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/',
      });
      await navigator.serviceWorker.ready;

      // Check existing subscription
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

        if (vapidKey && vapidKey.trim()) {
          try {
            const applicationServerKey = urlBase64ToUint8Array(vapidKey.trim());
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: applicationServerKey as unknown as BufferSource,
            });
          } catch {
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
            });
          }
        } else {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
          });
        }
      }

      const token = JSON.stringify(subscription);

      // Register token with backend server
      await api.post('/notifications/fcm-token', { token });

      return { success: true, token };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to register push subscription';
      return { success: false, error: message };
    }
  },

  async unsubscribe(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }
      await api.delete('/notifications/fcm-token');
      return true;
    } catch {
      return false;
    }
  },
};

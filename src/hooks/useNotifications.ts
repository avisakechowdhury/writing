import { useState, useEffect } from 'react';
import { notificationsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { syncPushSubscriptionToServer } from '../utils/pushSubscription';
import { isWebPushClientConfigured } from '../config/push';

type SubscribeOptions = {
  /** If true, do not show error/success toasts (caller handles messaging). */
  quiet?: boolean;
};

export const useNotifications = () => {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    setIsSupported('Notification' in window && 'serviceWorker' in navigator);
    setPermission(Notification.permission);
  }, []);

  const requestPermission = async (options?: { quiet?: boolean }) => {
    const { quiet = false } = options || {};

    if (!isSupported) {
      toast.error('Notifications are not supported in this browser');
      return false;
    }

    try {
      const next = await Notification.requestPermission();
      setPermission(next);

      if (next === 'granted') {
        if (!quiet) {
          toast.success('Notifications enabled!');
        }
        return true;
      }
      if (!quiet) {
        toast.error('Notification permission denied');
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to request notification permission');
      return false;
    }
  };

  const subscribe = async (options: SubscribeOptions = {}): Promise<boolean> => {
    const { quiet = false } = options;

    if (!user || !isSupported || permission !== 'granted') {
      return false;
    }

    if (!isWebPushClientConfigured()) {
      if (!quiet) {
        toast.error(
          'Browser push is not configured in this build. Add VITE_VAPID_PUBLIC_KEY to your hosting environment (same value as VAPID_PUBLIC_KEY on the server), then redeploy the site.'
        );
      }
      return false;
    }

    try {
      const ok = await syncPushSubscriptionToServer();
      if (!ok) {
        if (!quiet) {
          toast.error('Failed to subscribe to notifications. Try again or check your connection.');
        }
        return false;
      }

      setIsSubscribed(true);
      if (!quiet) {
        toast.success('Successfully subscribed to notifications!');
      }

      return true;
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      if (!quiet) {
        toast.error('Failed to subscribe to notifications');
      }
      return false;
    }
  };

  const unsubscribe = async () => {
    try {
      await notificationsAPI.unsubscribe();
      setIsSubscribed(false);
      toast.success('Unsubscribed from notifications');

      return true;
    } catch (error) {
      console.error('Error unsubscribing from notifications:', error);
      toast.error('Failed to unsubscribe from notifications');
      return false;
    }
  };

  /**
   * Creates an in-app notification always (server). Sends web push only if the client
   * is built with VAPID and subscription succeeded — one toast, no conflicting messages.
   */
  const sendTestNotification = async () => {
    try {
      if (permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) return;
      }

      const pushReady = isWebPushClientConfigured();
      let registered = false;
      if (pushReady) {
        registered = await subscribe({ quiet: true });
      }

      const response = await notificationsAPI.sendTest();

      if (!pushReady) {
        toast.success(
          response?.message ||
            'In-app reminder created. For browser push when the app is closed, add VITE_VAPID_PUBLIC_KEY to your frontend build (same as server public key) and redeploy.'
        );
      } else if (registered) {
        toast.success(
          response?.message ||
            'Test sent — you should see a notification (try with Chrome in the background).'
        );
      } else {
        toast.success(
          response?.message ||
            'In-app reminder created. This device could not register for push — check VITE_VAPID_PUBLIC_KEY on your host and try Enable on the feed banner.'
        );
      }

      window.dispatchEvent(new CustomEvent('notifications:updated'));
    } catch (error: unknown) {
      console.error('Error sending test notification:', error);
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
          ? (error as { response: { data: { message: string } } }).response.data.message
          : 'Failed to send test notification';
      toast.error(message);
    }
  };

  return {
    isSupported,
    permission,
    isSubscribed,
    isWebPushConfigured: isWebPushClientConfigured(),
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification
  };
};

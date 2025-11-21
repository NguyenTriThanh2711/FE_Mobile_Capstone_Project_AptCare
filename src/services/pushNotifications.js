// src/services/pushNotifications.js
import messaging from '@react-native-firebase/messaging';
import { store } from '@/src/store';
import {
  addNotificationFromPush,
  fetchUnreadCount,
} from '@/src/features/notifications/notificationsSlice';

// đã có sẵn trong project:
export async function registerForPushAsync() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (!enabled) {
    console.log('[FCM] Permission not granted');
    return null;
  }

  const token = await messaging().getToken();
  console.log('[FCM Token ->]', token);
  return token;
}

// foreground listener
export function attachForegroundListener() {
  const unsubscribe = messaging().onMessage(async (remoteMessage) => {
    console.log('[FCM foreground] message', remoteMessage);

    const data = remoteMessage.data || {};
    // Tuỳ backend gửi gì, tạm map thế này:
    const n = {
      notificationId: Number(data.notificationId) || Date.now(), // fallback
      title: data.title || remoteMessage.notification?.title || 'Thông báo',
      description:
        data.description || remoteMessage.notification?.body || '',
      createdAt: data.createdAt || new Date().toISOString(),
      isRead: false,
      type: data.type || 'General',
    };

    store.dispatch(addNotificationFromPush(n));
    store.dispatch(fetchUnreadCount());
  });

  return unsubscribe;
}

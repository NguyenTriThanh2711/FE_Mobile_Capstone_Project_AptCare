import { Platform, PermissionsAndroid } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
// Xin quyền (Android 13+ cần POST_NOTIFICATIONS, iOS dùng requestPermission)
export async function requestPushPermission() {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    await PermissionsAndroid.request('android.permission.POST_NOTIFICATIONS');
  }
  // iOS (Android sẽ luôn "authorized")
  const status = await messaging().requestPermission();
  return (
    status === messaging.AuthorizationStatus.AUTHORIZED ||
    status === messaging.AuthorizationStatus.PROVISIONAL
  );
}

export async function registerForPushAsync() {
  const ok = await requestPushPermission();
  if (!ok) return null;

  const token = await messaging().getToken();
  console.log('[FCM tokens', token);
  return token;
}

let channelCreated = false;
export async function ensureNotificationChannel() {
  if (channelCreated) return;
  await notifee.createChannel({ id: 'aptcare', name: 'AptCare', importance: AndroidImportance.HIGH });
  channelCreated = true;
}

export function attachForegroundListener() {
  // đảm bảo channel có trước khi hiển thị
  ensureNotificationChannel();
  // lắng nghe tin nhắn khi app đang mở và tự hiển thị
  return messaging().onMessage(async rm => {
    await notifee.displayNotification({
      title: rm.notification?.title ?? 'AptCare',
      body: rm.notification?.body ?? '',
      android: { channelId: 'aptcare' },
      data: rm.data,
    });
  });
}
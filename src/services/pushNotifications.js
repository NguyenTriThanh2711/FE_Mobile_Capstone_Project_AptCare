// src/services/pushNotifications.js
import { Platform, PermissionsAndroid } from 'react-native';
import messaging from '@react-native-firebase/messaging';

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

// Lấy FCM token -> gửi về BE lưu theo userId
export async function registerForPushAsync() {
  const ok = await requestPushPermission();
  if (!ok) return null;

  const token = await messaging().getToken();
  console.log('[FCM token]', token);
  return token;
}

// (tuỳ chọn) listener foreground, muốn hiện noti khi app đang mở
// => cần @notifee/react-native để tự hiển thị
// import notifee, { AndroidImportance } from '@notifee/react-native';
// export function attachForegroundListener() {
//   notifee.createChannel({ id: 'aptcare', name: 'AptCare', importance: AndroidImportance.HIGH });
//   const unsub = messaging().onMessage(async rm => {
//     await notifee.displayNotification({
//       title: rm.notification?.title ?? 'AptCare',
//       body: rm.notification?.body ?? '',
//       android: { channelId: 'aptcare' },
//       data: rm.data,
//     });
//   });
//   return () => unsub();
// }

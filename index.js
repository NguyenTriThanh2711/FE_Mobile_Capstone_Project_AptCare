import messaging from '@react-native-firebase/messaging';

// Background & quit state handler (data-only push)
messaging().setBackgroundMessageHandler(async remoteMessage => {
  // ví dụ: ghi log, hoặc tự hiện local notification (nếu bạn xài notifee)
  console.log('Handled in background:', remoteMessage);
  //No background message handler has been set. Set a handler via the "setBackgroundMessageHandler" method. log da ra nhu v
});

// Giữ entry của Expo Router
import 'expo-router/entry';

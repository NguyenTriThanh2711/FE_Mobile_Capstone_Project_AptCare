// app/_layout.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Slot, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor, useAppSelector, useAppDispatch } from '@/src/store';
import { fetchProfile, logout } from '@/src/features/auth/authSlice';
import '../global.css';
import { MD3LightTheme, Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast, { ErrorToast } from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { startRealtime, stopRealtime } from '@/src/services/realtime';
import http, { setOnAuthFail } from '@/src/services/http';
import * as Notifications from 'expo-notifications';
import { registerForPushAsync } from '@/src/services/pushNotifications';

function AuthGate() {
  const user = useAppSelector((s) => s.auth.user);
  const router = useRouter();
  const segments = useSegments();
  const rootState = useRootNavigationState();
  const dispatch = useAppDispatch();

  const triedBootstrap = useRef(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  //
  // console.log('AuthGate: user =', user); //mocked
  console.log('AuthGate: segments =', segments);
  // nếu chưa có user, thử gọi /me (sử dụng token trong SecureStore)
  useEffect(() => {
    if (!user) return;
    (async () => {
      const fcmToken = await registerForPushAsync();
      console.log('[Token ->] nè', fcmToken);
      if (fcmToken) {
        // gửi token này lên BE của bạn để lưu theo userId
        // await http.post('/notifications/register', { token: fcmToken });
      }
    })();
  }, [user]);
  useEffect(() => {
    console.log('Realtime call')
    if (user) startRealtime().catch(console.warn);
    else stopRealtime().catch(console.warn);
    return () => {};
  }, [user]);
  useEffect(() => {
    (async () => {
      if (triedBootstrap.current) return;
      triedBootstrap.current = true;
      try {
        if (!user) {
          await dispatch(fetchProfile()).unwrap();
        }
      } catch (_) {
        // Không có token hợp lệ -> cứ để user=null
      } finally {
        setBootstrapped(true);
      }
    })();
  }, []);

  // Chờ điều hướng sẵn sàng & bootstrap xong
  useEffect(() => {
    if (!rootState?.key || !bootstrapped) return;
    const top = segments?.[0]; // "(auth)" | "(resident)" | "(technician)" | undefined
    const wantTop = user?.role
      ? user.role === 'Technician'
        ? '(technician)'
        : '(resident)'
      : '(auth)';
    if (!user) {
      if (top !== '(auth)') router.replace('/(auth)/auth');
      return;
    } else if (!user.role) {
      if (top !== '(auth)') router.replace('/(auth)/auth');
      return;
    } else if (top !== wantTop || top === '(auth)') {
      router.replace('/role-gateway');
    }
  }, [user, segments, rootState?.key, bootstrapped]);

  return <Slot />;
}
const toastConfig = {
  error: (props) => (
    <ErrorToast
      {...props}
      // cho phép nhiều dòng hơn
      text1NumberOfLines={2}
      text2NumberOfLines={6}
      text2Style={{ fontSize: 13, lineHeight: 18 }}
      style={{ borderLeftColor: '#ef4444' }}
    />
  ),
};
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate persistor={persistor} loading={null}>
          <PaperProvider theme={MD3LightTheme}>
            <SafeAreaProvider>
              <AuthGate />
              <Toast config={toastConfig} />
            </SafeAreaProvider>
          </PaperProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}

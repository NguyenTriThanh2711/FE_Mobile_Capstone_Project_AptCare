import '@/src/utils/signalr-polyfill';
import React, { useEffect, useRef, useState } from 'react';
import { Slot, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor, useAppSelector, useAppDispatch } from '@/src/store';
import { fetchProfile, logout, registerFcm } from '@/src/features/auth/authSlice';
import '../global.css';
import { MD3LightTheme, Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import http, { setOnAuthFail } from '@/src/services/http';
import {
  attachForegroundListener,
  registerForPushAsync,
} from '@/src/services/pushNotifications';

import useChatGlobalRealtime from '@/src/hooks/useChatGlobalRealtime';
import { fetchMyNotifications, fetchUnreadCount } from '@/src/features/notifications/notificationsSlice';
import { fetchMyConversations } from '@/src/features/chat/chatSlice';
import { toastConfig } from '@/src/helper/toastConfig';

function AuthGate() {
  const user = useAppSelector((s) => s.auth.user);
  const router = useRouter();
  const segments = useSegments();
  const rootState = useRootNavigationState();
  const dispatch = useAppDispatch();

  const triedBootstrap = useRef(false);
  const [bootstrapped, setBootstrapped] = useState(false);

  useChatGlobalRealtime();

  console.log('AuthGate: segments =', segments);

  const fcmAttachedRef = useRef(false);
  useEffect(() => {
    if (!user) return;
    if (fcmAttachedRef.current) return;

    let unsubscribeForeground = null;
    (async () => {
      const fcmToken = await registerForPushAsync();
      if (!fcmToken) return;

      await dispatch(registerFcm({ fcmToken }));
      unsubscribeForeground = attachForegroundListener();
      fcmAttachedRef.current = true;
    })();

    return () => {
      if (unsubscribeForeground) unsubscribeForeground();
      fcmAttachedRef.current = false;
    };
  }, [user?.userId, dispatch]);
  
  useEffect(() => {
    (async () => {
      if (triedBootstrap.current) return;
      triedBootstrap.current = true;
      try {
        if (!user) {
          await dispatch(fetchProfile()).unwrap();
        }
      } catch (_) {
      } finally {
        setBootstrapped(true);
      }
    })();
  }, [dispatch, user]);
  //fetch notifications sau khi bootstrap xong 
  useEffect(() => {
  if (!user || !bootstrapped) return;
  dispatch(fetchMyNotifications({ page: 1, size: 20 }));
  dispatch(fetchMyConversations());
  dispatch(fetchUnreadCount());
}, [user, bootstrapped, dispatch]);

  // handler 401 -> logout
  useEffect(() => {
    setOnAuthFail(async (reason) => {
      console.log('[HTTP onAuthFail]', reason);
      try {
        await dispatch(logout()).unwrap();
      } catch (e) {
        console.warn('logout error', e);
      }
      router.replace('/(auth)/auth');
    });

    return () => setOnAuthFail(null);
  }, [dispatch, router]);

  // điều hướng theo role
  useEffect(() => {
    if (!rootState?.key || !bootstrapped) return;
    const top = segments?.[0];
    const wantTop = user?.role
      ? user.role === 'Technician'
        ? '(technician)'
        : '(resident)'
      : '(auth)';

    if (!user || !user.role) {
      if (top !== '(auth)') router.replace('/(auth)/auth');
      return;
    } else if (top !== wantTop || top === '(auth)') {
      router.replace('/role-gateway');
    }
  }, [user, segments, rootState?.key, bootstrapped, router]);

  return <Slot />;
}



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

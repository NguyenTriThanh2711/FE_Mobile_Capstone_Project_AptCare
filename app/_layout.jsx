// app/_layout.jsx
import React, { useEffect, useRef, useState } from "react";
import { Slot, useRouter, useSegments, useRootNavigationState } from "expo-router";
import { Provider, useSelector, useDispatch } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/src/store";
import { fetchProfile } from "@/src/features/auth/authSlice";
import '../global.css';
import { MD3LightTheme, Provider as PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { GestureHandlerRootView } from "react-native-gesture-handler";

function AuthGate() {
  const user = useSelector((s) => s.auth.user);
  const router = useRouter();
  const segments = useSegments();
  const rootState = useRootNavigationState();
  const dispatch = useDispatch();

  const triedBootstrap = useRef(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  console.log("AuthGate: user =", user);//mocked
  console.log("AuthGate: segments =", segments);
  // nếu chưa có user, thử gọi /me (sử dụng token trong SecureStore)
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
    const top = segments?.[0];                // "(auth)" | "(resident)" | "(technician)" | undefined
    const wantTop = user?.role
      ? user.role === "Technician"
        ? "(technician)"
        : "(resident)"
      : "(auth)";
    if (!user) {
      if (top !== "(auth)") router.replace("/(auth)/auth");
      return;
    } else if (!user.role ) {
      if (top !== "(auth)") router.replace("/(auth)/auth");
      return;
    }
    else if (top !== wantTop || top === "(auth)") {
     router.replace("/role-gateway");
   }
  }, [user, segments, rootState?.key, bootstrapped]);

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
              <Toast />
            </SafeAreaProvider>
          </PaperProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}

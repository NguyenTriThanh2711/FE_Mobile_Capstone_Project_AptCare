// app/_layout.jsx
import React, { useEffect, useRef, useState } from "react";
import { Slot, useRouter, useSegments, useRootNavigationState } from "expo-router";
import { Provider, useSelector, useDispatch } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/src/store";
import { fetchProfile } from "@/src/features/auth/authSlice";
import '../global.css';
import { MD3LightTheme, Provider as PaperProvider } from "react-native-paper";

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
    const inAuth = segments?.[0] === "(auth)"; 
    if (!user && !inAuth) {
      router.replace("/(auth)/login");
    } else if (user && inAuth) {
      // Đưa vào role gateway để tự điều hướng theo role
      //  router.replace("/role-gateway");
       router.replace("/(auth)/login");
    }
  }, [user, segments, rootState?.key, bootstrapped]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <PersistGate persistor={persistor} loading={null}>
          <PaperProvider theme={MD3LightTheme}>
            <AuthGate />
          </PaperProvider>
      </PersistGate>
    </Provider>
  );
}

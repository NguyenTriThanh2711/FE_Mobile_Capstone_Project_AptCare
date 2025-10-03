import * as SecureStore from "expo-secure-store";
const K = { access: "aptcare_access", refresh: "aptcare_refresh" };

export async function saveTokens({ access, refresh }) {
  if (access) await SecureStore.setItemAsync(K.access, access);
  if (refresh) await SecureStore.setItemAsync(K.refresh, refresh);
}
export async function getAccessToken() { return SecureStore.getItemAsync(K.access); }
export async function getRefreshToken() { return SecureStore.getItemAsync(K.refresh); }
export async function clearTokens() {
  await SecureStore.deleteItemAsync(K.access);
  await SecureStore.deleteItemAsync(K.refresh);
}
// để lưu các thông tin nhạy cảm như token, tránh bị người khác đọc trộm
// xem thêm: https://docs.expo.dev/versions/latest/sdk/securestore/
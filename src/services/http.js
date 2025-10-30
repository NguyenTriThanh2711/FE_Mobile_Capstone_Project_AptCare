import axios from 'axios';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from './secure-store';
import { Platform } from 'react-native';
const BASE_URL = Platform.select({
  android: process.env.EXPO_PUBLIC_API_URL_ANDROID_EMU || process.env.EXPO_PUBLIC_API_URL,
  ios:     process.env.EXPO_PUBLIC_API_URL_IOS_SIM   || process.env.EXPO_PUBLIC_API_URL,
  default: process.env.EXPO_PUBLIC_API_URL,
});
console.log("[HTTP] BASE_URL =", BASE_URL);
const http = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// ---- Gắn access token vào mọi request
http.interceptors.request.use(async (config) => {
  const { method, url, baseURL } = config;
  // endpoint chính là `url` trong axios config
  console.log(`[HTTP ->] ${method?.toUpperCase()} ${baseURL}${url}`);
  if (config.params) console.log("[HTTP ->] params:", JSON.stringify(config.params));
  if (config.data)   console.log("[HTTP ->] body:",   JSON.stringify(config.data));
  const access = await getAccessToken();
  if (access) config.headers.Authorization = `Bearer ${access}`;
  return config;
});

// ---- Refresh token 1 lần, xếp hàng các request khác đợi refresh xong
let isRefreshing = false;
let queue = []; // mỗi item: {resolve, reject, config}

const processQueue = (error, token = null) => {
  queue.forEach((p) => {
    if (error) p.reject(error);
    else {
      if (token) p.config.headers.Authorization = `Bearer ${token}`;
      p.resolve(http(p.config));
    }
  });
  queue = [];
};

// ---- Response interceptor
http.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;

    const status = error?.response?.status;
    const isAuthEndpoint = original?.url?.includes('/auth/');

    // Nếu 401 và chưa thử refresh, thực hiện refresh
    if (status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true;

      if (isRefreshing) {
        // đẩy request vào hàng đợi, chờ refresh xong
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject, config: original });
        });
      }

      isRefreshing = true;

      try {
        const refresh = await getRefreshToken();
        if (!refresh) throw new Error('Không có refresh token');

        // gọi API refresh token
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh`,
          { refresh },
          { timeout: 10000 }
        );
        // data: { access, refresh? }
        await saveTokens({ access: data.access, refresh: data.refresh });

        // gắn token mới và retry request cũ
        original.headers.Authorization = `Bearer ${data.access}`;
        processQueue(null, data.access);
        return http(original);
      } catch (e) {
        processQueue(e, null);
        await clearTokens();
        // tuỳ bạn: điều hướng về login ở UI
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default http;

// Nếu nhận 401, axios thử POST /auth/refresh với refresh token.
// Trong lúc refresh, các request khác 401 sẽ xếp hàng chờ; khi refresh xong, tự động retry.
// Nếu refresh fail → xoá token, bạn có thể điều hướng về login.

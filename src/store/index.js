// src/store/index.js
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, createTransform } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import auth from '@/src/features/auth/authSlice';
import requests from '@/src/features/requests/requestsSlice';
import workslots from '@/src/features/technician/workSlotsSlice';
import issues from '@/src/features/issues/issuesSlice';
import slots from '@/src/features/slots/slotsSlice';
import appointments from '@/src/features/appointments/appointmentsSlice';
import chat from '@/src/features/chat/chatSlice';
import inspectionReports from '@/src/features/inspectionReport/inspectionRPSlice';
// --- Chỉ persist "user" của auth (KHÔNG persist status/error/token)
const authTransform = createTransform(
  (inboundState) => ({ user: inboundState.user }),
  (outboundState) => outboundState,
  { whitelist: ['auth'] }
);

// --- Với requests, ví dụ chỉ lưu "list" (tùy nhu cầu của bạn)
const requestsTransform = createTransform(
  (inboundState) => ({ list: inboundState.list ?? [], current: null }),
  (outboundState) => outboundState,
  { whitelist: ['requests'] }
);

const rootReducer = combineReducers({
  auth,
  requests,
  workslots,
  issues,
  slots,
  appointments,
  chat,
  inspectionReports,
});

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'requests'],
  transforms: [authTransform, requestsTransform],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (gDM) =>
    gDM({
      serializableCheck: false, // cần tắt cho redux-persist + RN
    }),
});

export const persistor = persistStore(store);

// (tuỳ chọn) export hooks ở đây cho gọn
export * from './hooks';

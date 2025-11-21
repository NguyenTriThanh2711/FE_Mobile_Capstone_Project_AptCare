// src/features/notifications/notificationsSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import http from '@/src/services/http';
import { dotnetArr } from '@/src/helper/dotnetArr';

// ===== Thunks =====

// Lấy danh sách thông báo của user hiện tại
export const fetchMyNotifications = createAsyncThunk(
  'notifications/fetchMyNotifications',
  async ({ page = 1, size = 20, search, filter, sortBy } = {}, { rejectWithValue }) => {
    try {
      const params = { page, size };
      if (search) params.search = search;
      if (filter) params.filter = filter; // "read" | "not-read"
      if (sortBy) params.sortBy = sortBy;

      const { data } = await http.get('/api/notifications/my', { params });
      const items = dotnetArr(data?.items);
      return {
        page: data?.page ?? page,
        size: data?.size ?? size,
        total: data?.total ?? items.length,
        totalPages: data?.totalPages ?? 1,
        items,
      };
    } catch (err) {
      const res = err?.response;
      return rejectWithValue(
        res?.data?.detail || res?.data || err?.message || 'Tải thông báo thất bại'
      );
    }
  }
);

// Lấy số lượng thông báo chưa đọc
export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await http.get('/api/notifications/my/unread-count');
      // API trả về số (number)
      return Number(data) || 0;
    } catch (err) {
      const res = err?.response;
      return rejectWithValue(
        res?.data?.detail || res?.data || err?.message || 'Không lấy được số thông báo chưa đọc'
      );
    }
  }
);

// Đánh dấu đã đọc
export const markNotificationsRead = createAsyncThunk(
  'notifications/markNotificationsRead',
  async (ids, { rejectWithValue }) => {
    try {
      if (!Array.isArray(ids) || ids.length === 0) return [];
      await http.patch('/api/notifications/mark-as-read', ids);
      return ids;
    } catch (err) {
      const res = err?.response;
      return rejectWithValue(
        res?.data?.detail || res?.data || err?.message || 'Đánh dấu thông báo thất bại'
      );
    }
  }
);

// Broadcast (Manager / TechnicianLead)
export const broadcastNotification = createAsyncThunk(
  'notifications/broadcastNotification',
  async ({ title, description, type }, { rejectWithValue }) => {
    try {
      const payload = { title, description, type }; // type: "General" | "Internal"
      const { data } = await http.post('/api/notifications/broadcast', payload);
      return data;
    } catch (err) {
      const res = err?.response;
      return rejectWithValue(
        res?.data?.detail || res?.data || err?.message || 'Gửi thông báo thất bại'
      );
    }
  }
);

// ===== Slice =====

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    list: [],          // newest-first
    page: 1,
    size: 20,
    totalPages: 1,
    total: 0,

    loading: false,
    refreshing: false,
    loadingMore: false,
    error: null,

    unreadCount: 0,
  },
  reducers: {
    // Realtime từ FCM: thêm 1 noti mới vào đầu list
    addNotificationFromPush(state, action) {
      const n = action.payload;
      if (!n?.notificationId) {
        return;
      }
      const exists = state.list.some((x) => x.notificationId === n.notificationId);
      if (!exists) {
        state.list = [n, ...state.list];
        state.total += 1;
      }
      // tăng unread
      if (!n.isRead) {
        state.unreadCount = (state.unreadCount || 0) + 1;
      }
    },
    // Đặt unreadCount = 0 (vd khi mở màn hình)
    clearNotificationsUnread(state) {
      state.unreadCount = 0;
      // đồng bộ isRead luôn (optional)
      state.list = state.list.map((x) => ({ ...x, isRead: true }));
    },
  },
  extraReducers: (builder) => {
    // fetchMyNotifications
    builder.addCase(fetchMyNotifications.pending, (state, action) => {
      const { page = 1 } = action.meta?.arg || {};
      if (page === 1) {
        state.refreshing = true;
      } else {
        state.loadingMore = true;
      }
      state.error = null;
    });
    builder.addCase(fetchMyNotifications.fulfilled, (state, action) => {
      const { page, items, totalPages, total, size } = action.payload;
      state.page = page;
      state.size = size;
      state.totalPages = totalPages;
      state.total = total;

      if (page === 1) {
        state.list = items || [];
        state.refreshing = false;
      } else {
        // thêm phía sau (older)
        state.list = [...state.list, ...(items || [])];
        state.loadingMore = false;
      }
    });
    builder.addCase(fetchMyNotifications.rejected, (state, action) => {
      const { page = 1 } = action.meta?.arg || {};
      if (page === 1) state.refreshing = false;
      else state.loadingMore = false;
      state.error = action.payload || action.error?.message || 'Tải thông báo thất bại';
    });

    // fetchUnreadCount
    builder.addCase(fetchUnreadCount.fulfilled, (state, action) => {
      state.unreadCount = action.payload ?? 0;
    });

    // markNotificationsRead
    builder.addCase(markNotificationsRead.fulfilled, (state, action) => {
      const ids = action.payload || [];
      if (!Array.isArray(ids) || ids.length === 0) return;

      state.list = state.list.map((n) =>
        ids.includes(n.notificationId) ? { ...n, isRead: true } : n
      );

      // Giảm unreadCount tương ứng
      const unreadBefore = state.list.filter((n) => !n.isRead).length;
      state.unreadCount = unreadBefore;
    });
  },
});

export default notificationsSlice.reducer;
export const {
  addNotificationFromPush,
  clearNotificationsUnread,
} = notificationsSlice.actions;

// ===== Selectors =====
export const selectNotifications = (s) => s.notifications?.list || [];
export const selectNotificationsPaging = (s) => ({
  page: s.notifications?.page || 1,
  totalPages: s.notifications?.totalPages || 1,
  refreshing: s.notifications?.refreshing || false,
  loadingMore: s.notifications?.loadingMore || false,
});
export const selectNotificationsUnreadCount = (s) =>
  s.notifications?.unreadCount || 0;
export const selectNotificationsError = (s) => s.notifications?.error || null;

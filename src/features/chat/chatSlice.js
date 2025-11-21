// src/features/chat/chatSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import http from '@/src/services/http';
import { dotnetArr } from '@/src/helper/dotnetArr';
import { pretty } from '@/src/helper/prettyLog';

// =============== Thunks ===============
export const fetchMyConversations = createAsyncThunk(
  'chat/fetchMyConversations',
  async () => {
    const { data } = await http.get('/api/conversations/my');
    // console.log('http.get(/api/conversations/my)', pretty(data));
    return dotnetArr(data);
  }
);

export const createConversation = createAsyncThunk(
  'chat/createConversation',
  async ({ title, userIds }, { rejectWithValue }) => {
    try {
      const { data, status } = await http.post('/api/conversations', { title, userIds });
      return { data, status };
    } catch (err) {
      const res = err?.response;
      return rejectWithValue(
        res?.data?.detail || res?.data || err?.message || 'Tạo cuộc trò chuyện thất bại'
      );
    }
  }
);

export const getConversation = createAsyncThunk('chat/getConversation', async (id) => {
  const { data } = await http.get(`/api/conversations/${id}`);
  return data;
});

export const muteConversation = createAsyncThunk('chat/mute', async (id) => {
  const { data } = await http.patch(`/api/conversations/${id}/mute`);
  return { id, data };
});

export const unmuteConversation = createAsyncThunk('chat/unmute', async (id) => {
  const { data } = await http.patch(`/api/conversations/${id}/unmute`);
  return { id, data };
});

// Messages
export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async ({ conversationId, before, pageSize = 20 }) => {
    const params = { conversationId, pageSize };
    if (before) params.before = before;
    const { data } = await http.get('/api/messages', { params });
    // data.items newest-first -> đổi thành newest-last
    const items = dotnetArr(data?.items).slice().reverse();
    return {
      conversationId,
      items,
      raw: data,
      beforeUsed: before || null,
    };
  }
);

export const sendTextMessage = createAsyncThunk(
  'chat/sendTextMessage',
  async ({ conversationId, content, replyMessageId }, { rejectWithValue }) => {
    try {
      const payload = { conversationId, content };
      if (replyMessageId) payload.replyMessageId = replyMessageId;
      const { data } = await http.post('/api/messages/text', payload);
      return data;
    } catch (err) {
      const res = err?.response;
      return rejectWithValue(
        res?.data?.detail || res?.data || err?.message || 'Gửi tin nhắn thất bại'
      );
    }
  }
);

export const checkExistingConversation = createAsyncThunk(
  'chat/checkExistingConversation',
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await http.get(`/api/conversations/check-existing/${userId}`);
      if (data === null) return null;
      const num = Number(data);
      if (Number.isNaN(num) || num === 0) return null;
      return num;
    } catch (err) {
      const res = err?.response;
      return rejectWithValue(
        res?.data?.detail || res?.data || err?.message || 'Kiểm tra hội thoại thất bại'
      );
    }
  }
);

export const sendFileMessage = createAsyncThunk(
  'chat/sendFileMessage',
  async ({ conversationId, file }, { rejectWithValue }) => {
    try {
      const fd = new FormData();
      fd.append('file', {
        uri: file?.uri,
        name: file?.name || 'upload',
        type: file?.type || 'application/octet-stream',
      });
      const { data } = await http.post('/api/messages/file', fd, {
        params: { conversationId },
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    } catch (err) {
      const res = err?.response;
      return rejectWithValue(
        res?.data?.detail || res?.data || err?.message || 'Gửi tệp thất bại'
      );
    }
  }
);

export const markDelivered = createAsyncThunk(
  'chat/markDelivered',
  async (conversationId) => {
    await http.patch(`/api/messages/${conversationId}/mark-as-delivered`);
    return { conversationId };
  }
);

export const markRead = createAsyncThunk(
  'chat/markRead',
  async (conversationId) => {
    await http.patch(`/api/messages/${conversationId}/mark-as-read`);
    return { conversationId };
  }
);

// =============== Helper: tránh trùng message ===============
function pushMessageUnique(box, msg) {
  if (!box.messages) box.messages = [];

  const id = msg.messageId;
  const localId = msg.localId;

  const exists = box.messages.some((x) => {
    if (id != null && x.messageId === id) return true;
    if (localId != null && x.localId === localId) return true;
    return false;
  });

  if (!exists) {
    box.messages = [...box.messages, msg];
  }
}

// =============== Slice ===============
const slice = createSlice({
  name: 'chat',
  initialState: {
    // conversations list
    list: [],
    loadingChat: false,
    errorChat: null,

    // detail
    byId: {},
    sending: false,
    sendError: null,
    creating: false,
    createError: null,

    unreadByConv: {}, // { [conversationId]: number }
    currentConversationId: null, // 👈 đang mở phòng nào
  },
  reducers: {
    prependLocalMessage(state, action) {
      const m = action.payload;
      const box =
        state.byId[m.conversationId] ||
        (state.byId[m.conversationId] = { info: null, messages: [] });
      box.messages.push(m);
    },
    clearChat(state) {
      state.list = [];
      state.byId = {};
      state.unreadByConv = {};
      state.currentConversationId = null;
    },
    incomingMessage(state, action) {
      const m = action.payload;
      const cid = m.conversationId;
      if (!cid) return;

      const box =
        state.byId[cid] ||
        (state.byId[cid] = {
          info: null,
          messages: [],
          loadingChat: false,
          canLoadMore: true,
          oldestCursor: null,
        });

      // thêm message, tránh trùng
      pushMessageUnique(box, m);

      // cập nhật lastMessage cho list
      const idx = state.list.findIndex((x) => x.conversationId === cid);
      if (idx >= 0) {
        const updated = {
          ...state.list[idx],
          lastMessage: m.content,
          updatedAt: m.createdAt,
        };
        state.list.splice(idx, 1);
        state.list.unshift(updated);  // đưa lên đầu
      }

      // nếu KHÔNG phải phòng đang mở -> tăng unread
      if (cid !== state.currentConversationId && !m.isRead) {
        state.unreadByConv[cid] = (state.unreadByConv[cid] || 0) + 1;
      }
    },
    clearUnreadLocal(state, action) {
      const cid = action.payload;
      state.unreadByConv[cid] = 0;
    },
    // 👇 action mới: set phòng đang mở để tính unread
    setCurrentConversationId(state, action) {
      const cid = action.payload ?? null;
      state.currentConversationId = cid;
      if (cid != null) {
        state.unreadByConv[cid] = 0;
      }
    },
  },
  extraReducers: (b) => {
    // fetch my conversations
    b.addCase(fetchMyConversations.pending, (s) => {
      s.loadingChat = true;
      s.errorChat = null;
    });
    b.addCase(fetchMyConversations.fulfilled, (s, a) => {
      s.loadingChat = false;
      s.list = a.payload || [];
      s.list.forEach((c) => {
        if (!(c.conversationId in s.unreadByConv)) {
          s.unreadByConv[c.conversationId] = 0;
        }
      });
    });
    b.addCase(fetchMyConversations.rejected, (s, a) => {
      s.loadingChat = false;
      s.errorChat = a.error?.message || 'Tải danh sách trò chuyện thất bại';
    });

    // create conv
    b.addCase(createConversation.pending, (s) => {
      s.creating = true;
      s.createError = null;
    });
    b.addCase(createConversation.fulfilled, (s) => {
      s.creating = false;
    });
    b.addCase(createConversation.rejected, (s, a) => {
      s.creating = false;
      s.createError = a.payload || a.error;
    });

    // get conv
    b.addCase(getConversation.fulfilled, (s, a) => {
      const info = a.payload;
      const id = info?.conversationId;
      if (!id) return;
      if (!s.byId[id]) {
        s.byId[id] = {
          info,
          messages: [],
          loadingChat: false,
          canLoadMore: true,
          oldestCursor: null,
        };
      } else {
        s.byId[id].info = info;
      }
    });

    // mute/unmute reflect flag
    b.addCase(muteConversation.fulfilled, (s, a) => {
      const id = a.payload?.id;
      const i = s.list.findIndex((x) => x.conversationId === id);
      if (i >= 0) s.list[i] = { ...s.list[i], isMuted: true };
      if (s.byId[id]?.info) s.byId[id].info.isMuted = true;
    });
    b.addCase(unmuteConversation.fulfilled, (s, a) => {
      const id = a.payload?.id;
      const i = s.list.findIndex((x) => x.conversationId === id);
      if (i >= 0) s.list[i] = { ...s.list[i], isMuted: false };
      if (s.byId[id]?.info) s.byId[id].info.isMuted = false;
    });

    // fetch messages (prepend old)
    b.addCase(fetchMessages.pending, (s, a) => {
      const { conversationId } = a.meta.arg;
      const box =
        s.byId[conversationId] ||
        (s.byId[conversationId] = { info: null, messages: [] });
      box.loadingChat = true;
    });
    b.addCase(fetchMessages.fulfilled, (s, a) => {
      const { conversationId, items } = a.payload;
      const box =
        s.byId[conversationId] ||
        (s.byId[conversationId] = { info: null, messages: [] });
      box.loadingChat = false;

      if (a.payload.beforeUsed) {
        box.messages = [...items, ...box.messages];
      } else {
        box.messages = items; // first load
        s.unreadByConv[conversationId] = 0;
      }

      const oldest = box.messages[0];
      box.oldestCursor = oldest ? oldest.createdAt : null;

      const total = a.payload?.raw?.total || 0;
      const size = a.payload?.raw?.size || 20;
      const page = a.payload?.raw?.page || 1;
      const totalPages =
        a.payload?.raw?.totalPages || Math.ceil(total / (size || 20));
      box.canLoadMore = page < totalPages;
    });
    b.addCase(fetchMessages.rejected, (s, a) => {
      const { conversationId } = a.meta.arg || {};
      const box = s.byId[conversationId];
      if (box) box.loadingChat = false;
    });

    // send text/file -> append
    b.addCase(sendTextMessage.pending, (s) => {
      s.sending = true;
      s.sendError = null;
    });
    b.addCase(sendFileMessage.pending, (s) => {
      s.sending = true;
      s.sendError = null;
    });
    b.addCase(sendTextMessage.fulfilled, (s, a) => {
      s.sending = false;
      const m = a.payload;
      const box =
        s.byId[m.conversationId] ||
        (s.byId[m.conversationId] = { info: null, messages: [] });
      pushMessageUnique(box, m);
    });
    b.addCase(sendFileMessage.fulfilled, (s, a) => {
      s.sending = false;
      const m = a.payload;
      const box =
        s.byId[m.conversationId] ||
        (s.byId[m.conversationId] = { info: null, messages: [] });
      pushMessageUnique(box, m);
    });
    b.addCase(sendTextMessage.rejected, (s, a) => {
      s.sending = false;
      s.sendError = a.payload || a.errorChat;
    });
    b.addCase(sendFileMessage.rejected, (s, a) => {
      s.sending = false;
      s.sendError = a.payload || a.errorChat;
    });

    // markDelivered: chỉ báo server, KHÔNG reset unread
    b.addCase(markDelivered.fulfilled, (s, a) => {
      // const cid = a.payload?.conversationId;
      // nếu cần có thể log, nhưng không đụng unread
    });

    // markRead: user đã xem -> reset unread
    b.addCase(markRead.fulfilled, (s, a) => {
      const cid = a.payload?.conversationId;
      if (cid != null) s.unreadByConv[cid] = 0;
    });
  },
});

export default slice.reducer;
export const {
  prependLocalMessage,
  clearChat,
  clearUnreadLocal,
  incomingMessage,
  setCurrentConversationId,
} = slice.actions;

// =============== Selectors ===============
export const selectConversations = (s) => s.chat?.list || [];
export const selectConversationsLoading = (s) => s.chat?.loadingChat || false;
export const selectConversationBox =
  (id) =>
  (s) =>
    s.chat?.byId[id] || {
      info: null,
      messages: [],
      loadingChat: false,
      canLoadMore: true,
      oldestCursor: null,
    };
export const selectChatSending = (s) => s.chat?.sending || false;

export const selectUnreadByConv = (s) => s.chat?.unreadByConv || {};
export const selectHasAnyUnread = (s) =>
  Object.values(s.chat?.unreadByConv || {}).some((n) => n > 0);
export const selectCurrentConversationId = (s) =>
  s.chat?.currentConversationId ?? null;

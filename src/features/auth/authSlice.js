import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import http from '@/src/services/http';
import { saveTokens, clearTokens } from '@/src/services/secure-store';

const initialState = {
  user: null,      // { id, email, fullName, role: 'resident' | 'technician' | 'manager' }
  status: 'idle',  // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

/**
 * POST /auth/login  -> { user, tokens: { access, refresh } }
 */
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      // const { data } = await http.post('/auth/login', { email, password });//mocked
      const data = { 
                    user: { 
                      UserID: 1, 
                      FullName: "Test User" ,
                      Phone: "123456789",
                      Email: "test@example.com",
                      CitizenshipIdentity: "123456789",
                      role: "resident",
                      Apartment:"A101",
                    },
                    tokens: {
                      access: "mocked_access_token",
                      refresh: "mocked_refresh_token",
                    },
                  };
      if (data?.tokens) await saveTokens(data.tokens);
      return data.user;
    } catch (err) {
      const message = err?.response?.data?.message || 'Đăng nhập thất bại';
      return rejectWithValue(message);
    }
  }
);

/**
 * POST /auth/register -> { user, tokens? }
 */
export const register = createAsyncThunk(
  'auth/register',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await http.post('/auth/register', payload);
      // Tuỳ BE: nếu trả tokens thì lưu, nếu không thì bỏ qua
      if (data?.tokens) await saveTokens(data.tokens);
      return data?.user ?? true;
    } catch (err) {
      const message = err?.response?.data?.message || 'Đăng ký thất bại';
      return rejectWithValue(message);
    }
  }
);

/**
 * GET /me -> user
 * Dùng khi app khởi động hoặc sau khi login để đồng bộ role/profile
 */
export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      // const { data } = await http.get('/me'); //mocked
      const data = { 
                    UserID: 1, 
                    FullName: "Test User" ,
                    Phone: "123456789",
                    Email: "test@example.com",
                    CitizenshipIdentity: "123456789",
                    role: "resident",
                    Apartment:"A101",
                  }; // mocked
      return data;
    } catch (err) {
      const message = err?.response?.data?.message || 'Không lấy được hồ sơ';
      return rejectWithValue(message);
    }
  }
);

/**
 * POST /me/change-password
 */
export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      await http.post('/me/change-password', { currentPassword, newPassword });
      return true;
    } catch (err) {
      const message = err?.response?.data?.message || 'Đổi mật khẩu thất bại';
      return rejectWithValue(message);
    }
  }
);

/**
 * POST /auth/forgot  (gửi email/otp khôi phục)
 */
export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async ({ email }, { rejectWithValue }) => {
    try {
      await http.post('/auth/forgot', { email });
      return true;
    } catch (err) {
      const message = err?.response?.data?.message || 'Gửi yêu cầu quên mật khẩu thất bại';
      return rejectWithValue(message);
    }
  }
);

/**
 * Logout: xoá token + dọn Redux state
 */
export const logout = createAsyncThunk('auth/logout', async () => {
  await clearTokens();
  try {
   const mod = await import("@/src/services/http");
   delete mod.default.defaults.headers.common["Authorization"];
  } catch {} // dọn axios header + persist khi logout 
  return true;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Tuỳ lúc cần set user thủ công (vd: cập nhật profile trong màn Profile)
    setUser(state, action) {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    // --- LOGIN
    builder
      .addCase(login.pending, (s) => {
        s.status = 'loading';
        s.error = null;
      })
      .addCase(login.fulfilled, (s, a) => {
        s.status = 'succeeded';
        s.user = a.payload;
      })
      .addCase(login.rejected, (s, a) => {
        s.status = 'failed';
        s.error = a.payload || a.error.message;
      });

    // --- REGISTER
    builder
      .addCase(register.pending, (s) => {
        s.status = 'loading';
        s.error = null;
      })
      .addCase(register.fulfilled, (s, a) => {
        s.status = 'succeeded';
        if (a.payload && a.payload !== true) s.user = a.payload;
      })
      .addCase(register.rejected, (s, a) => {
        s.status = 'failed';
        s.error = a.payload || a.error.message;
      });

    // --- FETCH PROFILE
    builder
      .addCase(fetchProfile.pending, (s) => {
        s.status = 'loading';
        s.error = null;
      })
      .addCase(fetchProfile.fulfilled, (s, a) => {
        s.status = 'succeeded';
        s.user = a.payload;
      })
      .addCase(fetchProfile.rejected, (s, a) => {
        s.status = 'failed';
        s.error = a.payload || a.error.message;
      });

    // --- CHANGE PASSWORD
    builder
      .addCase(changePassword.pending, (s) => {
        s.status = 'loading';
        s.error = null;
      })
      .addCase(changePassword.fulfilled, (s) => {
        s.status = 'succeeded';
      })
      .addCase(changePassword.rejected, (s, a) => {
        s.status = 'failed';
        s.error = a.payload || a.error.message;
      });

    // --- FORGOT PASSWORD
    builder
      .addCase(forgotPassword.pending, (s) => {
        s.status = 'loading';
        s.error = null;
      })
      .addCase(forgotPassword.fulfilled, (s) => {
        s.status = 'succeeded';
      })
      .addCase(forgotPassword.rejected, (s, a) => {
        s.status = 'failed';
        s.error = a.payload || a.error.message;
      });

    // --- LOGOUT
    builder.addCase(logout.fulfilled, (s) => {
      s.user = null;
      s.status = 'idle';
      s.error = null;
    });
  },
});

export const { setUser } = authSlice.actions;

// ---- Selectors gọn gàng cho UI
export const selectUser = (state) => state.auth.user;
export const selectRole = (state) => state.auth.user?.role ?? null;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;

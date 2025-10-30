import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import http from '@/src/services/http';
import { saveTokens, clearTokens } from '@/src/services/secure-store';
import { getDeviceId } from '@/src/services/device-id';

const initialState = {
  user: null,
  status: 'idle',
  error: null,

  needsPasswordChange: false,
  pendingAccountId: null,

  registerAccountId: null,
  otpStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  otpError: null,
};

/**
 * POST /auth/login  -> {  access, refresh  }
 */
export const login = createAsyncThunk(
  'auth/login',
  async ({ usernameOrEmail, password }, { dispatch, rejectWithValue, getState }) => {
    try {
      const deviceInfo = await getDeviceId();
      const body = {
        usernameOrEmail,
        password,
        deviceInfo,
      };
      const { data } = await http.post('/auth/login', body);
      console.log('res http.post(/auth/login, body);', data);
      const acessTK = data?.accessToken;
      const refreshTK = data?.refreshToken;
      if (acessTK && refreshTK) {
        await saveTokens({ access: acessTK, refresh: refreshTK });
      }
      const me = await dispatch(fetchProfile())
        .unwrap()
        .catch(() => null);
      return me || true;
    } catch (err) {
      const res = err?.response;
      if (res?.status === 403 && res?.data?.message === 'PASSWORD_CHANGE_REQUIRED') {
        return rejectWithValue({
          type: 'PASSWORD_CHANGE_REQUIRED',
          accountId: res?.data?.accountId,
          message: res?.data?.message || 'Bạn cần đổi mật khẩu lần đầu!',
        });
      }
      console.log('login error =', {
        message: err?.message,
        url: err?.config?.baseURL + err?.config?.url,
        status: err?.response?.status,
        data: err?.response?.data,
      }); //clg
      const message = res?.data?.detail || res?.data?.message || 'Đăng nhập thất bại';
      return rejectWithValue({ type: 'GENERAL', message });
    }
  }
);

/**
 * POST /password/first-change -> đổi mật khẩu lần đầu
 * payload: { accountId, newPassword }
 * Nếu thành công trả về true
 * Nếu lỗi trả về message
 */
export const firstChangePassword = createAsyncThunk(
  'auth/firstChangePassword',
  async ({ accountId, newPassword }, { rejectWithValue }) => {
    try {
      await http.post('/auth/password/first-change', { accountId, newPassword });
      return true;
    } catch (err) {
      const res = err?.response;
      const message = res?.data?.detail || res?.data?.message || 'Đổi mật khẩu thất bại';
      return rejectWithValue(message);
    }
  }
);

/**
 * POST /auth/register -> { user, tokens? }
 */
export const register = createAsyncThunk(
  'auth/register',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await http.post('/auth/register', { email, password });
      console.log('authenslice res regis : ', data);
      return data; // { accountId, otpSent, message }
    } catch (err) {
      const message =
        err?.response?.data?.detail || err?.response?.data?.message || 'Đăng ký thất bại';
      return rejectWithValue(message);
    }
  }
);
/**  POST /auth/verify-otp  -> xác thực mã OTP
 * payload gợi ý: { accountId, otp } hoặc { email, otp } tuỳ BE
 */
export const verifyOtp = createAsyncThunk(
  'register/verifyOtp',
  async ({ accountId, otp }, { rejectWithValue }) => {
    try {
      console.log('call verify otp');
      console.log('data verify otp ', accountId, otp);
      const { data } = await http.post('/auth/register/verify', { accountId, otp });
      console.log('data res verify', data);
      // Nếu BE trả tokens + user sau khi verify, có thể lưu tại đây:
      if (data?.tokens) await saveTokens(data.tokens);
      // nếu có user thì return user để set vào store, còn không thì return true
      return data?.user ?? true;
    } catch (err) {
      const message =
        err?.response?.data?.detail || err?.response?.data?.message || 'OTP không hợp lệ';
      return rejectWithValue(message);
    }
  }
);

/**
 * POST /auth/resend-otp  -> gửi lại OTP
 * payload gợi ý: { accountId } hoặc { email }
 */
export const resendOtp = createAsyncThunk(
  'register/resendOtp',
  async ({ accountId }, { rejectWithValue }) => {
    try {
      const { data } = await http.post('/auth/register/resend-otp', { accountId });
      console.log('data resend-OPT', data);
      return data ?? true;
    } catch (err) {
      const message =
        err?.response?.data?.detail || err?.response?.data?.message || 'Không gửi lại được OTP';
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
      const { data } = await http.get('/auth/me'); //mocked
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
    const mod = await import('@/src/services/http');
    delete mod.default.defaults.headers.common['Authorization'];
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
        s.needsPasswordChange = false;
        s.pendingAccountId = null;
      })
      .addCase(login.fulfilled, (s, a) => {
        s.status = 'succeeded';
        if (a.payload && a.payload !== true) s.user = a.payload;
      })
      .addCase(login.rejected, (s, a) => {
        s.status = 'failed';
        if (a.payload?.type === 'PASSWORD_CHANGE_REQUIRED') {
          s.needsPasswordChange = true;
          s.pendingAccountId = a.payload.accountId;
          s.error = a.payload.message || null;
        } else {
          s.error = a.payload?.message || a.error.message;
        }
      });
    // FIRST CHANGE PASSWORD
    builder
      .addCase(firstChangePassword.pending, (s) => {
        s.status = 'loading';
        s.error = null;
      })
      .addCase(firstChangePassword.fulfilled, (s) => {
        s.status = 'succeeded';
        s.needsPasswordChange = false;
        s.pendingAccountId = null;
      })
      .addCase(firstChangePassword.rejected, (s, a) => {
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
        s.registerAccountId = a.payload?.accountId ?? null;
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
      s.needsPasswordChange = false; // << reset
      s.pendingAccountId = null; // << reset
      s.registerAccountId = null; // << reset
      s.otpStatus = 'idle';
      s.otpError = null;
    });
  },
});

export const { setUser } = authSlice.actions;

// ---- Selectors gọn gàng cho UI
export const selectUser = (state) => state.auth.user;
export const selectRole = (state) => state.auth.user?.role ?? null;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;
export const selectNeedsPasswordChange = (state) => state.auth.needsPasswordChange; // <<
export const selectPendingAccountId = (state) => state.auth.pendingAccountId; // <<
export const selectRegisterAccountId = (state) => state.auth.registerAccountId; // <<
export const selectOtpState = (state) => ({
  status: state.auth.otpStatus,
  error: state.auth.otpError,
}); // <<
export default authSlice.reducer;

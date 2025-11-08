import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { transformAppointment } from './transform';
import { apiGetAppointmentById } from './api';
import http from '@/src/services/http';

export const fetchAppointmentById = createAsyncThunk(
  'appointments/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const raw = await apiGetAppointmentById(id);
      const data = transformAppointment(raw);
      return { id, data };
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Request failed';
      return rejectWithValue({ id, message: msg, status: err?.response?.status });
    }
  }
);

export const checkInAppointment = createAsyncThunk(
  'appointments/checkIn',
  async (appointmentId, { rejectWithValue }) => {
    try {
      await http.post(`/api/appointments/${appointmentId}/check-in`, {});
      return appointmentId;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.detail || 'Check-in thất bại');
    }
  }
);

export const startAppointmentRepair = createAsyncThunk(
  'appointments/startRepair',
  async (appointmentId, { rejectWithValue }) => {
    try {
      await http.post(`/api/appointments/${appointmentId}/start-repair`, {});
      return appointmentId;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.detail || 'Bắt đầu sửa chữa thất bại');
    }
  }
);
export const fetchRequestsByApartment = createAsyncThunk(
  'appointments/fetchRequestsByApartment',
  async (apartmentId, { rejectWithValue }) => {
    try {
      const { data } = await http.get(
        `/api/repairrequests/paginate?apartmentId=${apartmentId}`
      );
      // data dạng BE: { size, page, total, items: { $values: [...] } }
      const items = data?.items?.$values ?? [];
      return { apartmentId, requests: items };
    } catch (err) {
      return rejectWithValue(err?.response?.data || 'Fetch failed');
    }
  }
);
const initialState = {
  byId: {},
  loadingById: {},
  errorById: {},
  checkingIn: {},
  requestsByApartment: {}
};

const appointmentsSlice = createSlice({
  name: 'appointments',
  initialState,
  reducers: {
    clearAppointment(state, action) {
      const id = String(action.payload);
      delete state.byId[id];
      delete state.loadingById[id];
      delete state.errorById[id];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAppointmentById.pending, (state, action) => {
        const id = String(action.meta.arg);
        state.loadingById[id] = true;
        state.errorById[id] = null;
      })
      .addCase(fetchAppointmentById.fulfilled, (state, action) => {
        const id = String(action.payload.id);
        state.byId[id] = action.payload.data;
        state.loadingById[id] = false;
        state.errorById[id] = null;
      })
      .addCase(fetchAppointmentById.rejected, (state, action) => {
        const id = String(action.payload?.id || action.meta.arg);
        state.loadingById[id] = false;
        state.errorById[id] = action.payload?.message || 'Failed to fetch appointment';
      })

      // check-in
      .addCase(checkInAppointment.pending, (state, action) => {
        const id = action.meta.arg;
        state.checkingIn[id] = true;
      })
      .addCase(checkInAppointment.fulfilled, (state, action) => {
        const id = action.payload;
        state.checkingIn[id] = false;
        // chưa biết server trả lại appointment mới không,
        // nên để component tự fetch lại
      })
      .addCase(checkInAppointment.rejected, (state, action) => {
        const id = action.meta.arg;
        state.checkingIn[id] = false;
      })
      // lấy đống requests rồi map requestID với appointmentId lấy ra user vì be ko trả
      .addCase(fetchRequestsByApartment.fulfilled, (state, action) => {
        const { apartmentId, requests } = action.payload;
        state.requestsByApartment[apartmentId] = requests;
      });
  },
});

export const { clearAppointment } = appointmentsSlice.actions;

// selectors
export const selectAppointmentById = (state, id) => state.appointments.byId[String(id)] || null;
export const selectAppointmentLoading = (state, id) => !!state.appointments.loadingById[String(id)];
export const selectAppointmentError = (state, id) =>
  state.appointments.errorById[String(id)] || null;

export const selectAppointmentCheckingIn = (state, id) => state.appointments.checkingIn[id];

export default appointmentsSlice.reducer;

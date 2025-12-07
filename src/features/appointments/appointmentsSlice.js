import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiGetAppointmentById } from './api';
import http from '@/src/services/http';
import { monthFromTo, monthKeyOf, pad2 } from '@/src/helper/appointResident';
import { unwrapDotNetValuesDeep } from '@/src/helper/dotnetArr';

export const createAppointment = createAsyncThunk(
  'appointments/create',
  async (appointmentData, { rejectWithValue }) => {
    try {
      const { data } = await http.post('/api/appointments', appointmentData);
      return data;
    } catch (err) {
      const res = err?.response;
      const message =
        res?.data?.detail ||
        res?.data?.message ||
        res?.data ||
        err?.message ||
        'Tạo lịch hẹn thất bại';
      return rejectWithValue({
        status: res?.status,
        message,
      });
    }
  }
);

export const fetchAppointmentById = createAsyncThunk(
  'appointments/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const raw = await apiGetAppointmentById(id);
      const data = unwrapDotNetValuesDeep(raw);
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
export const fetchResidentScheduleByMonth = createAsyncThunk(
  'appointments/fetchResidentScheduleByMonth',
  async ({ year, monthIndex }, { rejectWithValue }) => {
    try {
      const {fromDate, toDate} = monthFromTo(year, monthIndex);
      const { data } = await http.get('/api/appointments/resident-schedule', {
        params: { fromDate, toDate },
      });
      
      const eventsByDate = {};
      const appointmentsByDate = {};
      unwrapDotNetValuesDeep(data).forEach((appt) => {
        const list = appt?.appointments;
        appointmentsByDate[appt.date] = list;
        eventsByDate[appt.date] = list.length;
      });
      return {
        key: monthKeyOf(year, monthIndex),
        year,
        monthIndex,
        fromDate,
        toDate,
        eventsByDate,
        appointmentsByDate,
        fetchedAt: Date.now(),
      };
    } catch (err) {
      const res = err?.response;
      const message =
        res?.data?.detail ||
        res?.data?.message ||
        res?.data ||
        err?.message ||
        'Lấy lịch thất bại';
      return rejectWithValue({ status: res?.status, message });
    }
  }
);
export const completeAppointment = createAsyncThunk(
  'appointments/complete',
  async (
    { id, note , hasNextAppointment , acceptanceTime }, 
    { rejectWithValue }
  ) => {
    try {
      const acceptanceDate =
        acceptanceTime || new Date().toISOString().slice(0, 10);
      const res = await http.post(
        `/api/appointments/${id}/complete`,
        null,
        {
          params: {
            note: note || undefined,
            hasNextAppointment,
            acceptanceTime: acceptanceDate,     
          },
        }
      );
      return { id, message: res?.data };
    } catch (err) {
      const res = err?.response;
      const message =
        res?.data?.detail ||
        res?.data?.message ||
        res?.data ||
        err?.message ||
        'Hoàn tất lịch hẹn thất bại';
      return rejectWithValue({ id, status: res?.status, message });
    }
  }
);
const initialState = {
  byId: {},
  loadingById: {},
  errorById: {},
  checkingIn: {},
  requestsByApartment: {},
  completingById: {},
  creating: false,
  createError: null,
  residentSchedule: {
    byMonth: {},
    loadingByMonth: {},
    errorByMonth: {},
    forceRefetch: false,
  }
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
    // resident schedule
    clearResidentMonth(state, action) {
      const key = action.payload;
      delete state.residentSchedule.byMonth[key];
      delete state.residentSchedule.loadingByMonth[key];
      delete state.residentSchedule.errorByMonth[key];
    },
    setResidentScheduleForceRefetch(state, action) {
      state.residentSchedule.forceRefetch = !!action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // create appointment
      .addCase(createAppointment.pending, (s) => {
        s.creating = true;
        s.createError = null;
      })
      .addCase(createAppointment.fulfilled, (s, a) => {
        s.creating = false;
        s.createError = null;
        // nếu BE trả về appointment mới, ta nhét vào byId luôn
        const raw = a.payload;
        const appt = unwrapDotNetValuesDeep(raw);
        const id = appt?.appointmentId;
        if (id != null) {
          s.byId[String(id)] = appt;
        }
      })
      .addCase(createAppointment.rejected, (s, a) => {
        s.creating = false;
        s.createError = a.payload?.message || a.error?.message || null;
      })
      // fetch by id
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
      })

      // resident schedule by month
      .addCase(fetchResidentScheduleByMonth.pending, (state, action) => {
        const { year, monthIndex } = action.meta.arg;
        const key = monthKeyOf(year, monthIndex);
        state.residentSchedule.loadingByMonth[key] = true;
        state.residentSchedule.errorByMonth[key] = null;
      })
      .addCase(fetchResidentScheduleByMonth.fulfilled, (state, action) => {
        const { key, eventsByDate, appointmentsByDate, fromDate, toDate, fetchedAt } = action.payload;
        state.residentSchedule.loadingByMonth[key] = false;
        state.residentSchedule.errorByMonth[key] = null;
        state.residentSchedule.byMonth[key] = {
          eventsByDate,
          appointmentsByDate,
          fromDate,
          toDate,
          fetchedAt,
        };
        state.residentSchedule.forceRefetch = false;
      })
      .addCase(fetchResidentScheduleByMonth.rejected, (state, action) => {
        const { year, monthIndex } = action.meta.arg || {};
        const key = monthKeyOf(year, monthIndex);
        state.residentSchedule.loadingByMonth[key] = false;
        state.residentSchedule.errorByMonth[key] = action.payload || action.error?.message || 'Error';
      })
      // complete appointment
      .addCase(completeAppointment.pending, (s, a) => {
        const id = Number(a.meta?.arg?.id);
        if (Number.isFinite(id)) s.completingById[id] = true;
      })
      .addCase(completeAppointment.fulfilled, (s, a) => {
        const id = Number(a.payload?.id);
        if (Number.isFinite(id)) {
          s.completingById[id] = false;
          const appt = s.byId[id];
          if (appt) {
            appt.status = 'Completed';
          }
        }
      })
      .addCase(completeAppointment.rejected, (s, a) => {
        const id = Number(a.payload?.id ?? a.meta?.arg?.id);
        if (Number.isFinite(id)) s.completingById[id] = false;
        s.error = a.payload?.message || a.error?.message || null;
      });
  },
});

export const { clearAppointment, clearResidentMonth, setResidentScheduleForceRefetch } = appointmentsSlice.actions;
// selectors
export const selectAppointmentById = (state, id) => state.appointments.byId[String(id)] || null;
export const selectAppointmentLoading = (state, id) => !!state.appointments.loadingById[String(id)];
export const selectAppointmentError = (state, id) =>
  state.appointments.errorById[String(id)] || null;

export const selectAppointmentCheckingIn = (state, id) => state.appointments.checkingIn[id];

export const selectResidentMonthKey = (state, year, monthIndex) => `${year}-${pad2(monthIndex + 1)}`;
// resident schedule by month
export const selectResidentMonthBucket = (state, key) =>
  state.appointments?.residentSchedule?.byMonth?.[key] || {
    eventsByDate: {},
    appointmentsByDate: {},
    fromDate: null,
    toDate: null,
    fetchedAt: null,
  };
export const selectResidentMonthLoading = (state, key) =>
  !!state.appointments?.residentSchedule?.loadingByMonth?.[key];
export const selectResidentMonthError = (state, key) =>
  state.appointments?.residentSchedule?.errorByMonth?.[key] || null;
export const selectResidentEventsByDate = (state, key) =>
  selectResidentMonthBucket(state, key).eventsByDate;
export const selectResidentAppointmentsByDate = (state, key) =>
  selectResidentMonthBucket(state, key).appointmentsByDate;
export const selectResidentDayAppointments = (state, key, dateStr) =>
  (selectResidentAppointmentsByDate(state, key)[dateStr] || []);
// completing
export const selectAppointmentCompleting = (s, id) =>
  !!s.appointments?.completingById?.[Number(id)];
export default appointmentsSlice.reducer;
//create 
export const selectAppointmentCreating = (s) =>
  !!s.appointments?.creating;
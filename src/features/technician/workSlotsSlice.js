import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import http from '@/src/services/http';
import { toYMD } from '@/src/utils/date';
import { mockMySchedule } from '@/src/utils/mockdata';
import { pretty } from '@/src/helper/prettyLog';

/* --------------- Thunks ----------------- */
/** GET /workslots/my-schedule?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD
 *  Response: { $id, $values: [ { date, slots:{ $values:[ { slotId, technicianWorkSlots:{ $values:[{ workSlotId, status, technician:{} }]} } ] } } ] }
 */
export const fetchMySchedule = createAsyncThunk(
  'workslots/fetchMySchedule',
  async ({ fromDate, toDate }, { rejectWithValue }) => {
    try {
      console.log('fetchmychedule http//workslots/my-schedule', { fromDate, toDate });
      const { data } = await http.get('/api/workslots/my-schedule', {
        params: { fromDate, toDate },
      });

      // console.log('[Data]:res fetchmychedule data', pretty(data));
      return data;
    } catch (err) {
      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        'Không tải được lịch làm việc';
      console.log(err);
      return rejectWithValue(message);
    }
  }
);
export const checkInWorkSlot = createAsyncThunk(
  'workslots/checkIn',
  async ({ date, slotId }, { rejectWithValue }) => {
    try {
      const res = await http.patch('/api/workslots/check-in', null, {
        params: { date, slotId },
      });
      return { date, slotId, data: res.data }; // server có thể trả time/current status
    } catch (e) {
      return rejectWithValue(
        e?.response?.data?.detail || e?.response?.data?.message || 'Điểm danh thất bại'
      );
    }
  }
);

export const checkOutWorkSlot = createAsyncThunk(
  'workslots/checkOut',
  async ({ date, slotId }, { rejectWithValue }) => {
    try {
      const res = await http.patch('/api/workslots/check-out', null, {
        params: { date, slotId },
      });
      return { date, slotId, data: res.data };
    } catch (e) {
      return rejectWithValue(
        e?.response?.data?.detail || e?.response?.data?.message || 'Kết ca thất bại'
      );
    }
  }
);
const initialState = {
  raw: null,
  loading: false,
  error: null,
  lastRange: { fromDate: null, toDate: null },
};

const slice = createSlice({
  name: 'workslots',
  initialState,
  reducers: {
    clearWorkSlots(s) {
      s.raw = null;
      s.loading = false;
      s.error = null;
      s.lastRange = { fromDate: null, toDate: null };
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchMySchedule.pending, (s, a) => {
      s.loading = true;
      s.error = null;
      s.lastRange = a.meta?.arg || s.lastRange;
    });
    b.addCase(fetchMySchedule.fulfilled, (s, a) => {
      s.loading = false;
      s.raw = a.payload; // GIỮ NGUYÊN
    });
    b.addCase(fetchMySchedule.rejected, (s, a) => {
      s.loading = false;
      s.error = a.payload || a.error.message;
    });
  },
});

export const { clearWorkSlots } = slice.actions;

export const selectWorkSlotsRaw = (state) => state.workslots.raw;
export const selectWorkSlotsLoading = (state) => state.workslots.loading;
export const selectWorkSlotsError = (state) => state.workslots.error;

export default slice.reducer;

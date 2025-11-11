import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import http from '@/src/services/http';
import { dotnetArr } from '@/src/helper/dotnetArr';

/**
 * Lấy danh sách slot (ca làm) – static theo hệ thống
 * API: GET /api/slots
 */
export const fetchSlots = createAsyncThunk(
  'slots/fetchSlots',
  async (_payload, { rejectWithValue }) => {
    try {
      const { data } = await http.get('/api/slots', { params: { size: 5, page: 1 } });
      // console.log('fetchSlots data http.get(/api/slots,{params:{size:5,page:1}})', data);
      return data;
    } catch (err) {
      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        'Không tải được danh sách ca làm việc';
      console.log(err);
      return rejectWithValue(message);
    }
  }
);

function normalizeSlots(raw) {
  const result = dotnetArr(raw?.items);
  const items = result
    .map((slot) => ({
      slotId: slot.slotId,
      slotName: slot.slotName ?? '',
      fromTime: slot.fromTime ?? '00:00:00',
      toTime: slot.toTime ?? '00:00:00',
      lastUpdated: slot.lastUpdated,
      displayOrder: slot.displayOrder ?? 0,
      status: slot.status ?? 'inactive',
    }))
    .sort((a, b) => (a.fromTime || '').localeCompare(b.fromTime || ''));
  const mapById = {};
  for (const slot of items) mapById[slot.slotId] = slot;
  return { items, mapById };
}

const initialState = {
  raw: null, // gốc từ API nếu muốn xem
  items: [], // danh sách slot đã unwrap $values
  loading: false,
  error: null,
  lastFetchedAt: null,
};

const slice = createSlice({
  name: 'slots',
  initialState,
  reducers: {
    resetSlots(state) {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSlots.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSlots.fulfilled, (state, action) => {
        state.loading = false;
        state.raw = action.payload;
        const { items, mapById } = normalizeSlots(action.payload);
        state.items = items;
        state.mapById = mapById;
        state.lastFetchedAt = Date.now();
      })
      .addCase(fetchSlots.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Không tải được danh sách ca làm việc';
      });
  },
});
export const { resetSlots } = slice.actions;

// Selector
export const selectSlotsArray = (state) => state.slots?.items || [];
export const selectSlotById = (state, slotId) =>
  state.slots?.mapById ? state.slots.mapById[slotId] : null;
export const selectSlotsLoading = (state) => state.slots?.loading;
export const selectSlotsError = (state) => state.slots?.error;
export const selectSlotsMap = (state) => state.slots?.mapById || {};
export default slice.reducer;

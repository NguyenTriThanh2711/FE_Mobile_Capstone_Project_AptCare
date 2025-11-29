import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import http from '@/src/services/http';
import { unwrapDotNetValuesDeep } from '@/src/helper/dotnetArr';

export const fetchFeedbackByRepairRequest = createAsyncThunk(
  'feedback/fetchByRepairRequest',
  async (repairRequestId, { rejectWithValue }) => {
    try {
      const res = await http.get(`/api/feedback/repair-request/${repairRequestId}`);
      const payload = unwrapDotNetValuesDeep(res.data);
      return {
        repairRequestId,
        items: payload || [],
      };
    } catch (error) {
      return rejectWithValue(error.normalized || { message: error.message });
    }
  }
);

export const createFeedback = createAsyncThunk(
  'feedback/create',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await http.post('/api/feedback', payload);
      const data = unwrapDotNetValuesDeep(res.data);
      return data;
    } catch (error) {
      return rejectWithValue(error.normalized || { message: error.message });
    }
  }
);

export const deleteFeedback = createAsyncThunk(
  'feedback/delete',
  async (feedbackId, { rejectWithValue }) => {
    try {
      await http.delete(`/api/feedback/${feedbackId}`);
      return feedbackId;
    } catch (error) {
      return rejectWithValue(error.normalized || { message: error.message });
    }
  }
);

const initialState = {
  byRequestId: {
    // [repairRequestId]: { items: [], loading: false, error: null }
  },
  creating: false,
  deleting: false,
};

const feedbacksSlice = createSlice({
  name: 'feedback',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // ---- FETCH BY REPAIR REQUEST ----
      .addCase(fetchFeedbackByRepairRequest.pending, (state, action) => {
        const id = action.meta.arg;
        if (!state.byRequestId[id]) {
          state.byRequestId[id] = { items: [], loading: false, error: null };
        }
        state.byRequestId[id].loading = true;
        state.byRequestId[id].error = null;
      })
      .addCase(fetchFeedbackByRepairRequest.fulfilled, (state, action) => {
        const { repairRequestId, items } = action.payload;
        state.byRequestId[repairRequestId] = {
          items: items || [],
          loading: false,
          error: null,
        };
      })
      .addCase(fetchFeedbackByRepairRequest.rejected, (state, action) => {
        const id = action.meta.arg;
        if (!state.byRequestId[id]) {
          state.byRequestId[id] = { items: [], loading: false, error: null };
        }
        state.byRequestId[id].loading = false;
        state.byRequestId[id].error = action.payload || action.error;
      })

      // ---- CREATE FEEDBACK ----
      .addCase(createFeedback.pending, (state) => {
        state.creating = true;
      })
      .addCase(createFeedback.fulfilled, (state, action) => {
        state.creating = false;
        const fb = action.payload;
        if (!fb || !fb.repairRequestId) return;

        const bucket =
          state.byRequestId[fb.repairRequestId] ||
          (state.byRequestId[fb.repairRequestId] = {
            items: [],
            loading: false,
            error: null,
          });
        bucket.items.push(fb);
      })
      .addCase(createFeedback.rejected, (state) => {
        state.creating = false;
      })

      // ---- DELETE FEEDBACK ----
      .addCase(deleteFeedback.pending, (state) => {
        state.deleting = true;
      })
      .addCase(deleteFeedback.fulfilled, (state, action) => {
        state.deleting = false;
        const feedbackId = action.payload;
        Object.values(state.byRequestId).forEach((bucket) => {
          bucket.items = bucket.items.filter(
            (x) => x.feedbackId !== feedbackId
          );
        });
      })
      .addCase(deleteFeedback.rejected, (state) => {
        state.deleting = false;
      });
  },
});

// ---- SELECTORS ----
export const selectFeedbackByRepairRequest = (state, repairRequestId) =>
  state.feedbacks.byRequestId[repairRequestId]?.items || [];

export const selectFeedbackLoadingByRepairRequest = (state, repairRequestId) =>
  state.feedbacks.byRequestId[repairRequestId]?.loading || false;

export const selectFeedbackCreating = (state) => state.feedbacks.creating;

export default feedbacksSlice.reducer;

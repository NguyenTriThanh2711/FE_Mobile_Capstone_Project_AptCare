import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import http from '@/src/services/http';
import { dotnetArr } from '@/src/helper/dotnetArr';

export const fetchRepairRequestTasksByRepairRequest = createAsyncThunk(
  'repairRequestTasks/fetchByRepairRequest',
  async (repairRequestId, { rejectWithValue }) => {
    try {
      const { data } = await http.get(
        '/api/repairrequesttasks/by-repair-request',
        {
          params: { repairRequestId },
        }
      );
      const list = dotnetArr(data) || [];

      return {
        repairRequestId: Number(repairRequestId),
        tasks: list,
      };
    } catch (err) {
      const res = err?.response;
      const message =
        res?.data?.detail ||
        res?.data?.message ||
        res?.data ||
        err?.message ||
        'Lấy checklist nhiệm vụ thất bại';

      return rejectWithValue({
        repairRequestId: Number(repairRequestId),
        status: res?.status,
        message,
      });
    }
  }
);

const initialState = {
  byRepairRequestId: {},
  loadingByRepairRequestId: {},
  errorByRepairRequestId: {},
};

const repairRequestTasksSlice = createSlice({
  name: 'repairRequestTasks',
  initialState,
  reducers: {
    clearTasksByRepairRequest(state, action) {
      const id = Number(action.payload);
      if (!Number.isFinite(id)) return;
      delete state.byRepairRequestId[id];
      delete state.loadingByRepairRequestId[id];
      delete state.errorByRepairRequestId[id];
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchRepairRequestTasksByRepairRequest
      .addCase(fetchRepairRequestTasksByRepairRequest.pending, (state, action) => {
        const id = Number(action.meta.arg);
        if (!Number.isFinite(id)) return;
        state.loadingByRepairRequestId[id] = true;
        state.errorByRepairRequestId[id] = null;
      })
      .addCase(fetchRepairRequestTasksByRepairRequest.fulfilled, (state, action) => {
        const { repairRequestId, tasks } = action.payload || {};
        const id = Number(repairRequestId);
        if (!Number.isFinite(id)) return;

        state.loadingByRepairRequestId[id] = false;
        state.errorByRepairRequestId[id] = null;
        state.byRepairRequestId[id] = tasks || [];
      })
      .addCase(fetchRepairRequestTasksByRepairRequest.rejected, (state, action) => {
        const id = Number(
          action.payload?.repairRequestId ?? action.meta.arg
        );
        if (!Number.isFinite(id)) return;

        state.loadingByRepairRequestId[id] = false;
        state.errorByRepairRequestId[id] =
          action.payload?.message || action.error?.message || 'Lỗi lấy checklist';
      });
  },
});

export const { clearTasksByRepairRequest } = repairRequestTasksSlice.actions;

export const selectTasksByRepairRequestId = (state, repairRequestId) => {
  const id = Number(repairRequestId);
  if (!Number.isFinite(id)) return [];
  return state.repairRequestTasks?.byRepairRequestId?.[id] || [];
};
export const selectTasksLoadingByRepairRequestId = (state, repairRequestId) => {
  const id = Number(repairRequestId);
  if (!Number.isFinite(id)) return false;
  return !!state.repairRequestTasks?.loadingByRepairRequestId?.[id];
};
export const selectTasksErrorByRepairRequestId = (state, repairRequestId) => {
  const id = Number(repairRequestId);
  if (!Number.isFinite(id)) return null;
  return state.repairRequestTasks?.errorByRepairRequestId?.[id] || null;
};

export default repairRequestTasksSlice.reducer;

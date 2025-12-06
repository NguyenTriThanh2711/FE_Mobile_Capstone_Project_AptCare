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

export const updateRepairRequestTasksBatch = createAsyncThunk(
  'repairRequestTasks/batchUpdate',
  async ({ repairRequestId, items }, { rejectWithValue }) => {
    try {
      const { data } = await http.put(
        `/api/repairrequesttasks/repair-request/${repairRequestId}/batch-update`,
        items
      );

      return {
        repairRequestId: Number(repairRequestId),
        message: data,
      };
    } catch (err) {
      const res = err?.response;
      const message =
        res?.data?.detail ||
        res?.data?.message ||
        res?.data ||
        err?.message ||
        'Cập nhật checklist nhiệm vụ thất bại';

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
  updatingByRepairRequestId: {},
  updateErrorByRepairRequestId: {},
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
      delete state.updatingByRepairRequestId[id];
      delete state.updateErrorByRepairRequestId[id];
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
      })

      // updateRepairRequestTasksBatch
      .addCase(updateRepairRequestTasksBatch.pending, (state, action) => {
        const id = Number(action.meta.arg?.repairRequestId);
        if (!Number.isFinite(id)) return;
        state.updatingByRepairRequestId[id] = true;
        state.updateErrorByRepairRequestId[id] = null;
      })
      .addCase(updateRepairRequestTasksBatch.fulfilled, (state, action) => {
        const id = Number(action.payload?.repairRequestId);
        if (!Number.isFinite(id)) return;
        state.updatingByRepairRequestId[id] = false;
        state.updateErrorByRepairRequestId[id] = null;
        // tuỳ nếu BE trả lại tasks mới thì mình có thể merge,
        // hiện tại API docs nói trả về string -> không cập nhật byRepairRequestId ở đây.
      })
      .addCase(updateRepairRequestTasksBatch.rejected, (state, action) => {
        const id = Number(
          action.payload?.repairRequestId ?? action.meta.arg?.repairRequestId
        );
        if (!Number.isFinite(id)) return;
        state.updatingByRepairRequestId[id] = false;
        state.updateErrorByRepairRequestId[id] =
          action.payload?.message ||
          action.error?.message ||
          'Cập nhật checklist nhiệm vụ thất bại';
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
export const selectTasksUpdatingByRepairRequestId = (state,repairRequestId) => {
  const id = Number(repairRequestId);
  if (!Number.isFinite(id)) return false;
  return !!state.repairRequestTasks?.updatingByRepairRequestId?.[id];
};

export const selectTasksUpdateErrorByRepairRequestId = (state,repairRequestId) => {
  const id = Number(repairRequestId);
  if (!Number.isFinite(id)) return null;
  return state.repairRequestTasks?.updateErrorByRepairRequestId?.[id] || null;
};
export default repairRequestTasksSlice.reducer;
